"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/utils/formatTime";
import type { TimerStatus } from "@/lib/hooks/useTimer";
import Button from "@/components/ui/Button";

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
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-border/80 bg-surface/40 px-4 py-3">
      <div
        className={`text-2xl font-semibold tracking-[0.2em] ${
          status === "finished" ? "animate-pulse text-error" : "text-text-primary"
        }`}
      >
        {formatTime(remainingSeconds)}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-text-secondary">
        <label className="flex items-center gap-2">
          <span>Edit time</span>
          <input
            type="number"
            min={1}
            className="w-20 rounded-md border border-border bg-background px-2 py-1 text-[12px] text-text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            value={draftMinutes}
            onChange={(event) => setDraftMinutes(Number(event.target.value))}
            onBlur={handleApply}
          />
        </label>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleApply}
        >
          Apply
        </Button>
        {status === "running" ? (
          <Button type="button" size="sm" variant="ghost" onClick={onPause}>
            Pause
          </Button>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={onStart}>
            Start
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={onStop}>
          Stop
        </Button>
      </div>
    </div>
  );
}
