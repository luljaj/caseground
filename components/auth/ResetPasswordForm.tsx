"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/hooks/useAuth";
import { validatePassword } from "@/lib/utils/password";

export function ResetPasswordForm() {
  const { updatePassword } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const { error: authError } = await updatePassword(password);

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/problems");
      }, 2000);
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Password updated</h2>
          <p className="text-sm text-zinc-400">
            Your password has been successfully updated. Redirecting you now...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Set new password
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Choose a strong password you haven&apos;t used before
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-zinc-400 text-sm">
            New Password
          </Label>
          <PasswordInput
            id="new-password"
            placeholder="Enter new password"
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
          <Label htmlFor="confirm-new-password" className="text-zinc-400 text-sm">
            Confirm New Password
          </Label>
          <PasswordInput
            id="confirm-new-password"
            placeholder="Confirm new password"
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
          className="w-full rounded-xl"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
              Updating...
            </span>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </div>
  );
}
