"use client";

import { cn } from "@/lib/utils/cn";

type QueueCardItem = {
  id: string;
  title: string;
  track?: string;
  category?: string;
  suggestedTime?: number;
  number?: number;
};

const trackColors: Record<string, string> = {
  estimations: "text-blue-400/70",
  behaviorals: "text-violet-400/70",
  reasoning: "text-amber-400/70",
};

export default function QueueCard({
  item,
  index,
  isCurrent,
  isDragging,
  isDragOver,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  item: QueueCardItem;
  index: number;
  isCurrent: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onRemove: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}) {
  const trackColor = item.track ? trackColors[item.track] : "text-zinc-400";

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 px-4 py-3 transition-all",
        isCurrent && "border-accent/40 bg-accent/10",
        isDragOver && "border-accent/60",
        isDragging && "opacity-60"
      )}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
        onDragStart(index);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(index);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(index);
      }}
    >
      <div className="flex items-center text-zinc-500 cursor-grab select-none">
        <span className="text-lg leading-none">||</span>
      </div>
      <div className="flex flex-1 items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-primary">
            {item.number ? `${item.number}. ` : ""}
            {item.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            {item.track ? <span className={trackColor}>{item.track}</span> : null}
            {item.category ? <span>{item.category}</span> : null}
            {typeof item.suggestedTime === "number" ? (
              <span>{item.suggestedTime} min</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-white"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
