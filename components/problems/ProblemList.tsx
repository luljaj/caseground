import type { Question } from "@/types";
import ProblemRow from "./ProblemRow";

export default function ProblemList({
  questions,
  completedIds,
}: {
  questions: Question[];
  completedIds: Set<string>;
}) {
  if (questions.length === 0) {
    return (
      <div className="rounded-md border border-border/80 bg-surface/40 p-6 text-center text-sm text-text-secondary">
        No questions match these filters yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border/80 bg-surface/20">
      <table className="w-full border-collapse text-left text-sm leading-tight">
        <thead className="border-b border-border/60 bg-surface/50 text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
          <tr>
            <th className="px-6 py-3">#</th>
            <th className="px-6 py-3">Question</th>
            <th className="px-6 py-3">Track</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question) => (
            <ProblemRow
              key={question.id}
              question={question}
              isCompleted={completedIds.has(question.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
