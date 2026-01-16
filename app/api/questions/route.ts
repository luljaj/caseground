import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const track = searchParams.get("track");
  const category = searchParams.get("category");
  const pageParam = Number(searchParams.get("page") ?? 1);
  const perPageParam = Number(searchParams.get("perPage") ?? 30);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const perPage =
    Number.isFinite(perPageParam) && perPageParam > 0 ? perPageParam : 30;
  const sortField = searchParams.get("sort") ?? "number";
  const sortDirection = searchParams.get("direction") ?? "asc";

  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("questions")
    .select("*", { count: "exact" });

  if (track) {
    query = query.eq("track", track);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const orderField = sortField === "track" ? "track" : "number";
  const ascending = sortDirection !== "desc";

  query = query.order(orderField, { ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    questions: data ?? [],
    total: count ?? 0,
  });
}
