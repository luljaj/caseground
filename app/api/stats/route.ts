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

  // Get type breakdown (estimations, behaviorals, reasoning)
  const { data: typeData, error: typeError } = await supabase
    .from("user_responses")
    .select(`
      question_id,
      questions!inner (
        track
      )
    `)
    .eq("user_id", user.id);

  if (typeError) {
    return NextResponse.json({ error: typeError.message }, { status: 500 });
  }

  // Count unique questions per type
  const uniqueByType = new Map<string, Set<string>>();
  (typeData ?? []).forEach((response: any) => {
    const track = response.questions?.track;
    if (!track) return;

    if (!uniqueByType.has(track)) {
      uniqueByType.set(track, new Set());
    }
    uniqueByType.get(track)?.add(response.question_id);
  });

  const byType = {
    estimations: uniqueByType.get("estimations")?.size ?? 0,
    behaviorals: uniqueByType.get("behaviorals")?.size ?? 0,
    reasoning: uniqueByType.get("reasoning")?.size ?? 0,
  };

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
    byType,
  });
}
