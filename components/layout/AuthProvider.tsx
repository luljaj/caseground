"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/lib/hooks/useAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session ?? null);
        setLoading(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const getRedirectBase = useCallback(() => {
    return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  }, []);

  const getSafeNextPath = useCallback((nextPath?: string) => {
    return nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/problems";
  }, []);

  const signInWithGoogle = useCallback(
    async (nextPath?: string) => {
      const redirectBase = getRedirectBase();
      const safeNext = getSafeNextPath(nextPath);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectBase}/auth/callback?next=${encodeURIComponent(
            safeNext
          )}`,
        },
      });
    },
    [supabase, getRedirectBase, getSafeNextPath]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    [supabase]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, nextPath?: string) => {
      const redirectBase = getRedirectBase();
      const safeNext = getSafeNextPath(nextPath);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${redirectBase}/auth/callback?next=${encodeURIComponent(
            safeNext
          )}`,
        },
      });
      return { error };
    },
    [supabase, getRedirectBase, getSafeNextPath]
  );

  const resetPassword = useCallback(
    async (email: string) => {
      const redirectBase = getRedirectBase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectBase}/auth/callback?type=recovery`,
      });
      return { error };
    },
    [supabase, getRedirectBase]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        supabase,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
