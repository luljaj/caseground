"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { EmailSignInForm } from "@/components/auth/EmailSignInForm";
import { EmailSignUpForm } from "@/components/auth/EmailSignUpForm";
import { SignInButton } from "@/components/auth/SignInButton";

export function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const nextPath = searchParams.get("next") ?? undefined;
  const mode = searchParams.get("mode");

  const [activeTab, setActiveTab] = useState<"signin" | "signup">(
    mode === "signup" ? "signup" : "signin"
  );

  useEffect(() => {
    if (mode === "signup") {
      setActiveTab("signup");
    } else if (mode === "signin") {
      setActiveTab("signin");
    }
  }, [mode]);

  const handleTabChange = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", tab);
    router.replace(`/signin?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          {activeTab === "signin" ? "Welcome back" : "Create account"}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {activeTab === "signin"
            ? "Sign in to continue to caseground"
            : "Get started with your free account"}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error === "auth_callback_error"
            ? "Authentication failed. Please try again."
            : error === "expired_link"
              ? "This link has expired. Please request a new one."
              : "An error occurred during sign in."}
        </div>
      )}

      <AuthTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "signin" ? (
        <EmailSignInForm nextPath={nextPath} />
      ) : (
        <EmailSignUpForm nextPath={nextPath} />
      )}

      <AuthDivider />

      <SignInButton nextPath={nextPath} />

      <p className="text-center text-xs text-zinc-500">
        <Link
          href="/problems"
          className="hover:text-zinc-300 transition-colors"
        >
          Browse problems without signing in
        </Link>
      </p>
    </div>
  );
}
