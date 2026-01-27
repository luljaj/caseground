import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const collectionId = body?.collection_id as string | undefined;

  if (!collectionId) {
    return NextResponse.json(
      { error: "Missing collection_id." },
      { status: 400 }
    );
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
        { error: "No credits remaining.", credits_remaining: 0 },
        { status: 400 }
      );
    }

    if (reason === "monthly_limit_exceeded") {
      return NextResponse.json(
        { error: "Monthly usage limit reached. Please try again next month." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to process request." },
      { status: 500 }
    );
  }

  const wasSubscription = deductResult.is_subscription;
  const refundCredit = async () => {
    await supabase.rpc("refund_credit", {
      p_user_id: user.id,
      p_was_subscription: wasSubscription,
    });
  };

  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("id, name, problem_ids")
    .eq("id", collectionId)
    .single();

  if (collectionError || !collection) {
    await refundCredit();
    return NextResponse.json(
      { error: "Collection not found." },
      { status: 404 }
    );
  }

  const { data: completion } = await supabase
    .from("user_collection_completions")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("collection_id", collectionId)
    .single();

  if (!completion) {
    await refundCredit();
    return NextResponse.json(
      { error: "You must complete the collection before requesting feedback." },
      { status: 400 }
    );
  }

  const problemIds = Array.isArray(collection.problem_ids)
    ? (collection.problem_ids as string[])
    : [];

  if (problemIds.length === 0) {
    await refundCredit();
    return NextResponse.json(
      { error: "Collection has no problems." },
      { status: 400 }
    );
  }

  const { data: responses, error: responsesError } = await supabase
    .from("user_responses")
    .select(
      `
      id,
      question_id,
      response,
      ai_feedback,
      questions!inner (
        title,
        prompt,
        rubric
      )
    `
    )
    .eq("user_id", user.id)
    .in("question_id", problemIds)
    .order("created_at", { ascending: true });

  if (responsesError || !responses || responses.length === 0) {
    await refundCredit();
    return NextResponse.json(
      { error: "No responses found for this collection." },
      { status: 404 }
    );
  }

  const systemPrompt = `You are an interview coach providing aggregate feedback on a completed case interview practice collection.

## Instructions
- Analyze the user's performance across ALL problems in this collection
- Identify patterns: consistent strengths and recurring weaknesses
- Provide actionable recommendations for improvement
- Be encouraging but honest
- Keep the summary concise (max 500 words)

## Format
Use this structure:

### Overall Performance
[1-2 sentence summary of overall performance]

### Consistent Strengths
- [strength 1]
- [strength 2]

### Areas for Improvement
- [improvement 1]
- [improvement 2]

### Recommended Next Steps
[2-3 specific actions the user should take]`;

  let userPrompt = `# Collection: ${collection.name}\n\n`;
  userPrompt += `The user completed ${responses.length} problems. Here are their responses and any individual feedback received:\n\n`;

  responses.forEach((entry, index) => {
    const questionData = entry.questions as
      | { title?: string | null; prompt?: string | null; rubric?: string | null }
      | Array<{ title?: string | null; prompt?: string | null; rubric?: string | null }>
      | null;
    const question = Array.isArray(questionData) ? questionData[0] : questionData;
    const title = question?.title?.trim() || "Untitled Problem";
    const prompt = question?.prompt?.trim() || "No prompt provided.";

    userPrompt += `## Problem ${index + 1}: ${title}\n`;
    userPrompt += `**Question:** ${prompt.slice(0, 200)}...\n\n`;
    userPrompt += `**User's Response:**\n${entry.response.slice(0, 500)}${entry.response.length > 500 ? "..." : ""}\n\n`;
    if (entry.ai_feedback) {
      userPrompt += `**Individual Feedback Summary:**\n${entry.ai_feedback.slice(0, 300)}...\n\n`;
    }
    userPrompt += `---\n\n`;
  });

  userPrompt += `\nProvide aggregate feedback analyzing patterns across all ${responses.length} problems.`;

  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const defaultModel = process.env.DEFAULT_MODEL?.trim();

  if (!apiUrl || !apiKey || !defaultModel) {
    await refundCredit();
    return NextResponse.json(
      { error: "AI API not configured." },
      { status: 500 }
    );
  }

  const promptHash = createHash("sha256")
    .update(`${systemPrompt}\n\n${userPrompt}`)
    .digest("hex");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Title": "Caseground",
  };

  const referer = process.env.NEXT_PUBLIC_APP_URL;
  if (referer) {
    headers["HTTP-Referer"] = referer;
  }

  const startTime = Date.now();
  const aiResponse = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: defaultModel,
      temperature: 0.4,
      max_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  const generationTime = Date.now() - startTime;

  const rawText = await aiResponse.text();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }

  const content =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { choices?: { message?: { content?: string } }[] })
        ?.choices?.[0]?.message?.content ?? rawText
      : rawText;

  const feedback =
    typeof content === "string" ? content : JSON.stringify(content ?? rawText);

  if (!aiResponse.ok) {
    await refundCredit();
    return NextResponse.json(
      { error: "AI API error. Please try again." },
      { status: 502 }
    );
  }

  const cleanedFeedback = feedback.trim();

  if (!cleanedFeedback) {
    await refundCredit();
    return NextResponse.json(
      { error: "AI API returned empty feedback." },
      { status: 502 }
    );
  }

  const tokensUsed =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { usage?: { total_tokens?: number } })?.usage?.total_tokens ?? null
      : null;

  const { data: feedbackRow, error: insertError } = await supabase
    .from("ai_feedback")
    .insert({
      user_id: user.id,
      collection_id: collectionId,
      response_id: null,
      feedback_type: "collection",
      content: cleanedFeedback,
      model: defaultModel,
      tokens_used: tokensUsed,
      generation_time_ms: generationTime,
      prompt_hash: promptHash,
      status: "completed",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to store collection feedback:", insertError);
  }

  return NextResponse.json({
    feedback: cleanedFeedback,
    feedbackEntry: feedbackRow ?? null,
    creditsRemaining: wasSubscription ? null : deductResult.credits_remaining,
  });
}
