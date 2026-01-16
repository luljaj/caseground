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
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
         {isEditing ? (
            <div className="flex items-center gap-2 h-[48px]">
               <input
                type="number"
                min={1}
                className="w-16 rounded border border-white/10 bg-transparent px-2 py-1 text-2xl font-mono text-center text-text-primary focus:outline-none focus:border-white/30"
                value={draftMinutes}
                onChange={(e) => setDraftMinutes(Number(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                autoFocus
              />
              <span className="text-sm text-text-secondary">min</span>
              <button onClick={handleApply} className="text-xs text-accent hover:text-accent/80 ml-2">Save</button>
            </div>
         ) : (
            <div 
                onClick={() => status === "idle" && setIsEditing(true)}
                className={`text-4xl font-mono font-medium tracking-tight cursor-pointer select-none transition-colors ${
                    status === "finished" ? "text-error animate-pulse" : "text-text-primary hover:text-text-primary/80"
                }`}
                title="Click to edit duration"
            >
                {formatTime(remainingSeconds)}
            </div>
         )}
      </div>
      
      <div className="flex items-center gap-2">
        {status === "running" ? (
          <Button size="sm" variant="secondary" onClick={onPause} className="h-7 px-3 text-xs border-white/10">
            Pause
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onStart} className="h-7 px-3 text-xs border-white/10">
            Start
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onStop} className="h-7 px-3 text-xs text-text-secondary hover:text-text-primary">
            Reset
        </Button>
      </div>
    </div>
  );
}
