"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroCard } from "@/components/ui/HeroCard";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AuthButton() {
  const { user, loading, signOut, supabase } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setUsername(null);
      setIsUsernameLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsUsernameLoading(true);

    async function loadUsername(currentUserId: string, fallbackEmail?: string | null) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("username")
          .eq("id", currentUserId)
          .single();

        if (!isMounted) {
          return;
        }

        if (error) {
          setUsername(fallbackEmail?.split("@")[0] ?? "User");
          return;
        }

        setUsername(data?.username ?? fallbackEmail?.split("@")[0] ?? "User");
      } finally {
        if (isMounted) {
          setIsUsernameLoading(false);
        }
      }
    }

    loadUsername(user.id, user.email);

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  if (loading) {
    return <div className="text-xs text-text-secondary">Loading...</div>;
  }

  if (!user) {
    return (
      <button
        type="button"
        className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60"
        onClick={() => router.push("/signin")}
      >
        <HeroCard
          username="Sign in"
          email=""
          variant="dark"
        />
      </button>
    );
  }

  const displayName = username ?? "User";
  const displayEmail = user.email ?? "Signed in";
  const cardName = isUsernameLoading ? "Loading..." : displayName;
  const cardEmail = isUsernameLoading ? "Fetching profile" : displayEmail;

  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60 disabled:cursor-not-allowed disabled:opacity-70"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={isUsernameLoading}
      >
        <HeroCard username={cardName} email={cardEmail} variant="dark" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-surface p-2 text-sm shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
          <button
            className="w-full rounded-md px-3 py-2 text-left text-[13px] text-text-secondary transition-colors duration-150 hover:bg-border/40 hover:text-text-primary"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
