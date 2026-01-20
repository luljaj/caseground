"use client";

import { cn } from "@/lib/utils";

type AuthTabsProps = {
  activeTab: "signin" | "signup";
  onTabChange: (tab: "signin" | "signup") => void;
};

export function AuthTabs({ activeTab, onTabChange }: AuthTabsProps) {
  return (
    <div className="flex w-full rounded-xl bg-zinc-800/50 p-1">
      <button
        type="button"
        onClick={() => onTabChange("signin")}
        className={cn(
          "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
          activeTab === "signin"
            ? "bg-zinc-700 text-white shadow-sm"
            : "text-zinc-400 hover:text-zinc-300"
        )}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onTabChange("signup")}
        className={cn(
          "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
          activeTab === "signup"
            ? "bg-zinc-700 text-white shadow-sm"
            : "text-zinc-400 hover:text-zinc-300"
        )}
      >
        Sign Up
      </button>
    </div>
  );
}
