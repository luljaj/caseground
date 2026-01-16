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
}: {
  question: Question;
  isCompleted: boolean;
}) {
  const title = question.title || "Untitled";

  return (
    <tr className="group transition-colors duration-150 hover:bg-white/[0.02]">
      {/* Status */}
      <td className="px-4 pb-2.5 pt-3.5 align-middle">
        {isCompleted ? (
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-success/15 text-success">
            <svg
              viewBox="0 0 12 12"
              fill="none"
              aria-label="Completed"
              className="h-2.5 w-2.5"
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
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/[0.08]"
            aria-hidden="true"
          />
        )}
      </td>

      {/* Number */}
      <td className="px-4 pb-3.5 pt-2.5 align-middle">
        <span className="font-mono text-[12px] text-text-muted">
          {question.number}
        </span>
      </td>

      {/* Title */}
      <td className="px-4 py-3 align-middle">
        <Link
          href={`/problems/${question.id}`}
          className="block text-[13px] font-medium text-text-primary transition-colors duration-150 hover:text-white"
        >
          {title}
        </Link>
      </td>

      {/* Track */}
      <td className="hidden px-4 py-3 align-middle md:table-cell">
        <span className={`text-[12px] ${trackConfig[question.track].color}`}>
          {trackConfig[question.track].label}
        </span>
      </td>

      {/* Category */}
      <td className="hidden px-4 py-3 align-middle lg:table-cell">
        <span className="text-[12px] text-text-muted">
          {question.category}
        </span>
      </td>
    </tr>
  );
}
