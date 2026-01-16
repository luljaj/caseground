"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/utils/formatTime";
import type { TimerStatus } from "@/lib/hooks/useTimer";
import { cn } from "@/lib/utils/cn";

export default function Timer({
  remainingSeconds,
  status,
  onStart,
  onPause,
  onStop,
  onSetDuration,
}: {
  remainingSeconds: number;
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onSetDuration: (seconds: number) => void;
}) {
  const [draftMinutes, setDraftMinutes] = useState(
    Math.max(1, Math.round(remainingSeconds / 60))
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      setDraftMinutes(Math.max(1, Math.round(remainingSeconds / 60)));
    }
  }, [remainingSeconds, status]);

  const handleApply = () => {
    const minutes = Number(draftMinutes);
    if (Number.isFinite(minutes) && minutes > 0) {
      onSetDuration(minutes * 60);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Time display */}
      {isEditing ? (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            className="w-12 rounded border border-white/[0.1] bg-transparent px-1.5 py-0.5 text-center font-mono text-[13px] text-text-primary focus:border-white/20 focus:outline-none"
            value={draftMinutes}
            onChange={(e) => setDraftMinutes(Number(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            onBlur={handleApply}
            autoFocus
          />
          <span className="text-[12px] text-text-muted">min</span>
        </div>
      ) : (
        <button
          onClick={() => status === "idle" && setIsEditing(true)}
          className={cn(
            "font-mono text-lg font-medium tracking-tight transition-colors duration-150",
            status === "idle" && "cursor-pointer hover:text-text-secondary",
            status === "finished" && "text-error",
            status === "running" && "text-text-primary",
            status === "paused" && "text-text-secondary"
          )}
          title={status === "idle" ? "Click to edit" : undefined}
        >
          {formatTime(remainingSeconds)}
        </button>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1">
        {status === "running" ? (
          <button
            onClick={onPause}
            className="rounded p-1.5 text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text-secondary"
            aria-label="Pause"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="currentColor">
              <rect x="3" y="2" width="3" height="10" rx="0.5" />
              <rect x="8" y="2" width="3" height="10" rx="0.5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onStart}
            className="rounded p-1.5 text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text-secondary"
            aria-label="Start"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 2.5a.5.5 0 0 1 .764-.424l8 5a.5.5 0 0 1 0 .848l-8 5A.5.5 0 0 1 3 12.5v-10z" />
            </svg>
          </button>
        )}
        <button
          onClick={onStop}
          className="rounded p-1.5 text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text-secondary"
          aria-label="Reset"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 7a5 5 0 1 1 1.5 3.5M2 11V7h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
