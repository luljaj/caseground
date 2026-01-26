import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TargetRole } from "@/types";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("target_role, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    preferences: profile ?? { target_role: null, onboarding_completed_at: null },
  });
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
  const targetRole = body?.target_role as TargetRole | null | undefined;
  const skipped = Boolean(body?.skipped);

  const updateData: Record<string, string | null> = {
    onboarding_completed_at: new Date().toISOString(),
  };

  if (!skipped) {
    updateData.target_role = targetRole ?? null;
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
