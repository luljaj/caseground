"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import CollectionCard from "@/components/collections/CollectionCard";
import CollectionSection from "@/components/collections/CollectionSection";
import CreateCustomModal from "@/components/collections/CreateCustomModal";
import { useAuth } from "@/lib/hooks/useAuth";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { useCollection } from "@/lib/hooks/useCollection";
import { useCustomCollections } from "@/lib/hooks/useCustomCollections";
import {
  COLLECTION_SECTION_LABELS,
  type Collection,
  type CollectionSection,
  type CollectionWithStatus,
  type UserCollectionCompletion,
} from "@/types";

const JOB_SECTIONS: CollectionSection[] = [
  "consulting",
  "ib",
  "pe",
  "pm",
  "corporate_strategy",
  "tech",
];

const SPECIALIZED_SECTIONS: CollectionSection[] = [
  "brain_teaser",
  "behavioral",
  "market_sizing",
  "profitability",
  "technical",
];

function shuffleCollections(items: CollectionWithStatus[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function CollectionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { preferences } = useOnboarding();
  const { startCollection } = useCollection();
  const { collections: customCollections, createCollection } = useCustomCollections();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [completions, setCompletions] = useState<UserCollectionCompletion[]>([]);
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCollections() {
      try {
        setLoading(true);
        const response = await fetch("/api/collections", { cache: "no-store" });
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const payload = await response.json();
        if (isMounted) {
          setCollections(payload.collections ?? []);
        }
      } catch {
        return;
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setCompletions([]);
      setAttemptedIds(new Set());
      return;
    }

    let isMounted = true;

    async function loadUserData() {
      try {
        const [completionRes, responsesRes] = await Promise.all([
          fetch("/api/collections/complete", { cache: "no-store" }),
          fetch("/api/responses", { cache: "no-store" }),
        ]);

        if (completionRes.ok) {
          const payload = await completionRes.json();
          if (isMounted) {
            setCompletions(payload.completions ?? []);
          }
        }

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
      } catch {
        return;
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const completionMap = useMemo(() => {
    const map = new Map<string, UserCollectionCompletion>();
    completions.forEach((completion) => {
      map.set(completion.collection_id, completion);
    });
    return map;
  }, [completions]);

  const collectionsWithStatus = useMemo(() => {
    return collections.map((collection) => {
      const totalProblems = collection.problem_ids.length;
      const attemptedCount = collection.problem_ids.filter((id) =>
        attemptedIds.has(id)
      ).length;
      const attemptedPercent = totalProblems
        ? Math.round((attemptedCount / totalProblems) * 100)
        : 0;
      const completion = completionMap.get(collection.id) ?? null;
      return {
        ...collection,
        attemptedPercent,
        problemsAttemptedCount: attemptedCount,
        isComplete: Boolean(completion),
        completedAt: completion?.completed_at ?? null,
      } satisfies CollectionWithStatus;
    });
  }, [collections, attemptedIds, completionMap]);

  const customCards = useMemo(() => {
    return customCollections.map((collection) => {
      const totalProblems = collection.problem_ids.length;
      const attemptedCount = collection.problem_ids.filter((id) =>
        attemptedIds.has(id)
      ).length;
      const attemptedPercent = totalProblems
        ? Math.round((attemptedCount / totalProblems) * 100)
        : 0;

      return {
        ...collection,
        attemptedPercent,
        attemptedCount,
      };
    });
  }, [customCollections, attemptedIds]);

  const featuredCollections = useMemo(() => {
    return collectionsWithStatus.filter((collection) => collection.is_featured);
  }, [collectionsWithStatus]);

  const recommendedCollections = useMemo(() => {
    const role = preferences?.target_role ?? null;
    if (role) {
      const filtered = featuredCollections.filter((collection) =>
        Array.isArray(collection.target_roles)
          ? collection.target_roles.includes(role)
          : false
      );
      return shuffleCollections(filtered.length > 0 ? filtered : featuredCollections);
    }
    return shuffleCollections(featuredCollections);
  }, [preferences, featuredCollections]);

  const handleStartCustom = (id: string, name: string, problemIds: string[]) => {
    if (problemIds.length === 0) {
      return;
    }
    startCollection({
      collectionId: id,
      collectionSlug: `custom-${id}`,
      collectionName: name,
      problemIds,
      isCustom: true,
    });
    router.push(`/problems/${problemIds[0]}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Collections</h1>
          <p className="text-sm text-text-secondary">
            Master case interviews with curated problem sets.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
          + Create Custom
        </Button>
      </div>

      {customCards.length > 0 ? (
        <CollectionSection title="Your Custom Collections">
          {customCards.map((collection) => (
            <CollectionCard
              key={collection.id}
              title={collection.name}
              description={"Custom collection"}
              problemCount={collection.problem_ids.length}
              attemptedPercent={collection.attemptedPercent}
              isComplete={collection.is_complete}
              onClick={() =>
                handleStartCustom(collection.id, collection.name, collection.problem_ids)
              }
              actionLabel="Start"
            />
          ))}
        </CollectionSection>
      ) : null}

      {recommendedCollections.length > 0 ? (
        <CollectionSection title="Recommended For You">
          {recommendedCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              title={collection.name}
              description={collection.description}
              difficulty={collection.difficulty}
              estimatedMinutes={collection.estimated_time_minutes}
              problemCount={collection.problem_ids.length}
              attemptedPercent={collection.attemptedPercent}
              isComplete={collection.isComplete}
              href={`/collections/${collection.slug}`}
            />
          ))}
        </CollectionSection>
      ) : null}

      {JOB_SECTIONS.map((section) => {
        const items = collectionsWithStatus.filter(
          (collection) => collection.section === section
        );
        if (items.length === 0) {
          return null;
        }
        return (
          <CollectionSection
            key={section}
            title={COLLECTION_SECTION_LABELS[section]}
          >
            {items.map((collection) => (
              <CollectionCard
                key={collection.id}
                title={collection.name}
                description={collection.description}
                difficulty={collection.difficulty}
                estimatedMinutes={collection.estimated_time_minutes}
                problemCount={collection.problem_ids.length}
                attemptedPercent={collection.attemptedPercent}
                isComplete={collection.isComplete}
                href={`/collections/${collection.slug}`}
              />
            ))}
          </CollectionSection>
        );
      })}

      {SPECIALIZED_SECTIONS.map((section) => {
        const items = collectionsWithStatus.filter(
          (collection) => collection.section === section
        );
        if (items.length === 0) {
          return null;
        }
        return (
          <CollectionSection
            key={section}
            title={COLLECTION_SECTION_LABELS[section]}
          >
            {items.map((collection) => (
              <CollectionCard
                key={collection.id}
                title={collection.name}
                description={collection.description}
                difficulty={collection.difficulty}
                estimatedMinutes={collection.estimated_time_minutes}
                problemCount={collection.problem_ids.length}
                attemptedPercent={collection.attemptedPercent}
                isComplete={collection.isComplete}
                href={`/collections/${collection.slug}`}
              />
            ))}
          </CollectionSection>
        );
      })}

      <CreateCustomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(name, problemIds) => {
          createCollection(name, problemIds);
        }}
      />
    </div>
  );
}
