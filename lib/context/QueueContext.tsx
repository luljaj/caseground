"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";

export type QueueProblemMeta = {
  title: string;
  track?: string;
  category?: string;
  suggestedTime?: number;
  number?: number;
};

export type QueueCompletedItem = {
  problemId: string;
  responseId?: string | null;
  skipped?: boolean;
  completedAt: number;
};

export type QueueState = {
  problemIds: string[];
  meta: Record<string, QueueProblemMeta>;
  isAddingMode: boolean;
  isPlaying: boolean;
  currentIndex: number;
  collapsed: boolean;
  startTime: number | null;
  completedCount: number;
  completed: QueueCompletedItem[];
  isComplete: boolean;
};

type QueueStartOptions = {
  reset?: boolean;
  overrideProblemIds?: string[];
};

type QueueContextValue = {
  state: QueueState;
  ready: boolean;
  currentProblemId: string | null;
  activeTimerSeconds: number | null;
  setActiveTimerSeconds: (value: number | null) => void;
  addProblem: (id: string, meta?: QueueProblemMeta) => void;
  removeProblem: (id: string) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  setAddingMode: (value: boolean) => void;
  startQueue: (options?: QueueStartOptions) => void;
  resumeQueue: () => void;
  exitQueue: () => void;
  advanceQueue: () => void;
  markCompleted: (problemId: string, responseId?: string | null) => void;
  markSkipped: (problemId: string) => void;
  setCollapsed: (value: boolean) => void;
  resetProgress: () => void;
  upsertMeta: (id: string, meta: QueueProblemMeta) => void;
};

const STORAGE_KEY = "caseground.queue";

const defaultQueueState: QueueState = {
  problemIds: [],
  meta: {},
  isAddingMode: false,
  isPlaying: false,
  currentIndex: 0,
  collapsed: false,
  startTime: null,
  completedCount: 0,
  completed: [],
  isComplete: false,
};

function normalizeQueueState(value: unknown): QueueState {
  if (!value || typeof value !== "object") {
    return defaultQueueState;
  }

  const raw = value as Partial<QueueState>;
  const problemIds = Array.isArray(raw.problemIds)
    ? raw.problemIds.filter((id): id is string => typeof id === "string")
    : [];

  const meta: Record<string, QueueProblemMeta> = {};
  if (raw.meta && typeof raw.meta === "object") {
    Object.entries(raw.meta as Record<string, QueueProblemMeta>).forEach(
      ([id, value]) => {
        if (!value || typeof value !== "object") {
          return;
        }
        if (typeof value.title !== "string") {
          return;
        }
        meta[id] = {
          title: value.title,
          track: typeof value.track === "string" ? value.track : undefined,
          category: typeof value.category === "string" ? value.category : undefined,
          suggestedTime:
            typeof value.suggestedTime === "number" && Number.isFinite(value.suggestedTime)
              ? value.suggestedTime
              : undefined,
          number:
            typeof value.number === "number" && Number.isFinite(value.number)
              ? value.number
              : undefined,
        };
      }
    );
  }

  const completed = Array.isArray(raw.completed)
    ? raw.completed
        .filter((item): item is QueueCompletedItem => {
          return Boolean(item && typeof item === "object" && typeof item.problemId === "string");
        })
        .map((item) => ({
          problemId: item.problemId,
          responseId: item.responseId ?? undefined,
          skipped: Boolean(item.skipped),
          completedAt:
            typeof item.completedAt === "number" && Number.isFinite(item.completedAt)
              ? item.completedAt
              : Date.now(),
        }))
    : [];

  const completedCount = Number.isFinite(raw.completedCount)
    ? Math.max(0, Math.min(problemIds.length, raw.completedCount ?? 0))
    : completed.length;

  const currentIndex = Number.isFinite(raw.currentIndex)
    ? Math.max(0, Math.min(problemIds.length - 1, raw.currentIndex ?? 0))
    : 0;

  const isPlaying = Boolean(raw.isPlaying) && problemIds.length > 0;
  const isComplete = Boolean(raw.isComplete) && problemIds.length > 0;

  return {
    problemIds,
    meta,
    isAddingMode: Boolean(raw.isAddingMode),
    isPlaying,
    currentIndex,
    collapsed: Boolean(raw.collapsed),
    startTime:
      typeof raw.startTime === "number" && Number.isFinite(raw.startTime)
        ? raw.startTime
        : null,
    completedCount,
    completed,
    isComplete,
  };
}

export const QueueContext = createContext<QueueContextValue | null>(null);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<QueueState>(defaultQueueState);
  const [ready, setReady] = useState(false);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(normalizeQueueState(JSON.parse(stored)));
      }
    } catch {
      setState(defaultQueueState);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors to avoid blocking queue updates.
    }
  }, [state, ready]);

  const currentProblemId =
    state.problemIds.length > 0 ? state.problemIds[state.currentIndex] : null;

  const addProblem = useCallback((id: string, meta?: QueueProblemMeta) => {
    setState((prev) => {
      if (prev.problemIds.includes(id)) {
        return meta
          ? { ...prev, meta: { ...prev.meta, [id]: meta } }
          : prev;
      }
      return {
        ...prev,
        problemIds: [...prev.problemIds, id],
        meta: meta ? { ...prev.meta, [id]: meta } : prev.meta,
      };
    });
  }, []);

  const upsertMeta = useCallback((id: string, meta: QueueProblemMeta) => {
    setState((prev) => ({
      ...prev,
      meta: { ...prev.meta, [id]: meta },
    }));
  }, []);

  const removeProblem = useCallback((id: string) => {
    setState((prev) => {
      const index = prev.problemIds.indexOf(id);
      if (index === -1) {
        return prev;
      }
      const nextProblemIds = prev.problemIds.filter((problemId) => problemId !== id);
      const nextMeta = { ...prev.meta };
      delete nextMeta[id];
      const completed = prev.completed.filter((item) => item.problemId !== id);
      const completedCount = completed.length;
      let nextIndex = prev.currentIndex;
      if (index < prev.currentIndex) {
        nextIndex -= 1;
      }
      if (nextIndex >= nextProblemIds.length) {
        nextIndex = Math.max(0, nextProblemIds.length - 1);
      }
      const isComplete =
        prev.isComplete && nextProblemIds.length === completedCount && completedCount > 0;
      const isPlaying = nextProblemIds.length === 0 ? false : prev.isPlaying;
      return {
        ...prev,
        problemIds: nextProblemIds,
        meta: nextMeta,
        currentIndex: nextIndex,
        completed,
        completedCount,
        isComplete,
        isPlaying,
      };
    });
  }, []);

  const clearQueue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      problemIds: [],
      meta: {},
      currentIndex: 0,
      isPlaying: false,
      startTime: null,
      completedCount: 0,
      completed: [],
      isComplete: false,
    }));
    setActiveTimerSeconds(null);
  }, []);

  const shuffleQueue = useCallback(() => {
    setState((prev) => {
      if (prev.problemIds.length < 2) {
        return prev;
      }
      const shuffled = [...prev.problemIds];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const currentId = prev.problemIds[prev.currentIndex];
      const nextIndex = currentId ? Math.max(0, shuffled.indexOf(currentId)) : 0;
      return { ...prev, problemIds: shuffled, currentIndex: nextIndex };
    });
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.problemIds.length ||
        toIndex >= prev.problemIds.length
      ) {
        return prev;
      }

      const nextProblemIds = [...prev.problemIds];
      const [moved] = nextProblemIds.splice(fromIndex, 1);
      nextProblemIds.splice(toIndex, 0, moved);

      let nextIndex = prev.currentIndex;
      if (fromIndex === prev.currentIndex) {
        nextIndex = toIndex;
      } else if (fromIndex < prev.currentIndex && toIndex >= prev.currentIndex) {
        nextIndex -= 1;
      } else if (fromIndex > prev.currentIndex && toIndex <= prev.currentIndex) {
        nextIndex += 1;
      }

      return { ...prev, problemIds: nextProblemIds, currentIndex: nextIndex };
    });
  }, []);

  const setAddingMode = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isAddingMode: value }));
  }, []);

  const startQueue = useCallback((options?: QueueStartOptions) => {
    setState((prev) => {
      const reset = options?.reset ?? true;
      const problemIds = options?.overrideProblemIds ?? prev.problemIds;
      if (problemIds.length === 0) {
        return {
          ...prev,
          problemIds,
          isPlaying: false,
          currentIndex: 0,
          startTime: null,
          completedCount: 0,
          completed: [],
          isComplete: false,
        };
      }
      const nextIndex = reset
        ? 0
        : Math.max(0, Math.min(problemIds.length - 1, prev.currentIndex));
      return {
        ...prev,
        problemIds,
        isPlaying: true,
        isComplete: false,
        currentIndex: nextIndex,
        startTime: reset ? Date.now() : prev.startTime ?? Date.now(),
        completed: reset ? [] : prev.completed,
        completedCount: reset ? 0 : prev.completedCount,
      };
    });
  }, []);

  const resumeQueue = useCallback(() => {
    startQueue({ reset: false });
  }, [startQueue]);

  const exitQueue = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
    setActiveTimerSeconds(null);
  }, []);

  const advanceQueue = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.problemIds.length) {
        return {
          ...prev,
          isPlaying: false,
          isComplete: prev.problemIds.length > 0,
        };
      }
      return { ...prev, currentIndex: nextIndex };
    });
    setActiveTimerSeconds(null);
  }, []);

  const markCompleted = useCallback((problemId: string, responseId?: string | null) => {
    setState((prev) => {
      if (prev.completed.some((item) => item.problemId === problemId)) {
        return prev;
      }
      const completed = [
        ...prev.completed,
        { problemId, responseId: responseId ?? null, completedAt: Date.now() },
      ];
      return { ...prev, completed, completedCount: completed.length };
    });
  }, []);

  const markSkipped = useCallback((problemId: string) => {
    setState((prev) => {
      if (prev.completed.some((item) => item.problemId === problemId)) {
        return prev;
      }
      const completed = [
        ...prev.completed,
        { problemId, skipped: true, completedAt: Date.now() },
      ];
      return { ...prev, completed, completedCount: completed.length };
    });
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, collapsed: value }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isComplete: false,
      currentIndex: 0,
      startTime: null,
      completedCount: 0,
      completed: [],
    }));
    setActiveTimerSeconds(null);
  }, []);

  const value = useMemo(
    () => ({
      state,
      ready,
      currentProblemId,
      activeTimerSeconds,
      setActiveTimerSeconds,
      addProblem,
      removeProblem,
      clearQueue,
      shuffleQueue,
      reorderQueue,
      setAddingMode,
      startQueue,
      resumeQueue,
      exitQueue,
      advanceQueue,
      markCompleted,
      markSkipped,
      setCollapsed,
      resetProgress,
      upsertMeta,
    }),
    [
      state,
      ready,
      currentProblemId,
      activeTimerSeconds,
      addProblem,
      removeProblem,
      clearQueue,
      shuffleQueue,
      reorderQueue,
      setAddingMode,
      startQueue,
      resumeQueue,
      exitQueue,
      advanceQueue,
      markCompleted,
      markSkipped,
      setCollapsed,
      resetProgress,
      upsertMeta,
    ]
  );

  return (
    <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
  );
}
