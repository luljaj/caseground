"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import TypeBreakdownChart from "@/components/dashboard/TypeBreakdownChart";
import { cn } from "@/lib/utils/cn";

type StatsPayload = {
  totalAttempted: number;
  aiCredits: number;
  byType: {
    estimations: number;
    behaviorals: number;
    reasoning: number;
  };
};

type DashboardSettings = {
  autoStartTimer: boolean;
  speechToTextReady: boolean;
  showPracticeTips: boolean;
};

const defaultSettings: DashboardSettings = {
  autoStartTimer: true,
  speechToTextReady: false,
  showPracticeTips: true,
};

const settingsStorageKey = "caseground.dashboard.settings";

const settingsOptions: Array<{
  key: keyof DashboardSettings;
  title: string;
  description: string;
}> = [
  {
    key: "autoStartTimer",
    title: "Auto-start timers",
    description: "Begin the countdown as soon as a question opens.",
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
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(settingsStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DashboardSettings>;
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {
      setSettings(defaultSettings);
    } finally {
      setSettingsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!settingsReady) {
      return;
    }
    try {
      window.localStorage.setItem(
        settingsStorageKey,
        JSON.stringify(settings)
      );
    } catch {
      // Ignore storage errors to avoid blocking settings changes.
    }
  }, [settings, settingsReady]);

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

  const updateSetting = (key: keyof DashboardSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

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
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <div className="flex flex-col gap-4 animate-fade-up md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <h1 className="text-2xl font-semibold text-text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary">
            Track your progress and activity across all question types.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-surface/60 px-4 py-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
            AI Credits
          </span>
          <span className="text-base font-semibold text-text-primary">
            {stats.aiCredits}
          </span>
        </div>
      </div>

      <div
        className="grid gap-6 animate-fade-up md:grid-cols-2"
        style={{ animationDelay: "50ms" }}
      >
        <div className="rounded-lg border border-white/5 bg-surface/50 p-8 transition-colors hover:bg-surface/60">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
              Questions Attempted
            </h3>
            <p className="mt-4 text-4xl font-semibold text-text-primary">
              {stats.totalAttempted}
            </p>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            Unique questions answered
          </p>
        </div>

        <TypeBreakdownChart {...stats.byType} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="rounded-lg border border-border/80 bg-surface/30 p-8 transition-colors hover:bg-surface/40">
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
