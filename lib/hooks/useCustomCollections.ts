"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomCollection } from "@/types";

const STORAGE_KEY = "caseground.customCollections";

function normalizeCollections(value: unknown): CustomCollection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is CustomCollection => Boolean(item && typeof item === "object"))
    .map((item) => {
      const entry = item as CustomCollection;
      const problemIds = Array.isArray(entry.problem_ids)
        ? entry.problem_ids.filter((id): id is string => typeof id === "string")
        : [];

      return {
        id: typeof entry.id === "string" ? entry.id : "",
        name: typeof entry.name === "string" ? entry.name : "Untitled",
        problem_ids: problemIds,
        created_at:
          typeof entry.created_at === "string" ? entry.created_at : new Date().toISOString(),
        is_complete: Boolean(entry.is_complete),
      } satisfies CustomCollection;
    })
    .filter((entry) => entry.id);
}

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `custom_${Math.random().toString(36).slice(2, 10)}`;
}

export function useCustomCollections() {
  const [collections, setCollections] = useState<CustomCollection[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return normalizeCollections(JSON.parse(stored));
      }
    } catch {
      return [];
    }
    return [];
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
    } catch {
      // Ignore storage errors to avoid blocking updates.
    }
  }, [collections, ready]);

  const createCollection = useCallback((name: string, problemIds: string[]) => {
    const newCollection: CustomCollection = {
      id: generateId(),
      name: name.trim() || "Untitled",
      problem_ids: problemIds.slice(0, 20),
      created_at: new Date().toISOString(),
      is_complete: false,
    };

    setCollections((prev) => [newCollection, ...prev]);
    return newCollection;
  }, []);

  const updateCollection = useCallback(
    (id: string, updates: Partial<CustomCollection>) => {
      setCollections((prev) =>
        prev.map((collection) =>
          collection.id === id
            ? {
                ...collection,
                ...updates,
                problem_ids:
                  updates.problem_ids?.slice(0, 20) ?? collection.problem_ids,
              }
            : collection
        )
      );
    },
    []
  );

  const removeCollection = useCallback((id: string) => {
    setCollections((prev) => prev.filter((collection) => collection.id !== id));
  }, []);

  const markComplete = useCallback((id: string, isComplete: boolean) => {
    updateCollection(id, { is_complete: isComplete });
  }, [updateCollection]);

  return {
    collections,
    ready,
    createCollection,
    updateCollection,
    removeCollection,
    markComplete,
  };
}
