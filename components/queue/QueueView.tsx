"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import QueueCard from "@/components/queue/QueueCard";
import { useQueue } from "@/lib/hooks/useQueue";
import { useSettings } from "@/lib/hooks/useSettings";
import type { Question } from "@/types";

type QueueViewProps = {
  questions: Question[];
  onAddMore: () => void;
  onStartQueue: () => void;
  startLabel: string;
};

export default function QueueView({
  questions,
  onAddMore,
  onStartQueue,
  startLabel,
}: QueueViewProps) {
  const { state, removeProblem, shuffleQueue, clearQueue, reorderQueue, upsertMeta } =
    useQueue();
  const { settings, updateSetting } = useSettings();
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const questionMap = useMemo(() => {
    return new Map(questions.map((question) => [question.id, question]));
  }, [questions]);

  const queueItems = useMemo(() => {
    return state.problemIds
      .map((id, index) => {
        const question = questionMap.get(id);
        return question ? { question, queueIndex: index } : null;
      })
      .filter((item): item is { question: Question; queueIndex: number } =>
        Boolean(item)
      );
  }, [state.problemIds, questionMap]);

  const hiddenCount = Math.max(0, state.problemIds.length - queueItems.length);

  useEffect(() => {
    queueItems.forEach(({ question }) => {
      upsertMeta(question.id, {
        title: question.title,
        track: question.track,
        category: question.category,
        suggestedTime: question.suggested_time,
        number: question.number,
      });
    });
  }, [queueItems, upsertMeta]);

  const totalQueued = state.problemIds.length;
  const visibleCount = queueItems.length;

  if (totalQueued === 0) {
    return (
      <div className="rounded-[24px] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-12 text-center">
        <p className="text-sm text-text-secondary">Your queue is empty</p>
        <div className="mt-6 flex justify-center">
          <Button onClick={onAddMore} size="sm">
            + Add Problems
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          Queue
          {visibleCount !== totalQueued ? (
            <span className="ml-2 text-xs text-text-muted">
              ({visibleCount}/{totalQueued})
            </span>
          ) : null}
        </h2>
        <Button size="sm" variant="ghost" onClick={onAddMore}>
          + Add More
        </Button>
      </div>

      {hiddenCount > 0 ? (
        <p className="mt-2 text-xs text-text-muted">
          {hiddenCount} queued {hiddenCount === 1 ? "problem" : "problems"} hidden by
          current filters.
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {visibleCount === 0 ? (
          <p className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-6 text-center text-sm text-text-muted">
            No queued problems match the current filters.
          </p>
        ) : (
          queueItems.map(({ question, queueIndex }) => (
            <QueueCard
              key={question.id}
              item={{
                id: question.id,
                title: question.title,
                track: question.track,
                category: question.category,
                suggestedTime: question.suggested_time,
                number: question.number,
              }}
              index={queueIndex}
              isCurrent={
                state.isPlaying && state.problemIds[state.currentIndex] === question.id
              }
              isDragging={draggingIndex === queueIndex}
              isDragOver={dragOverIndex === queueIndex && draggingIndex !== queueIndex}
              onRemove={removeProblem}
              onDragStart={(nextIndex) => {
                setDraggingIndex(nextIndex);
                setDragOverIndex(nextIndex);
              }}
              onDragOver={(nextIndex) => {
                setDragOverIndex(nextIndex);
              }}
              onDrop={(nextIndex) => {
                if (draggingIndex !== null) {
                  reorderQueue(draggingIndex, nextIndex);
                }
                setDraggingIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDraggingIndex(null);
                setDragOverIndex(null);
              }}
            />
          ))
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={clearQueue}>
            Clear All
          </Button>
          <Button size="sm" variant="ghost" onClick={shuffleQueue}>
            Shuffle
          </Button>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={onStartQueue}
          disabled={visibleCount === 0}
        >
          {startLabel} ({visibleCount} {visibleCount === 1 ? "problem" : "problems"})
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="uppercase tracking-wide">Queue Settings</span>
          <span>Saved on this device</span>
        </div>
        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between gap-4 text-sm text-text-secondary">
            <span>Skip completed problems</span>
            <button
              type="button"
              onClick={() => updateSetting("skipCompleted", !settings.skipCompleted)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                settings.skipCompleted
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-zinc-800 text-zinc-400"
              }`}
              aria-pressed={settings.skipCompleted}
            >
              {settings.skipCompleted ? "On" : "Off"}
            </button>
          </label>
          <label className="flex items-center justify-between gap-4 text-sm text-text-secondary">
            <span>Show results between problems</span>
            <button
              type="button"
              onClick={() =>
                updateSetting("showResultsBetween", !settings.showResultsBetween)
              }
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                settings.showResultsBetween
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-zinc-800 text-zinc-400"
              }`}
              aria-pressed={settings.showResultsBetween}
            >
              {settings.showResultsBetween ? "On" : "Off"}
            </button>
          </label>
          <label className="flex items-center justify-between gap-4 text-sm text-text-secondary">
            <span>Results display time (sec)</span>
            <input
              type="number"
              min={1}
              value={settings.resultsDelay}
              onChange={(event) =>
                updateSetting(
                  "resultsDelay",
                  Math.max(1, Number(event.target.value) || 1)
                )
              }
              className="w-20 rounded-md border border-zinc-800 bg-transparent px-2 py-1 text-right text-xs text-text-primary focus:border-zinc-700 focus:outline-none"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
