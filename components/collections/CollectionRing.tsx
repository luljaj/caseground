"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";

export default function CollectionRing({
  attemptedPercent,
  isComplete,
  size = 44,
  stroke = 4,
}: {
  attemptedPercent: number;
  isComplete: boolean;
  size?: number;
  stroke?: number;
}) {
  const normalized = Math.max(0, Math.min(100, attemptedPercent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (normalized / 100) * circumference;

  const dashOffset = useMemo(() => {
    return circumference - progress;
  }, [circumference, progress]);

  const ringColor = isComplete
    ? "stroke-emerald-500"
    : normalized > 0
      ? "stroke-blue-500"
      : "stroke-zinc-700";

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        role="img"
        aria-label={isComplete ? "Collection complete" : "Collection progress"}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-700/70"
        />
        {normalized > 0 || isComplete ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isComplete ? 0 : dashOffset}
            className={cn("transition-all duration-300", ringColor)}
          />
        ) : null}
      </svg>
      {isComplete ? (
        <div className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" aria-hidden="true">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
    </div>
  );
}
