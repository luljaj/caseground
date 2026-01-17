"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (loading) {
    return <div className="text-xs text-text-secondary">Loading...</div>;
  }

  if (!user) {
    return (
      <Button variant="secondary" size="sm" onClick={() => router.push("/signin")}>
        Sign In
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        className="rounded-md border border-border bg-surface px-3 py-1 text-[13px] text-text-secondary transition-colors duration-150 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        onClick={() => setOpen((prev) => !prev)}
      >
        {user.email ?? "Signed in"}
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
