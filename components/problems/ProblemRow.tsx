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
  const statusLabel = isCompleted ? "Done" : "Not started";

  return (
    <tr className="group border-b border-border/60 text-sm transition-colors duration-150 hover:bg-surface/30">
      <td className="relative px-6 py-4 text-text-secondary">
        <span className="absolute inset-y-0 left-0 w-0.5 bg-transparent transition-colors duration-150 group-hover:bg-accent" />
        {question.number}
      </td>
      <td className="px-6 py-4">
        <Link
          href={`/problems/${question.id}`}
          className="text-text-primary transition-colors duration-150 hover:text-accent"
        >
          <span className="block text-sm font-semibold text-text-primary">
            {title}
          </span>
          <span className="mt-1 block text-[13px] text-text-secondary">
            {prompt}
          </span>
        </Link>
      </td>
      <td className="px-6 py-4 text-[13px] text-text-secondary">
        {trackLabels[question.track]}
      </td>
      <td className="px-6 py-4 text-[13px] text-text-secondary">
        {question.category}
      </td>
      <td className="px-6 py-4 text-[13px]">
        <span className="flex items-center gap-2 text-text-secondary">
          <span
            className={`h-2 w-2 rounded-full ${
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
