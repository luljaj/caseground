"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import CollectionRing from "@/components/collections/CollectionRing";
import CompletionResultsTabs from "@/components/collections/CompletionResultsTabs";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCollection } from "@/lib/hooks/useCollection";
import type { Collection } from "@/types";

type ProblemDetail = {
  id: string;
  title: string;
  example_answer?: string | null;
};

type ResponseEntry = {
  id: string;
  question_id: string;
  response: string;
  ai_feedback?: string | null;
  created_at: string;
};

export default function CollectionCompletePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { exitCollection } = useCollection();
  const slug = params?.slug as string;
  const initialProblemId = searchParams.get("problem");

  const [collection, setCollection] = useState<Collection | null>(null);
  const [problems, setProblems] = useState<ProblemDetail[]>([]);
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    exitCollection();
  }, [exitCollection]);

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
      setResponses([]);
      return;
    }

    let isMounted = true;

    async function loadResponses() {
      const result = await fetch("/api/responses", { cache: "no-store" });
      if (!result.ok) {
        return;
      }
      const payload = await result.json();
      if (isMounted) {
        setResponses(payload.responses ?? []);
      }
    }

    loadResponses();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    async function loadUser() {
      const result = await fetch("/api/user", { cache: "no-store" });
      if (!result.ok) {
        return;
      }
      const payload = await result.json();
      if (isMounted) {
        setCredits(payload.user?.ai_credits ?? 0);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    async function checkSubscription() {
      const res = await fetch("/api/stats");
      if (!res.ok) return;
      const data = await res.json();
      if (isMounted) {
        setIsSubscriber(
          ["active", "trialing", "past_due"].includes(data.subscription?.status)
        );
      }
    }

    checkSubscription();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !collection) {
      return;
    }

    let isMounted = true;
    const collectionId = collection?.id;

    async function markComplete() {
      if (!collectionId) {
        return;
      }
      const result = await fetch("/api/collections/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection_id: collectionId }),
      });

      if (!result.ok) {
        return;
      }
      const payload = await result.json();
      if (isMounted) {
        setCompletedAt(payload.completion?.completed_at ?? new Date().toISOString());
      }
    }

    markComplete();

    return () => {
      isMounted = false;
    };
  }, [user, collection]);

  const filteredResponses = useMemo(() => {
    if (!collection) {
      return [];
    }
    const ids = new Set(collection.problem_ids);
    return responses.filter((response) => ids.has(response.question_id));
  }, [responses, collection]);

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

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-white/5 bg-surface/30 p-8 text-center text-sm text-text-secondary">
        Sign in to view your collection results.
      </div>
    );
  }

  if (credits === null) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <CollectionRing attemptedPercent={100} isComplete size={54} />
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              You completed {collection.name}!
            </h1>
            {completedAt ? (
              <p className="mt-1 text-sm text-text-secondary">
                Completed on {new Date(completedAt).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => router.push("/collections")}>
          Back to Collections
        </Button>
      </div>

      <CompletionResultsTabs
        problems={problems}
        responses={filteredResponses}
        initialProblemId={initialProblemId}
        credits={credits}
        isSubscriber={isSubscriber}
      />
    </div>
  );
}
