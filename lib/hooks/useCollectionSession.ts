"use client";

import { useEffect, useState, useCallback } from "react";
import type { CollectionSession } from "@/types";

const STORAGE_KEY = "collection_session";

function normalizeSession(value: unknown): CollectionSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Partial<CollectionSession>;
  const collectionId = typeof raw.collectionId === "string" ? raw.collectionId : null;
  const collectionSlug = typeof raw.collectionSlug === "string" ? raw.collectionSlug : null;
  const problemIds = Array.isArray(raw.problemIds)
    ? raw.problemIds.filter((id): id is string => typeof id === "string")
    : [];

  if (!collectionId || !collectionSlug || problemIds.length === 0) {
    return null;
  }

  const currentIndex =
    typeof raw.currentIndex === "number" && Number.isFinite(raw.currentIndex)
      ? Math.max(0, Math.min(problemIds.length - 1, raw.currentIndex))
      : 0;

  const completedThisSession = Array.isArray(raw.completedThisSession)
    ? raw.completedThisSession.filter((id): id is string => typeof id === "string")
    : [];

  const skippedThisSession = Array.isArray(raw.skippedThisSession)
    ? raw.skippedThisSession.filter((id): id is string => typeof id === "string")
    : [];

  const startedAt = typeof raw.startedAt === "string" ? raw.startedAt : new Date().toISOString();

  return {
    collectionId,
    collectionSlug,
    currentIndex,
    problemIds,
    completedThisSession,
    skippedThisSession,
    startedAt,
    isCustom: Boolean(raw.isCustom),
    collectionName:
      typeof raw.collectionName === "string" ? raw.collectionName : undefined,
  };
}

export function useCollectionSession() {
  const [session, setSession] = useState<CollectionSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSession(normalizeSession(JSON.parse(stored)));
      }
    } catch {
      setSession(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") {
      return;
    }

    try {
      if (session) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors to avoid blocking updates.
    }
  }, [session, ready]);

  const clearSession = useCallback(() => {
    setSession(null);
  }, []);

  return { session, setSession, clearSession, ready };
}
