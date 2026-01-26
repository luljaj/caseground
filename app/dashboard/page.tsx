"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "@/components/dashboard/CreditCard";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSettings } from "@/lib/hooks/useSettings";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import TypeBreakdownChart from "@/components/dashboard/TypeBreakdownChart";
import CompletedCollections, {
  type CompletedCollectionCard,
} from "@/components/dashboard/CompletedCollections";
import PreferencesCard from "@/components/dashboard/PreferencesCard";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { cn } from "@/lib/utils/cn";
import {
  type Collection,
  type StatsPayload,
  type UserCollectionCompletion,
} from "@/types";

const settingsOptions: Array<{
  key: "autoStartTimer" | "timerSound" | "speechToTextReady" | "showPracticeTips";
  title: string;
  description: string;
}> = [
    {
      key: "autoStartTimer",
      title: "Auto-start timers",
      description: "Begin the countdown as soon as a question opens.",
    },
    {
      key: "timerSound",
      title: "Timer sound",
      description: "Play a chime when the timer finishes.",
    },
    {
      key: "speechToTextReady",
      title: "Speech-to-text ready",
      description: "Keep voice input ready on question pages.",
    },
    {
      key: "showPracticeTips",
      title: "Practice tips",
      description: "Surface short reminders on structure and pacing.",
    },
  ];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { settings, updateSetting } = useSettings();
  const { preferences, completeOnboarding } = useOnboarding();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedCollections, setCompletedCollections] = useState<CompletedCollectionCard[]>([]);

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

  useEffect(() => {
    if (!user) {
      setCompletedCollections([]);
      return;
    }

    let isMounted = true;

    async function loadCompletedCollections() {
      try {
        const [collectionsRes, completionsRes] = await Promise.all([
          fetch("/api/collections", { cache: "no-store" }),
          fetch("/api/collections/complete", { cache: "no-store" }),
        ]);

        if (!collectionsRes.ok || !completionsRes.ok) {
          return;
        }

        const collectionsPayload = await collectionsRes.json();
        const completionsPayload = await completionsRes.json();
        const collections = (collectionsPayload.collections ?? []) as Collection[];
        const completions = (completionsPayload.completions ?? []) as UserCollectionCompletion[];

        const collectionMap = new Map<string, Collection>();
        collections.forEach((collection) => {
          collectionMap.set(collection.id, collection);
        });

        const completed = completions
          .map((completion) => {
            const collection = collectionMap.get(completion.collection_id);
            if (!collection) {
              return null;
            }
            return {
              id: collection.id,
              name: collection.name,
              slug: collection.slug,
              completedAt: completion.completed_at,
            } satisfies CompletedCollectionCard;
          })
          .filter(Boolean) as CompletedCollectionCard[];

        if (isMounted) {
          setCompletedCollections(completed);
        }
      } catch {
        return;
      }
    }

    loadCompletedCollections();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user) {
    router.push("/signin");
    return;
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
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-12">
      {/* Main Dashboard Card */}
      <div className="animate-fade-up rounded-3xl bg-zinc-800/50 border border-zinc-700/50 p-6">
        {/* Subscription & Credits Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <SubscriptionCard
            status={
              ["active", "trialing", "past_due"].includes(stats.subscription.status)
                ? stats.subscription.status === "trialing"
                  ? "trialing"
                  : "unlimited"
                : "free"
            }
            periodEnd={stats.subscription.periodEnd}
            cancelAtPeriodEnd={stats.subscription.cancelAtPeriodEnd}
            onManage={
              ["active", "trialing", "past_due"].includes(stats.subscription.status)
                ? async () => {
                  const res = await fetch("/api/stripe/portal", { method: "POST" });
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                }
                : () => router.push("/pricing")
            }
          />

          <CreditCard
            title="AI Credits"
            count={stats.aiCredits}
            unlimited={["active", "past_due"].includes(stats.subscription.status) && stats.subscription.status !== "trialing"}
            onAddCredits={
              !["active", "past_due"].includes(stats.subscription.status)
                ? () => router.push("/pricing")
                : undefined
            }
          />
        </div>

        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#1f1f23] rounded-3xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.01]">
              {/* Content */}
              <div className="relative p-6 px-8 h-24 flex items-center">
                <div className="flex items-center justify-between gap-4 w-full">
                  <div>
                    <h3 className="text-white text-xl font-semibold leading-tight group-hover:text-zinc-100 transition-colors">
                      Questions Attempted
                    </h3>
                    <p className="text-zinc-400 text-sm mt-0.5 group-hover:text-zinc-300 transition-colors">
                      Unique questions answered
                    </p>
                  </div>
                  <div className="text-white text-3xl font-bold tabular-nums">
                    {stats.totalAttempted}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <TypeBreakdownChart {...stats.byType} />
        </div>
      </div>

      <PreferencesCard
        currentRole={preferences?.target_role ?? null}
        onSave={(role) => completeOnboarding(role, false)}
      />

      {/* Settings Card - Separate */}
      <div className="animate-fade-up" style={{ animationDelay: "50ms" }}>
        <div className="rounded-3xl border border-zinc-700/50 bg-zinc-800/50 p-8 transition-colors">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                Settings
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Personalize your practice defaults.
              </p>
            </div>
            <p className="text-xs text-text-muted">Saved on this device</p>
          </div>
          <div className="mt-6 divide-y divide-white/5">
            {settingsOptions.map((setting) => {
              const isEnabled = settings[setting.key];
              return (
                <div
                  key={setting.key}
                  className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-primary">
                      {setting.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {setting.description}
                    </p>
                  </div>
                  <div
                    className="inline-flex items-center rounded-md border border-white/10 bg-surface/40 p-1"
                    role="group"
                    aria-label={setting.title}
                  >
                    <button
                      type="button"
                      className={cn(
                        "h-7 min-w-[48px] rounded px-3 text-xs font-medium uppercase tracking-wide transition-colors",
                        isEnabled
                          ? "bg-white/10 text-text-primary"
                          : "text-text-secondary hover:text-text-primary"
                      )}
                      aria-pressed={isEnabled}
                      onClick={() => updateSetting(setting.key, true)}
                    >
                      On
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "h-7 min-w-[48px] rounded px-3 text-xs font-medium uppercase tracking-wide transition-colors",
                        !isEnabled
                          ? "bg-white/10 text-text-primary"
                          : "text-text-secondary hover:text-text-primary"
                      )}
                      aria-pressed={!isEnabled}
                      onClick={() => updateSetting(setting.key, false)}
                    >
                      Off
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CompletedCollections collections={completedCollections} />

      <div className="pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/problems")}
        >
          Back to Problems
        </Button>
      </div>
    </div>
  );
}
