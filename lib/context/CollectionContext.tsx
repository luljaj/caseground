"use client";

import { createContext, useCallback, useMemo, useState } from "react";
import type { CollectionSession } from "@/types";
import { useCollectionSession } from "@/lib/hooks/useCollectionSession";

export type CollectionStartInput = {
  collectionId: string;
  collectionSlug: string;
  collectionName?: string;
  problemIds: string[];
  isCustom?: boolean;
};

type CollectionContextValue = {
  session: CollectionSession | null;
  ready: boolean;
  collapsed: boolean;
  currentProblemId: string | null;
  startCollection: (input: CollectionStartInput) => void;
  advanceCollection: () => void;
  markCompleted: (problemId: string) => void;
  markSkipped: (problemId: string) => void;
  exitCollection: () => void;
  setCollapsed: (value: boolean) => void;
};

export const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const { session, setSession, clearSession, ready } = useCollectionSession();
  const [collapsed, setCollapsed] = useState(false);

  const currentProblemId =
    session && session.problemIds.length > 0
      ? session.problemIds[session.currentIndex]
      : null;

  const startCollection = useCallback(
    ({ collectionId, collectionSlug, collectionName, problemIds, isCustom }: CollectionStartInput) => {
      if (problemIds.length === 0) {
        return;
      }
      setSession({
        collectionId,
        collectionSlug,
        collectionName,
        currentIndex: 0,
        problemIds: problemIds.slice(0, 20),
        completedThisSession: [],
        skippedThisSession: [],
        startedAt: new Date().toISOString(),
        isCustom: Boolean(isCustom),
      });
      setCollapsed(false);
    },
    [setSession]
  );

  const advanceCollection = useCallback(() => {
    setSession((prev) => {
      if (!prev) {
        return prev;
      }
      const nextIndex = Math.min(prev.currentIndex + 1, prev.problemIds.length - 1);
      return { ...prev, currentIndex: nextIndex };
    });
  }, [setSession]);

  const markCompleted = useCallback(
    (problemId: string) => {
      setSession((prev) => {
        if (!prev || prev.completedThisSession.includes(problemId)) {
          return prev;
        }
        return {
          ...prev,
          completedThisSession: [...prev.completedThisSession, problemId],
        };
      });
    },
    [setSession]
  );

  const markSkipped = useCallback(
    (problemId: string) => {
      setSession((prev) => {
        if (!prev || prev.skippedThisSession.includes(problemId)) {
          return prev;
        }
        return {
          ...prev,
          skippedThisSession: [...prev.skippedThisSession, problemId],
        };
      });
    },
    [setSession]
  );

  const exitCollection = useCallback(() => {
    clearSession();
    setCollapsed(false);
  }, [clearSession]);

  const value = useMemo(
    () => ({
      session,
      ready,
      collapsed,
      currentProblemId,
      startCollection,
      advanceCollection,
      markCompleted,
      markSkipped,
      exitCollection,
      setCollapsed,
    }),
    [
      session,
      ready,
      collapsed,
      currentProblemId,
      startCollection,
      advanceCollection,
      markCompleted,
      markSkipped,
      exitCollection,
    ]
  );

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}
