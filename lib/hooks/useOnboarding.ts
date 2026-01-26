"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import type { TargetRole, UserPreferences } from "@/types";

export function useOnboarding() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPreferences() {
      if (!user) {
        if (isMounted) {
          setPreferences(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/user/preferences", { cache: "no-store" });
        if (!res.ok) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        const payload = await res.json();
        if (isMounted) {
          setPreferences(payload.preferences ?? null);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPreferences();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const completeOnboarding = async (targetRole: TargetRole | null, skipped = false) => {
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_role: targetRole, skipped }),
      });

      if (res.ok) {
        setPreferences({
          target_role: skipped ? preferences?.target_role ?? null : targetRole,
          onboarding_completed_at: new Date().toISOString(),
        });
        return true;
      }
    } catch {
      return false;
    }

    return false;
  };

  const hasCompletedOnboarding = Boolean(preferences?.onboarding_completed_at);

  return {
    loading,
    preferences,
    hasCompletedOnboarding,
    completeOnboarding,
  };
}
