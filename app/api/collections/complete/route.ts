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

  const { data, error } = await supabase
    .from("user_collection_completions")
    .select("user_id, collection_id, completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ completions: data ?? [] });
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
  const collectionId = body?.collection_id as string | undefined;

  if (!collectionId) {
    return NextResponse.json({ error: "Missing collection_id." }, { status: 400 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("user_collection_completions")
    .insert({
      user_id: user.id,
      collection_id: collectionId,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError && insertError.code !== "23505") {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (inserted) {
    return NextResponse.json({ completion: inserted });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("user_collection_completions")
    .select("user_id, collection_id, completed_at")
    .eq("user_id", user.id)
    .eq("collection_id", collectionId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ completion: existing });
}
