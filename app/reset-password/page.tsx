import { Metadata } from "next";
import Logo from "@/components/layout/Logo";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Password | Caseground",
  description: "Set a new password for your Caseground account",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-4 py-12 -mx-6 -my-6 md:-mx-12 md:-my-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Card */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl border border-zinc-800 p-8 shadow-2xl shadow-zinc-950/50">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
