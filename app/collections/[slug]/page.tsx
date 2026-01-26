"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import CollectionRing from "@/components/collections/CollectionRing";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCollection } from "@/lib/hooks/useCollection";
import type {
  Collection,
  UserCollectionCompletion,
} from "@/types";

type ProblemSummary = {
  id: string;
  title: string;
  track: string;
  category: string;
  suggested_time: number;
};

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { startCollection } = useCollection();
  const slug = params?.slug as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
  const [completions, setCompletions] = useState<UserCollectionCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCollection() {
      try {
        setLoading(true);
        const response = await fetch(`/api/collections/${slug}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          if (isMounted) {
            setError("Collection not found.");
            setLoading(false);
          }
          return;
        }
        const payload = await response.json();
        if (isMounted) {
          setCollection(payload.collection ?? null);
          setProblems(payload.problems ?? []);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError("Unable to load collection.");
          setLoading(false);
        }
      }
    }

    if (slug) {
      loadCollection();
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!user) {
      setAttemptedIds(new Set());
      setCompletions([]);
      return;
    }

    let isMounted = true;

    async function loadUserData() {
      try {
        const [responsesRes, completionsRes] = await Promise.all([
          fetch("/api/responses", { cache: "no-store" }),
          fetch("/api/collections/complete", { cache: "no-store" }),
        ]);

        if (responsesRes.ok) {
          const payload = await responsesRes.json();
          if (isMounted) {
            const next = new Set<string>();
            (payload.responses ?? []).forEach((entry: { question_id: string }) => {
              next.add(entry.question_id);
            });
            setAttemptedIds(next);
          }
        }

        if (completionsRes.ok) {
          const payload = await completionsRes.json();
          if (isMounted) {
            setCompletions(payload.completions ?? []);
          }
        }
      } catch {
        return;
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const completion = useMemo(() => {
    if (!collection) {
      return null;
    }
    return completions.find((entry) => entry.collection_id === collection.id) ?? null;
  }, [collection, completions]);

  const attemptedCount = useMemo(() => {
    if (!collection) {
      return 0;
    }
    return collection.problem_ids.filter((id) => attemptedIds.has(id)).length;
  }, [collection, attemptedIds]);

  const attemptedPercent = useMemo(() => {
    if (!collection || collection.problem_ids.length === 0) {
      return 0;
    }
    return Math.round((attemptedCount / collection.problem_ids.length) * 100);
  }, [collection, attemptedCount]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="rounded-md border border-error/40 bg-error/10 p-4 text-sm text-error">
        {error ?? "Collection not found."}
      </div>
    );
  }

  const isComplete = Boolean(completion);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <Link
        href="/collections"
        className="text-xs text-text-secondary hover:text-text-primary"
      >
        {"<- Back to Collections"}
      </Link>

      <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-surface/40 p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <CollectionRing
              attemptedPercent={attemptedPercent}
              isComplete={isComplete}
              size={52}
            />
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                {collection.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                {collection.difficulty ? (
                  <span className="rounded-full border border-white/10 px-2 py-0.5">
                    {collection.difficulty}
                  </span>
                ) : null}
                <span>
                  {collection.problem_ids.length} problems
                  {collection.estimated_time_minutes
                    ? ` | ${collection.estimated_time_minutes} min`
                    : ""}
                </span>
              </div>
              {isComplete && completion?.completed_at ? (
                <p className="mt-2 text-xs text-emerald-300">
                  Completed {new Date(completion.completed_at).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </div>
          <Button
            size="sm"
            disabled={collection.problem_ids.length === 0}
            onClick={() => {
              if (collection.problem_ids.length === 0) {
                return;
              }
              startCollection({
                collectionId: collection.id,
                collectionSlug: collection.slug,
                collectionName: collection.name,
                problemIds: collection.problem_ids,
              });
              router.push(`/problems/${collection.problem_ids[0]}`);
            }}
          >
            Start Collection
          </Button>
        </div>

        {collection.long_description || collection.description ? (
          <p className="text-sm text-text-secondary">
            {collection.long_description ?? collection.description}
          </p>
        ) : null}

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          Progress is not saved if you leave. Starting this collection will always begin from problem 1.
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary/70">
          Problems in this collection
        </h2>
        <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-surface/40">
          {problems.map((problem, index) => {
            const isAttempted = attemptedIds.has(problem.id);
            const rowContent = (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">{index + 1}</span>
                  <span className="text-sm text-text-primary">{problem.title}</span>
                  {isAttempted ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-text-muted">
                  {problem.suggested_time} min
                </span>
              </div>
            );

            if (isComplete) {
              return (
                <button
                  key={problem.id}
                  type="button"
                  onClick={() =>
                    router.push(`/collections/${collection.slug}/complete?problem=${problem.id}`)
                  }
                  className="w-full text-left transition-colors hover:bg-white/5"
                >
                  {rowContent}
                </button>
              );
            }

            return (
              <div key={problem.id} className="text-left">
                {rowContent}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
