"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import ExitConfirmModal from "@/components/collections/ExitConfirmModal";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCollection } from "@/lib/hooks/useCollection";
import { useCustomCollections } from "@/lib/hooks/useCustomCollections";
import { cn } from "@/lib/utils/cn";

export default function CollectionOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { markComplete } = useCustomCollections();
  const {
    session,
    currentProblemId,
    collapsed,
    setCollapsed,
    markSkipped,
    advanceCollection,
    exitCollection,
  } = useCollection();
  const [canSkip, setCanSkip] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const totalProblems = session?.problemIds.length ?? 0;
  const currentPosition = session ? session.currentIndex + 1 : 0;

  const progressPercent = useMemo(() => {
    if (!session || totalProblems === 0) {
      return 0;
    }
    return Math.round((currentPosition / totalProblems) * 100);
  }, [session, totalProblems, currentPosition]);

  useEffect(() => {
    if (!session) {
      setShowExitModal(false);
      return;
    }

    if (!pathname.startsWith("/problems/")) {
      setShowExitModal(true);
      return;
    }

    const parts = pathname.split("/");
    const problemId = parts[2];
    if (!problemId) {
      setShowExitModal(true);
      return;
    }

    if (!session.problemIds.includes(problemId)) {
      setShowExitModal(true);
      return;
    }

    setShowExitModal(false);
  }, [pathname, session]);

  useEffect(() => {
    let isMounted = true;

    async function checkSkipEligibility() {
      if (!user || !currentProblemId) {
        if (isMounted) {
          setCanSkip(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `/api/responses?question_id=${currentProblemId}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          if (isMounted) setCanSkip(false);
          return;
        }
        const payload = await response.json();
        const responses = payload.responses ?? [];
        if (isMounted) {
          setCanSkip(responses.length > 0);
        }
      } catch {
        if (isMounted) setCanSkip(false);
      }
    }

    checkSkipEligibility();

    return () => {
      isMounted = false;
    };
  }, [user, currentProblemId]);

  if (!session) {
    return null;
  }

  const collectionName = session.collectionName ?? session.collectionSlug;

  const handleExit = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    exitCollection();
    setShowExitModal(false);
    router.push("/collections");
  };

  const handleReturn = () => {
    setShowExitModal(false);
    if (currentProblemId) {
      router.push(`/problems/${currentProblemId}`);
    }
  };

  const finishCollection = () => {
    const slug = session.collectionSlug;
    const isCustom = Boolean(session.isCustom);
    if (isCustom) {
      markComplete(session.collectionId, true);
      exitCollection();
      router.push("/collections");
      return;
    }
    exitCollection();
    router.push(`/collections/${slug}/complete`);
  };

  const handleSkip = () => {
    if (!currentProblemId || !canSkip) {
      return;
    }
    const nextId = session.problemIds[session.currentIndex + 1];
    markSkipped(currentProblemId);
    if (nextId) {
      advanceCollection();
      router.push(`/problems/${nextId}`);
      return;
    }
    finishCollection();
  };

  const showReturnAction =
    Boolean(currentProblemId) && pathname !== `/problems/${currentProblemId}`;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-40 w-[92vw] max-w-3xl -translate-x-1/2">
        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-4 shadow-2xl transition-all",
            collapsed && "cursor-pointer"
          )}
          onClick={() => {
            if (collapsed) {
              setCollapsed(false);
            }
          }}
          role={collapsed ? "button" : undefined}
          tabIndex={collapsed ? 0 : -1}
        >
          {collapsed ? (
            <div className="flex items-center justify-between gap-4 px-2 py-1 text-sm text-text-secondary">
              <span>
                ^ Collection: {currentPosition}/{totalProblems}
              </span>
              <span className="text-text-muted">Tap to expand</span>
            </div>
          ) : (
            <div className="px-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  {collectionName}
                </h3>
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-text-muted hover:text-text-secondary"
                >
                  v
                </button>
              </div>

              <div className="mt-2 text-sm text-text-secondary">
                Problem {currentPosition} of {totalProblems}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={!canSkip}
                >
                  Skip
                </Button>
                <Button size="sm" variant="ghost" onClick={handleExit}>
                  Exit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ExitConfirmModal
        open={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onConfirm={handleConfirmExit}
        onReturn={showReturnAction ? handleReturn : undefined}
      />
    </>
  );
}
