import Link from "next/link";
import type { Question } from "@/types";
import { cn } from "@/lib/utils/cn";

const trackLabels: Record<Question["track"], string> = {
  estimations: "Estimations",
  behaviorals: "Behaviorals",
  reasoning: "Reasoning",
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
    <tr className="group border-b border-white/5 transition-colors hover:bg-white/[0.02]">
      <td className="px-6 py-4 align-middle">
        {isCompleted ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-success/20 bg-success/10 text-success">
            <svg
              viewBox="0 0 12 10"
              fill="none"
              aria-hidden="true"
              className="h-3 w-3"
            >
              <path
                d="M1 5L4.5 8.5L11 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : (
          <span className="inline-flex h-5 w-5" aria-hidden="true" />
        )}
      </td>
      <td className="px-6 py-4 align-middle">
        <span className="text-xs font-medium text-text-secondary/60">
          {question.number}
        </span>
      </td>
      <td className="px-6 py-4 align-middle">
        <Link
          href={`/problems/${question.id}`}
          className="block"
        >
          <span className="block text-sm font-medium text-text-primary transition-all duration-200 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
            {title}
          </span>
        </Link>
      </td>
      <td className="px-6 py-4 align-middle">
         <span className="inline-flex items-center rounded border border-white/5 bg-white/5 px-2 py-0.5 text-[11px] text-text-secondary">
          {trackLabels[question.track]}
        </span>
      </td>
      <td className="px-6 py-4 align-middle">
        <span className="inline-flex items-center rounded border border-white/5 bg-white/5 px-2 py-0.5 text-[11px] text-text-secondary">
          {question.category}
        </span>
      </td>
    </tr>
  );
}
