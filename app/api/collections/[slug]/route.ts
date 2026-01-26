import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = await createSupabaseServerClient();

  const { data: collection, error } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !collection) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }

  const problemIds = Array.isArray(collection.problem_ids)
    ? (collection.problem_ids as string[])
    : [];

  let problems: Array<Record<string, unknown>> = [];

  if (problemIds.length > 0) {
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id, title, track, category, suggested_time, example_answer")
      .in("id", problemIds);

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    const byId = new Map(
      (questions ?? []).map((question) => [question.id, question])
    );

    problems = problemIds
      .map((id) => byId.get(id))
      .filter(Boolean) as Array<Record<string, unknown>>;
  }

  return NextResponse.json({ collection, problems });
}
