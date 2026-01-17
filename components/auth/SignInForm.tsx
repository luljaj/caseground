"use client";

import { SignInButton } from "@/components/auth/SignInButton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function SignInForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const nextPath = searchParams.get("next") ?? undefined;

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-[24px] md:text-[28px] font-semibold tracking-tight text-white">
          Sign in to <span className="italic">caseground</span>
        </h2>
        <p className="mt-2 text-[14px] text-text-secondary">
          Continue with your Google account
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-error/40 bg-error/10 p-4 text-sm text-error">
          {error === "auth_callback_error"
            ? "Authentication failed. Please try again."
            : "An error occurred during sign in."}
        </div>
      )}

      <SignInButton nextPath={nextPath} />

      <p className="text-center text-[13px] text-text-muted">
        <Link
          href="/problems"
          className="hover:text-text-secondary transition-colors"
        >
          Browse problems without signing in
        </Link>
      </p>
    </div>
  );
}
