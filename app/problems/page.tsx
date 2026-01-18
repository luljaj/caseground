"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProblemFilters from "@/components/problems/ProblemFilters";
import ProblemList from "@/components/problems/ProblemList";
import Pagination from "@/components/problems/Pagination";
import Spinner from "@/components/ui/Spinner";
import { useQuestions } from "@/lib/hooks/useQuestions";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Category, SortParams, Track } from "@/types";

const PER_PAGE = 30;
const MAX_FETCH = 1000;

function ProblemsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTrack = searchParams.get("track") as Track | null;

  const [track, setTrack] = useState<Track | "all">(initialTrack ?? "all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [notDone, setNotDone] = useState(false);
  const [sort, setSort] = useState<SortParams>({
    field: "number",
    direction: "asc",
  });
  const [page, setPage] = useState(1);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const effectivePerPage = notDone && user ? MAX_FETCH : PER_PAGE;
  const effectivePage = notDone && user ? 1 : page;

  const { questions, total, loading, error } = useQuestions({
    track: track === "all" ? undefined : track,
    category: category === "all" ? undefined : category,
    search: debouncedSearch || undefined,
    page: effectivePage,
    perPage: effectivePerPage,
    sort,
  });

  useEffect(() => {
    setPage(1);
  }, [track, category, sort.field, sort.direction, notDone, debouncedSearch]);

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
    <div className="mx-auto flex max-w-5xl flex-col gap-10 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Problems
        </h1>
        <p className="text-sm text-text-secondary">
          Practice cases across estimations, behaviorals, and technical reasoning.
        </p>
      </div>

      {/* Filters */}
      <ProblemFilters
        track={track}
        category={category}
        search={search}
        notDone={notDone}
        sort={sort}
        onTrackChange={(value) => {
          setTrack(value);
          setCategory("all");
        }}
        onCategoryChange={setCategory}
        onSearchChange={setSearch}
        onNotDoneChange={setNotDone}
        onSortChange={setSort}
      />

      {!user && notDone ? (
        <div className="rounded-md border border-white/[0.06] bg-surface px-4 py-3 text-[13px] text-text-secondary">
          Sign in to filter by unfinished questions.
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size={24} />
        </div>
      ) : error ? (
        <div className="rounded-md border border-error/20 bg-error/5 px-4 py-3 text-[13px] text-error">
          {error}
        </div>
      ) : (
        <ProblemList questions={pagedQuestions} completedIds={completedIds} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-[13px] text-text-muted">
          {filteredTotal} {filteredTotal === 1 ? "question" : "questions"}
        </p>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <>
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center text-center md:hidden">
        <div className="card-surface px-6 py-8">
          <p className="text-sm text-text-secondary">
            Please visit us on your computer.{" "}
            <span className="italic text-text-primary">caseground</span> works
            best on larger screens.
          </p>
        </div>
      </section>
      <div className="hidden md:block">
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <Spinner size={32} />
            </div>
          }
        >
          <ProblemsContent />
        </Suspense>
      </div>
    </>
  );
}
