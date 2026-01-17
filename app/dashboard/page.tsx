"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@tremor/react";
import { useAuth } from "@/lib/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Heatmap from "@/components/dashboard/Heatmap";
import TypeBreakdownChart from "@/components/dashboard/TypeBreakdownChart";

type StatsPayload = {
  totalAttempted: number;
  aiCredits: number;
  heatmap: Array<{ date: string; count: number }>;
  byType: {
    estimations: number;
    behaviorals: number;
    reasoning: number;
  };
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadStats() {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/stats", { cache: "no-store" });
      if (!response.ok) {
        setError("Unable to load dashboard stats.");
        setLoading(false);
        return;
      }
      const payload = await response.json();
      if (isMounted) {
        setStats(payload);
        setLoading(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-md border border-border/80 bg-surface/40 p-6 text-sm text-text-secondary">
        <p>Sign in to view your progress and stats.</p>
        <div className="mt-4">
          <Button size="sm" onClick={() => router.push("/signin")}>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={28} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-md border border-error/40 bg-error/10 p-4 text-sm text-error">
        {error ?? "Unable to load dashboard stats."}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6 md:p-8 border border-border rounded-lg bg-surface/20">
      {/* Header with AI Credits */}
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface/40 border border-border/80">
          <span className="text-xs text-text-muted">AI Credits</span>
          <span className="text-sm font-medium text-text-primary">
            {stats.aiCredits}
          </span>
        </div>
      </div>

      {/* Heatmap - emphasized */}
      <div className="animate-fade-up" style={{ animationDelay: "50ms" }}>
        <Card className="border-border bg-surface/40 p-8 rounded-lg ring-0 focus:ring-0 focus-visible:ring-0">
          <h2 className="text-lg font-semibold text-text-primary mb-6">
            Activity
          </h2>
          <Heatmap data={stats.heatmap} />
        </Card>
      </div>

      {/* Stats row */}
      <div
        className="grid gap-6 md:grid-cols-2 animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        {/* Total progress card - using Tremor Card */}
        <Card className="border-border bg-surface/40 p-8 rounded-lg ring-0 focus:ring-0 focus-visible:ring-0">
          <p className="text-sm text-text-secondary">Questions Attempted</p>
          <p className="text-3xl font-semibold text-text-primary mt-3">
            {stats.totalAttempted}
          </p>
          <p className="text-xs text-text-muted mt-2">
            Unique questions answered
          </p>
        </Card>

        {/* Type breakdown chart */}
        <TypeBreakdownChart {...stats.byType} />
      </div>

      {/* Back link */}
      <Link
        href="/problems"
        className="text-[13px] text-text-secondary transition-colors hover:text-text-primary"
      >
        Back to Problems
      </Link>
    </div>
  );
}
