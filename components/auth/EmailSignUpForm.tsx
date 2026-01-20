"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/hooks/useAuth";
import { getEmailError } from "@/lib/utils/email";
import { validatePassword } from "@/lib/utils/password";

type EmailSignUpFormProps = {
  nextPath?: string;
};

export function EmailSignUpForm({ nextPath }: EmailSignUpFormProps) {
  const { signUpWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailError = getEmailError(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (!passwordValidation.isValid) {
      setError("Password must meet all requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error: authError } = await signUpWithEmail(email, password, nextPath);

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
      <div className="text-center space-y-4 py-4">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white">Check your email</h3>
        <p className="text-sm text-zinc-400">
          We&apos;ve sent a confirmation link to <span className="text-zinc-300">{email}</span>.
          Click the link to verify your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-zinc-400 text-sm">
          Email
        </Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
          className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-600"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-zinc-400 text-sm">
          Password
        </Label>
        <PasswordInput
          id="signup-password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
          className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-600"
        />
        {password && (
          <ul className="text-xs space-y-1 mt-2">
            <li className={password.length >= 8 ? "text-green-500" : "text-zinc-500"}>
              {password.length >= 8 ? "\u2713" : "\u2022"} At least 8 characters
            </li>
            <li className={/[a-z]/.test(password) ? "text-green-500" : "text-zinc-500"}>
              {/[a-z]/.test(password) ? "\u2713" : "\u2022"} One lowercase letter
            </li>
            <li className={/[A-Z]/.test(password) ? "text-green-500" : "text-zinc-500"}>
              {/[A-Z]/.test(password) ? "\u2713" : "\u2022"} One uppercase letter
            </li>
            <li className={/[0-9]/.test(password) ? "text-green-500" : "text-zinc-500"}>
              {/[0-9]/.test(password) ? "\u2713" : "\u2022"} One number
            </li>
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-zinc-400 text-sm">
          Confirm Password
        </Label>
        <PasswordInput
          id="confirm-password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
          error={confirmPassword !== "" && password !== confirmPassword}
          className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-600"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-400">Passwords do not match</p>
        )}
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
            Creating account...
          </span>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
