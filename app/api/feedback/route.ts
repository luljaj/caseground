import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
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

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("ai_credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "User profile not found." }, { status: 404 });
  }

  if (profile.ai_credits <= 0) {
    return NextResponse.json({ error: "No credits remaining." }, { status: 400 });
  }

  const { data: responseRow, error: responseError } = await supabase
    .from("user_responses")
    .select("id, response, question_id, ai_feedback")
    .eq("id", responseId)
    .eq("user_id", user.id)
    .single();

  if (responseError || !responseRow) {
    return NextResponse.json({ error: "Response not found." }, { status: 404 });
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("prompt, rubric")
    .eq("id", responseRow.question_id)
    .single();

  if (questionError || !question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json({ error: "AI API not configured." }, { status: 500 });
  }

  const aiResponse = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: question.prompt,
      rubric: question.rubric,
      response: responseRow.response,
    }),
  });

  const rawText = await aiResponse.text();
  let feedback = rawText;

  try {
    const parsed = JSON.parse(rawText);
    feedback =
      parsed.feedback ??
      parsed.output ??
      parsed.text ??
      parsed.message ??
      parsed?.choices?.[0]?.message?.content ??
      rawText;
  } catch (_error) {
    feedback = rawText;
  }

  if (!aiResponse.ok) {
    return NextResponse.json({ error: feedback }, { status: 502 });
  }

  const creditsRemaining = Math.max(0, profile.ai_credits - 1);

  const { error: updateResponseError } = await supabase
    .from("user_responses")
    .update({ ai_feedback: feedback })
    .eq("id", responseId)
    .eq("user_id", user.id);

  if (updateResponseError) {
    return NextResponse.json(
      { error: updateResponseError.message },
      { status: 500 }
    );
  }

  const { error: updateUserError } = await supabase
    .from("users")
    .update({ ai_credits: creditsRemaining })
    .eq("id", user.id);

  if (updateUserError) {
    return NextResponse.json(
      { error: updateUserError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ feedback, creditsRemaining });
}
