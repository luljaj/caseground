"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { getUsernameError, normalizeUsername } from "@/lib/utils/username";

const fallbackNextPath = "/problems";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallbackNextPath;
  }
  return value;
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signInWithGoogle } = useAuth();
  const nextPath = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams]
  );

  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/user", { cache: "no-store" });
        if (!response.ok) {
          if (isMounted) {
            setIsLoadingProfile(false);
          }
          return;
        }

        const payload = await response.json();
        const existing = payload.user?.username as string | null | undefined;

        if (!isMounted) {
          return;
        }

        if (existing) {
          router.replace(nextPath);
          return;
        }

        const suggestion = user.email?.split("@")[0] ?? "";
        const normalizedSuggestion = normalizeUsername(suggestion)
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 20);

        if (normalizedSuggestion) {
          setUsername(normalizedSuggestion);
        }

        setIsLoadingProfile(false);
      } catch {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [loading, user, nextPath, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeUsername(username);
    const validationError = getUsernameError(normalized);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Unable to save username.");
        return;
      }

      router.replace(nextPath);
    } catch {
      setError("Unable to save username.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoadingProfile) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={24} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-white/5 bg-surface/30 p-8 text-center">
        <h1 className="text-xl font-semibold text-text-primary">
          Sign in to choose a username
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Your username is used to identify your account.
        </p>
        <div className="mt-6 flex justify-center">
          <Button size="sm" onClick={() => signInWithGoogle()}>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 pb-12">
      <div className="rounded-lg border border-white/5 bg-surface/30 p-8">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
            Profile
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">
            Choose a username
          </h1>
          <p className="text-sm text-text-secondary">
            This will be used for your profile and saved responses.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-md border border-error/40 bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-xs font-medium uppercase tracking-wider text-text-secondary/60"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={20}
              pattern="[a-z0-9_]{3,20}"
              value={username}
              onChange={(event) => {
                setUsername(normalizeUsername(event.target.value));
                if (error) {
                  setError(null);
                }
              }}
              placeholder="e.g. casecrush"
              className="h-10 w-full rounded-md border border-white/[0.08] bg-transparent px-3 text-[14px] text-text-primary placeholder:text-text-muted transition-all duration-150 focus:border-white/[0.12] focus:outline-none focus:ring-1 focus:ring-white/10"
            />
            <p className="text-xs text-text-muted">
              3-20 characters, lowercase letters, numbers, or underscores.
            </p>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Saving..." : "Save username"}
          </Button>
        </form>
      </div>
    </div>
  );
}
