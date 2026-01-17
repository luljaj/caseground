import { Metadata } from "next";
import { Suspense } from "react";
import Logo from "@/components/layout/Logo";
import { SignInForm } from "@/components/auth/SignInForm";
import BodyScrollLock from "@/components/ui/BodyScrollLock";

export const metadata: Metadata = {
  title: "Sign In | Caseground",
  description: "Sign in to Caseground to practice case interviews",
};

export default function SignInPage() {
  return (
    <>
      <BodyScrollLock />
      <div className="grid min-h-[calc(100dvh-64px)] overflow-hidden lg:grid-cols-2 -mx-6 -my-6 md:-mx-12 md:-my-6">
      {/* Left: Branding */}
      <div className="bg-background px-6 py-12 lg:px-12 lg:py-20 flex flex-col justify-center">
        <div className="max-w-lg">
          <Logo />
          <h1 className="mt-8 text-[32px] md:text-[40px] font-semibold tracking-tight text-white">
            Nail your next case interview.
          </h1>
          <p className="mt-4 text-[16px] md:text-[17px] text-text-secondary leading-relaxed">
            Practice estimations, behaviorals, and reasoning puzzles with
            calibrated timers and AI feedback.
          </p>

          <div className="mt-10 space-y-3 text-[14px] text-text-secondary">
            <div className="flex items-start gap-3">
              <span className="text-accent">✓</span>
              <span>47 practice problems across 3 tracks</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent">✓</span>
              <span>Real-time timed practice modes</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent">✓</span>
              <span>AI-powered feedback on your responses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Sign-in Form */}
      <div className="bg-surface border-l-0 lg:border-l border-border px-6 py-12 lg:px-12 flex items-center justify-center">
        <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
      </div>
    </>
  );
}
