"use client";

import Link from "next/link";
import type { Question } from "@/types";

const trackConfig: Record<Question["track"], { label: string; color: string }> = {
  estimations: {
    label: "Estimations",
    color: "text-blue-400/70",
  },
  behaviorals: {
    label: "Behaviorals",
    color: "text-violet-400/70",
  },
  reasoning: {
    label: "Reasoning",
    color: "text-amber-400/70",
  },
};

export default function ProblemRow({
  question,
  isCompleted,
  isAddingMode,
  isQueued,
  onToggleQueue,
}: {
  question: Question;
  isCompleted: boolean;
  isAddingMode: boolean;
  isQueued: boolean;
  onToggleQueue: (questionId: string, meta: {
    title: string;
    track: Question["track"];
    category: Question["category"];
    suggested_time: number;
    number: number;
  }) => void;
}) {
  const title = question.title || "Untitled";

  return (
    <tr className="group relative bg-black/20 transition-all duration-200 hover:bg-white/[0.02] hover:scale-[1.02] hover:-translate-y-1 hover:z-10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-t border-[#27272a] hover:border-transparent">
      {/* Status */}
      <td className="px-4 py-4 sm:px-8">
        <div className="flex items-center justify-start">
          {isAddingMode ? (
            <button
              type="button"
              onClick={() =>
                onToggleQueue(question.id, {
                  title,
                  track: question.track,
                  category: question.category,
                  suggested_time: question.suggested_time,
                  number: question.number,
                })
              }
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                isQueued
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-700 text-zinc-500 hover:text-white"
              }`}
              aria-pressed={isQueued}
              aria-label={isQueued ? "Remove from queue" : "Add to queue"}
            >
              {isQueued ? (
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path
                    d="M6 2.5V9.5M2.5 6H9.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          ) : isCompleted ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <svg
                viewBox="0 0 12 12"
                fill="none"
                aria-label="Completed"
                className="h-3 w-3"
              >
                <path
                  d="M2.5 6L5 8.5L9.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : (
            <span
              className="inline-block h-5 w-5 rounded-full border border-zinc-700"
              aria-hidden="true"
            />
          )}
        </div>
      </td>

      {/* Number */}
      <td className="px-2 py-4 sm:px-8">
        <div className="flex items-center justify-start">
          <span className="relative -top-[0px] font-mono text-[13px] text-[#9F9FA9]">
            {question.number}
          </span>
        </div>
      </td>

      {/* Title */}
      <td className="px-2 py-4 sm:px-8">
        <div className="flex items-center justify-start">
          <Link
            href={`/problems/${question.id}`}
            className="block truncate text-[13px] sm:text-[15px] text-white transition-all duration-150 hover:text-white hover:[text-shadow:0_0_8px_rgba(255,255,255,0.5)]"
          >
            {title}
          </Link>
        </div>
      </td>

      {/* Track */}
      <td className="hidden px-2 py-4 sm:px-8 sm:table-cell">
        <div className="flex items-center justify-start">
          <span
            className={`text-[11px] sm:text-[13px] ${trackConfig[question.track].color}`}
          >
            {trackConfig[question.track].label}
          </span>
        </div>
      </td>

      {/* Category */}
      <td className="hidden px-8 py-4 lg:table-cell">
        <div className="flex items-center justify-start">
          <span className="text-[13px] text-[#9F9FA9] whitespace-nowrap">
            {question.category}
          </span>
        </div>
      </td>
    </tr>
  );
}
