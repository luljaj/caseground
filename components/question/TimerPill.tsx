"use client";

import { formatTime } from "@/lib/utils/formatTime";
import type { TimerStatus } from "@/lib/hooks/useTimer";
import { cn } from "@/lib/utils/cn";

export default function TimerPill({
    remainingSeconds,
    status,
    onStart,
    onPause,
}: {
    remainingSeconds: number;
    status: TimerStatus;
    onStart: () => void;
    onPause: () => void;
}) {
    const isFinished = status === "finished";
    const isRunning = status === "running";

    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 border transition-all duration-200",
                isFinished
                    ? "border-red-500/50 bg-red-500/15 animate-pulse"
                    : "border-zinc-700/50 bg-zinc-800/60"
            )}
        >
            {/* Timer display */}
            <span
                className={cn(
                    "font-mono text-sm font-medium tabular-nums tracking-tight",
                    isFinished ? "text-red-400" : "text-zinc-200"
                )}
            >
                {formatTime(remainingSeconds)}
            </span>

            {/* Divider */}
            <div className="h-3 w-px bg-zinc-700/60" />

            {/* Play/Pause button */}
            {isRunning ? (
                <button
                    type="button"
                    onClick={onPause}
                    className="flex items-center justify-center p-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                    aria-label="Pause timer"
                >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="currentColor">
                        <rect x="3" y="2" width="2.5" height="10" rx="0.5" />
                        <rect x="8.5" y="2" width="2.5" height="10" rx="0.5" />
                    </svg>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onStart}
                    className={cn(
                        "flex items-center justify-center p-0.5 transition-colors",
                        isFinished
                            ? "text-red-400 hover:text-red-300"
                            : "text-zinc-400 hover:text-zinc-200"
                    )}
                    aria-label="Start timer"
                >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M3 2.5a.5.5 0 0 1 .764-.424l8 5a.5.5 0 0 1 0 .848l-8 5A.5.5 0 0 1 3 12.5v-10z" />
                    </svg>
                </button>
            )}
        </div>
    );
}
