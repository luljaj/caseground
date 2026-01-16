"use client";

import { useEffect, useState } from "react";
import type { Category, Question, SortParams, Track } from "@/types";

type UseQuestionsParams = {
  track?: Track;
  category?: Category;
  search?: string;
  page: number;
  perPage: number;
  sort: SortParams;
};

export function useQuestions({
  track,
  category,
  search,
  page,
  perPage,
  sort,
}: UseQuestionsParams) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchQuestions() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (track) {
          params.set("track", track);
        }
        if (category) {
          params.set("category", category);
        }
        if (search) {
          params.set("search", search);
        }
        params.set("page", String(page));
        params.set("perPage", String(perPage));
        params.set("sort", sort.field);
        params.set("direction", sort.direction);

        const response = await fetch(`/api/questions?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load questions.");
        }

        const payload = await response.json();
        setQuestions(payload.questions ?? []);
        setTotal(payload.total ?? 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();

    return () => controller.abort();
  }, [track, category, search, page, perPage, sort.field, sort.direction]);

  return {
    questions,
    total,
    loading,
    error,
  };
}
