import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("ai_credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "User profile not found." }, { status: 404 });
  }

  const { data: responses, error: responsesError } = await supabase
    .from("user_responses")
    .select("question_id, created_at")
    .eq("user_id", user.id);

  if (responsesError) {
    return NextResponse.json({ error: responsesError.message }, { status: 500 });
  }

  const totalAttempted = new Set(
    (responses ?? []).map((entry) => entry.question_id)
  ).size;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 364);

  const heatmapMap = new Map<string, number>();
  (responses ?? []).forEach((entry) => {
    const createdAt = new Date(entry.created_at);
    if (createdAt < cutoff) {
      return;
    }
    const dateKey = createdAt.toISOString().slice(0, 10);
    heatmapMap.set(dateKey, (heatmapMap.get(dateKey) ?? 0) + 1);
  });

  const heatmap = Array.from(heatmapMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return NextResponse.json({
    totalAttempted,
    aiCredits: profile.ai_credits,
    heatmap,
  });
}
