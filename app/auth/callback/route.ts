import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next") ?? "/problems";
  const nextPath =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/problems";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Handle email verification and password reset via token_hash
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "recovery" | "invite" | "magiclink" | "email_change",
    });

    if (error) {
      return NextResponse.redirect(`${origin}/signin?error=expired_link`);
    }

    // If this is a password recovery, redirect to reset password page
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    // For email confirmation, check if user has username
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("username")
        .eq("id", session.session.user.id)
        .single();

      if (profileError || !profile?.username) {
        const onboardingUrl = new URL("/onboarding", origin);
        onboardingUrl.searchParams.set("next", nextPath);
        return NextResponse.redirect(onboardingUrl.toString());
      }
    }

    return NextResponse.redirect(`${origin}${nextPath}`);
  }

  // Handle OAuth code exchange (Google, etc.)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = data.user;
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.username) {
          const onboardingUrl = new URL("/onboarding", origin);
          onboardingUrl.searchParams.set("next", nextPath);
          return NextResponse.redirect(onboardingUrl.toString());
        }
      }

      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/signin?error=auth_callback_error`);
}
