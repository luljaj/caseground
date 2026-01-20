"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";

export type Settings = {
  autoStartTimer: boolean;
  timerSound: boolean;
  speechToTextReady: boolean;
  showPracticeTips: boolean;
  skipCompleted: boolean;
  showResultsBetween: boolean;
  resultsDelay: number;
};

type SettingsContextValue = {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  ready: boolean;
};

const STORAGE_KEY = "caseground.settings";
const LEGACY_KEY = "caseground.dashboard.settings";

const defaultSettings: Settings = {
  autoStartTimer: true,
  timerSound: false,
  speechToTextReady: false,
  showPracticeTips: true,
  skipCompleted: true,
  showResultsBetween: false,
  resultsDelay: 5,
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

function normalizeSettings(value: unknown): Partial<Settings> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const raw = value as Partial<Settings>;

  return {
    autoStartTimer: typeof raw.autoStartTimer === "boolean" ? raw.autoStartTimer : undefined,
    timerSound: typeof raw.timerSound === "boolean" ? raw.timerSound : undefined,
    speechToTextReady:
      typeof raw.speechToTextReady === "boolean" ? raw.speechToTextReady : undefined,
    showPracticeTips:
      typeof raw.showPracticeTips === "boolean" ? raw.showPracticeTips : undefined,
    skipCompleted: typeof raw.skipCompleted === "boolean" ? raw.skipCompleted : undefined,
    showResultsBetween:
      typeof raw.showResultsBetween === "boolean" ? raw.showResultsBetween : undefined,
    resultsDelay:
      typeof raw.resultsDelay === "number" && Number.isFinite(raw.resultsDelay)
        ? Math.max(1, Math.round(raw.resultsDelay))
        : undefined,
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let storedSettings: Partial<Settings> = {};
    let legacySettings: Partial<Settings> = {};

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        storedSettings = normalizeSettings(JSON.parse(stored));
      }
    } catch {
      storedSettings = {};
    }

    try {
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        legacySettings = normalizeSettings(JSON.parse(legacy));
      }
    } catch {
      legacySettings = {};
    }

    const merged = {
      ...defaultSettings,
      ...legacySettings,
      ...storedSettings,
    } satisfies Settings;

    setSettings(merged);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors to avoid blocking settings updates.
    }
  }, [settings, ready]);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({
      ...prev,
      ...normalizeSettings(partial),
    }));
  }, []);

  const value = useMemo(
    () => ({ settings, updateSetting, updateSettings, ready }),
    [settings, updateSetting, updateSettings, ready]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
