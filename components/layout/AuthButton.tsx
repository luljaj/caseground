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

  // Common button styles
  const buttonClasses =
    "flex items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 shadow-lg shadow-zinc-950/20 ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60";

  if (!user) {
    return (
      <button
        type="button"
        className={buttonClasses}
        onClick={() => router.push("/signin")}
      >
        Sign in
      </button>
    );
  }

  const displayName = username ?? "User";
  const cardName = isUsernameLoading ? "Loading..." : displayName;

  return (
    <div className="relative">
      <button
        type="button"
        className={buttonClasses}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={isUsernameLoading}
      >
        <span className="truncate max-w-[100px] block">{cardName}</span>
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
