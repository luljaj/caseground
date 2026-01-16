import Link from "next/link";
import type { Question } from "@/types";

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
  const prompt =
    question.prompt.length > 90
      ? `${question.prompt.slice(0, 90)}...`
      : question.prompt;
  const statusLabel = isCompleted ? "done" : "not started";

  return (
    <tr className="h-14 border-b border-border/60 text-sm transition-colors duration-150 hover:bg-surface/30">
      <td className="px-6 py-0 align-middle text-text-secondary">
        {question.number}
      </td>
      <td className="px-6 py-0 align-middle">
        <Link
          href={`/problems/${question.id}`}
          className="text-text-primary transition-colors duration-150 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-0"
        >
          <span className="block text-[13px] font-semibold text-text-primary">
            {title}
          </span>
          <span className="mt-0.5 block text-[12px] leading-tight text-text-secondary">
            {prompt}
          </span>
        </Link>
      </td>
      <td className="px-6 py-0 align-middle text-[13px] text-text-secondary">
        {trackLabels[question.track]}
      </td>
      <td className="px-6 py-0 align-middle text-[13px] text-text-secondary">
        {question.category}
      </td>
      <td className="px-6 py-0 align-middle">
        <span className="flex items-center gap-2 text-[12px] lowercase text-text-secondary">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isCompleted ? "bg-success" : "bg-border"
            }`}
            aria-hidden="true"
          />
          {statusLabel}
        </span>
      </td>
    </tr>
  );
}
