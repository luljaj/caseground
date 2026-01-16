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

  return (
    <tr className="border-b border-border/60 text-sm transition hover:bg-border/20">
      <td className="px-3 py-3 text-text-secondary">{question.number}</td>
      <td className="px-3 py-3">
        <Link
          href={`/problems/${question.id}`}
          className="text-text-primary transition hover:text-accent"
        >
          <span className="block text-sm font-semibold text-text-primary">
            {title}
          </span>
          <span className="block text-xs text-text-secondary">{prompt}</span>
        </Link>
      </td>
      <td className="px-3 py-3 text-xs text-text-secondary">
        {trackLabels[question.track]}
      </td>
      <td className="px-3 py-3 text-xs text-text-secondary">
        {question.category}
      </td>
      <td className="px-3 py-3 text-xs">
        {isCompleted ? (
          <span className="rounded-full border border-success/40 bg-success/10 px-2 py-1 text-success">
            Done
          </span>
        ) : (
          <span className="text-text-secondary">-</span>
        )}
      </td>
    </tr>
  );
}
