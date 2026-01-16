"use client";

import { useEffect, useMemo, useState } from "react";
import ProblemFilters from "@/components/problems/ProblemFilters";
import ProblemList from "@/components/problems/ProblemList";
import Pagination from "@/components/problems/Pagination";
import Spinner from "@/components/ui/Spinner";
import { useQuestions } from "@/lib/hooks/useQuestions";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Category, SortParams, Track } from "@/types";

const PER_PAGE = 30;
const MAX_FETCH = 1000;

export default function ProblemsPage() {
  const { user } = useAuth();
  const [track, setTrack] = useState<Track | "all">("all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [notDone, setNotDone] = useState(false);
  const [sort, setSort] = useState<SortParams>({
    field: "number",
    direction: "asc",
  });
  const [page, setPage] = useState(1);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const effectivePerPage = notDone && user ? MAX_FETCH : PER_PAGE;
  const effectivePage = notDone && user ? 1 : page;

  const { questions, total, loading, error } = useQuestions({
    track: track === "all" ? undefined : track,
    category: category === "all" ? undefined : category,
    page: effectivePage,
    perPage: effectivePerPage,
    sort,
  });

  useEffect(() => {
    setPage(1);
  }, [track, category, sort.field, sort.direction, notDone]);

  useEffect(() => {
    if (!user) {
      setCompletedIds(new Set());
      return;
    }

    let isMounted = true;

    async function loadResponses() {
      const response = await fetch("/api/responses", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      if (!isMounted) {
        return;
      }
      const ids = new Set<string>();
      (payload.responses ?? []).forEach((entry: { question_id: string }) => {
        ids.add(entry.question_id);
      });
      setCompletedIds(ids);
    }

    loadResponses();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const filteredQuestions = useMemo(() => {
    if (!notDone || !user) {
      return questions;
    }
    return questions.filter((question) => !completedIds.has(question.id));
  }, [questions, notDone, completedIds, user]);

  const filteredTotal = notDone && user ? filteredQuestions.length : total;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PER_PAGE));

  const pagedQuestions = notDone && user
    ? filteredQuestions.slice((page - 1) * PER_PAGE, page * PER_PAGE)
    : filteredQuestions;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Problems</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Browse the full library of caseground prompts and track your progress.
        </p>
      </div>
      <ProblemFilters
        track={track}
        category={category}
        notDone={notDone}
        sort={sort}
        onTrackChange={(value) => {
          setTrack(value);
          setCategory("all");
        }}
        onCategoryChange={setCategory}
        onNotDoneChange={setNotDone}
        onSortChange={setSort}
      />
      {!user && notDone ? (
        <div className="rounded-md border border-border/80 bg-surface/40 p-4 text-sm text-text-secondary">
          Sign in to filter by unfinished questions.
        </div>
      ) : null}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      ) : error ? (
        <div className="rounded-md border border-error/40 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      ) : (
        <ProblemList questions={pagedQuestions} completedIds={completedIds} />
      )}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-secondary">
          {filteredTotal} total questions
        </p>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
