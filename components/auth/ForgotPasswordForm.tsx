"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/hooks/useAuth";
import { getEmailError } from "@/lib/utils/email";

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailError = getEmailError(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      const { error: authError } = await resetPassword(email);

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Check your email</h2>
          <p className="text-sm text-zinc-400">
            We&apos;ve sent a password reset link to{" "}
            <span className="text-zinc-300">{email}</span>. Click the link to set a
            new password.
          </p>
        </div>

        <Link
          href="/signin"
          className="block w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Reset password
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-400 text-sm">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
            className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-600"
          />
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="lg"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <Link
        href="/signin"
        className="block w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        Back to sign in
      </Link>
    </div>
  );
}
