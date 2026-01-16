"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return <div className="text-xs text-text-secondary">Loading...</div>;
  }

  if (!user) {
    return (
      <Button variant="secondary" size="sm" onClick={signInWithGoogle}>
        Sign In
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary transition hover:text-text-primary"
        onClick={() => setOpen((prev) => !prev)}
      >
        {user.email ?? "Signed in"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-surface p-2 text-sm shadow-lg">
          <button
            className="w-full rounded-lg px-3 py-2 text-left text-text-secondary transition hover:bg-border/40 hover:text-text-primary"
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
