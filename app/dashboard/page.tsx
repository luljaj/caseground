"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import StatsCard from "@/components/dashboard/StatsCard";
import Heatmap from "@/components/dashboard/Heatmap";

type StatsPayload = {
  totalAttempted: number;
  aiCredits: number;
  heatmap: Array<{ date: string; count: number }>;
};

export default function DashboardPage() {
  const { user, signInWithGoogle } = useAuth();
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
          <Button size="sm" onClick={signInWithGoogle}>
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
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Track your reps and AI feedback credits over time.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          label="Attempted"
          value={stats.totalAttempted}
          hint="Unique questions answered"
        />
        <StatsCard
          label="AI Credits"
          value={stats.aiCredits}
          hint="Remaining for feedback"
        />
      </div>
      <Heatmap data={stats.heatmap} />
      <div className="flex items-center">
        <Link
          href="/problems"
          className="text-sm text-text-secondary transition hover:text-text-primary"
        >
          Back to Problems
        </Link>
      </div>
    </div>
  );
}
