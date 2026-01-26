"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/layout/Nav";
import { cn } from "@/lib/utils/cn";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith("/onboarding");

  return (
    <div className="flex min-h-screen flex-col">
      {!isOnboarding ? <Nav /> : null}
      <main
        className={cn(
          "relative flex-1 min-h-0",
          isOnboarding ? "px-0 py-0" : "px-6 py-6 md:px-12"
        )}
      >
        {children}
      </main>
    </div>
  );
}
