"use client";

import { cn } from "@/lib/utils/cn";
import type { AIFeedback } from "@/types";

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

export default function FeedbackHistory({
  entries,
  activeId,
  onSelect,
}: {
  entries: AIFeedback[];
  activeId?: string | null;
  onSelect?: (entry: AIFeedback) => void;
}) {
  if (entries.length <= 1) {
    return null;
  }

  const interactive = typeof onSelect === "function";

  return (
    <div className="mt-4 rounded-lg border border-white/5 bg-surface/30 p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500">
        <span>History</span>
        <span>{entries.length} versions</span>
      </div>
      <div className="mt-3 space-y-2">
        {entries.map((entry, index) => {
          const isActive = entry.id === activeId;
          const modelLabel = entry.model
            ? `Model: ${entry.model}`
            : "Model not recorded";
          const label = formatTimestamp(entry.created_at);

          return (
            <button
              key={entry.id}
              type="button"
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left text-xs transition",
                isActive
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-200"
                  : "border-white/5 bg-surface/40 text-zinc-400 hover:border-white/10 hover:bg-surface/50",
                !interactive && "cursor-default"
              )}
              onClick={interactive ? () => onSelect?.(entry) : undefined}
              aria-pressed={isActive}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {index === 0 ? "Latest" : `Version ${entries.length - index}`}
                </span>
                <span>{label}</span>
              </div>
              <div className="mt-1 text-[11px] text-zinc-500">{modelLabel}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
