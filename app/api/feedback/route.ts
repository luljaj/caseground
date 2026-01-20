import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatRubric(rubric: unknown): string {
  if (!Array.isArray(rubric)) {
    return "";
  }

  const lines = rubric
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }
      if (item && typeof item === "object" && "text" in item) {
        const value = (item as { text?: unknown }).text;
        return typeof value === "string" ? value.trim() : "";
      }
      return "";
    })
    .filter((line): line is string => Boolean(line));

  if (lines.length === 0) {
    return "";
  }

  return lines.map((line) => `- ${line}`).join("\n");
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const responseId = body?.response_id as string | undefined;

  if (!responseId) {
    return NextResponse.json({ error: "Missing response_id." }, { status: 400 });
  }

  const { data: deductResult, error: deductError } = await supabase.rpc(
    "deduct_credit_atomic",
    { p_user_id: user.id }
  );

  if (deductError || !deductResult?.success) {
    const reason = deductResult?.reason || "deduction_failed";

    if (reason === "rate_limited") {
      return NextResponse.json(
        {
          error: "Please wait before generating more feedback.",
          retry_after: deductResult.retry_after,
        },
        { status: 429 }
      );
    }

    if (reason === "no_credits") {
      return NextResponse.json(
        {
          error: "No credits remaining.",
          credits_remaining: 0,
        },
        { status: 400 }
      );
    }

    if (reason === "monthly_limit_exceeded") {
      return NextResponse.json(
        {
          error: "Monthly usage limit reached. Please try again next month.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Unable to process request." }, { status: 500 });
  }

  const wasSubscription = deductResult.is_subscription;
  const refundCredit = async () => {
    await supabase.rpc("refund_credit", {
      p_user_id: user.id,
      p_was_subscription: wasSubscription,
    });
  };

  const { data: responseRow, error: responseError } = await supabase
    .from("user_responses")
    .select("id, response, question_id, ai_feedback")
    .eq("id", responseId)
    .eq("user_id", user.id)
    .single();

  if (responseError || !responseRow) {
    await refundCredit();
    return NextResponse.json({ error: "Response not found." }, { status: 404 });
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("prompt, rubric, description")
    .eq("id", responseRow.question_id)
    .single();

  if (questionError || !question) {
    await refundCredit();
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const defaultModel = process.env.DEFAULT_MODEL?.trim();

  if (!apiUrl || !apiKey || !defaultModel) {
    await refundCredit();
    return NextResponse.json({ error: "AI API not configured." }, { status: 500 });
  }

  const rubricText = formatRubric(question.rubric);

  // Configurable system prompt via environment variable
  const defaultSystemPrompt = `You are an interview coach providing feedback on case interview responses.

## Instructions
- Analyze the candidate's response against the rubric criteria
- Provide specific, actionable feedback
- Use markdown formatting for clear structure
- Include "Strengths" and "Areas for Improvement" sections
- Be encouraging but honest
- Keep feedback concise (4-6 key points)

## Format
Use this structure:
### Strengths
- [strength 1]
- [strength 2]

### Areas for Improvement
- [improvement 1]
- [improvement 2]

### Overall
[1-2 sentence summary]`;

  const systemPrompt = process.env.AI_SYSTEM_PROMPT || defaultSystemPrompt;

  const promptParts = [
    `Question:\n${question.prompt}`,
    question.description ? `Description:\n${question.description}` : "",
    rubricText ? `Rubric:\n${rubricText}` : "",
    `Candidate response:\n${responseRow.response}`,
  ].filter((part) => Boolean(part));
  const userPrompt = promptParts.join("\n\n");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Title": "Caseground",
  };
  const referer = process.env.NEXT_PUBLIC_APP_URL;
  if (referer) {
    headers["HTTP-Referer"] = referer;
  }

  const aiResponse = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: defaultModel,
      temperature: 0.4,
      max_tokens: 350,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const rawText = await aiResponse.text();
  let parsed: unknown = null;

  try {
    parsed = JSON.parse(rawText);
  } catch (_error) {
    parsed = null;
  }

  const content =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { choices?: { message?: { content?: string }; text?: string }[] })
        ?.choices?.[0]?.message?.content ??
      (parsed as { choices?: { message?: { content?: string }; text?: string }[] })
        ?.choices?.[0]?.text ??
      (parsed as { output?: string }).output ??
      (parsed as { feedback?: string }).feedback ??
      (parsed as { text?: string }).text ??
      (parsed as { message?: string }).message ??
      rawText
      : rawText;

  const feedback =
    typeof content === "string" ? content : JSON.stringify(content ?? rawText);

  if (!aiResponse.ok) {
    await refundCredit();
    const errorMessage =
      typeof parsed === "object" && parsed !== null
        ? (parsed as { error?: { message?: string } }).error?.message ?? feedback
        : feedback;
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }

  const cleanedFeedback = feedback.trim();

  if (!cleanedFeedback) {
    await refundCredit();
    return NextResponse.json(
      { error: "AI API returned empty feedback." },
      { status: 502 }
    );
  }

  const { error: updateResponseError } = await supabase
    .from("user_responses")
    .update({ ai_feedback: cleanedFeedback })
    .eq("id", responseId)
    .eq("user_id", user.id);

  if (updateResponseError) {
    await refundCredit();
    return NextResponse.json(
      { error: updateResponseError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    feedback: cleanedFeedback,
    creditsRemaining: wasSubscription ? null : deductResult.credits_remaining,
  });
}
