"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useQueue } from "@/lib/hooks/useQueue";
import { useSettings } from "@/lib/hooks/useSettings";
import { formatTime } from "@/lib/utils/formatTime";
import { cn } from "@/lib/utils/cn";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

export default function QueueOverlay() {
  const router = useRouter();
  const {
    state,
    currentProblemId,
    activeTimerSeconds,
    setCollapsed,
    markSkipped,
    advanceQueue,
    exitQueue,
    resetProgress,
  } = useQueue();
  const { settings } = useSettings();

  const totalProblems = state.problemIds.length;

  const totalSeconds = useMemo(() => {
    if (!state.startTime || state.completed.length === 0) {
      return null;
    }
    const lastCompletedAt =
      state.completed[state.completed.length - 1]?.completedAt ?? Date.now();
    const elapsed = Math.max(0, Math.round((lastCompletedAt - state.startTime) / 1000));
    return elapsed;
  }, [state.completed, state.startTime]);

  if (!state.isPlaying && !state.isComplete) {
    return null;
  }

  const progressPercent =
    totalProblems > 0 ? Math.round((state.completedCount / totalProblems) * 100) : 0;

  const timerLabel =
    typeof activeTimerSeconds === "number"
      ? formatTime(activeTimerSeconds)
      : "--:--";

  const handleSkip = () => {
    if (!currentProblemId) {
      return;
    }
    const nextId = state.problemIds[state.currentIndex + 1];
    markSkipped(currentProblemId);
    advanceQueue();
    if (nextId) {
      router.push(`/problems/${nextId}`);
    }
  };

  const handleExit = () => {
    exitQueue();
    router.push("/problems");
  };

  if (state.isComplete) {
    return (
      <div className="fixed bottom-6 left-1/2 z-50 w-[92vw] max-w-3xl -translate-x-1/2">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Queue Complete!</h3>
            <span className="text-xs text-text-muted">
              {totalProblems} problems finished
            </span>
          </div>
          {totalSeconds !== null ? (
            <p className="mt-2 text-sm text-text-secondary">
              Total time: {formatDuration(totalSeconds)}
            </p>
          ) : null}

          <div className="mt-4 space-y-2">
            {state.completed.map((item, index) => {
              const meta = state.meta[item.problemId];
              const label = meta?.title ?? `Problem ${index + 1}`;
              return (
                <div
                  key={item.problemId}
                  className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-3 text-sm"
                >
                  <div className="text-text-primary">{label}</div>
                  {item.responseId ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        router.push(
                          `/problems/${item.problemId}/results?response_id=${item.responseId}`
                        )
                      }
                    >
                      View Results
                    </Button>
                  ) : (
                    <span className="text-xs text-text-muted">Skipped</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                resetProgress();
                router.push("/problems");
              }}
            >
              Back to Problems
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[92vw] max-w-3xl -translate-x-1/2">
      <div
        className={cn(
          "rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-4 shadow-2xl transition-all",
          state.collapsed && "cursor-pointer"
        )}
        onClick={() => {
          if (state.collapsed) {
            setCollapsed(false);
          }
        }}
        role={state.collapsed ? "button" : undefined}
        tabIndex={state.collapsed ? 0 : -1}
      >
        {state.collapsed ? (
          <div className="flex items-center justify-between gap-4 px-2 py-1 text-sm text-text-secondary">
            <span>
              Queue: Problem {state.currentIndex + 1} of {totalProblems}
            </span>
            <span className="flex items-center gap-2 text-text-muted">
              Time {timerLabel}
            </span>
          </div>
        ) : (
          <div className="px-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Queue Mode
              </h3>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-text-muted hover:text-text-secondary"
              >
                -
              </button>
            </div>

            <div className="mt-3 text-sm text-text-secondary">
              Problem {state.currentIndex + 1} of {totalProblems}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-text-secondary">
              <span>Time {timerLabel}</span>
              {settings.showResultsBetween ? (
                <span className="text-xs text-text-muted">
                  Results delay on
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button size="sm" variant="ghost" onClick={handleSkip}>
                  Skip Problem
                </Button>
                <Button size="sm" variant="ghost" onClick={handleSkip}>
                  Next {"->"}
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={handleExit}>
                Exit Queue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
