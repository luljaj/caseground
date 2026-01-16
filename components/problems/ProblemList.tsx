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
      <div className="rounded-lg border border-border bg-surface/50 p-8 text-center text-sm text-text-secondary">
        No questions match these filters yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/5 bg-surface/20">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-white/5 bg-white/[0.02] text-xs font-medium text-text-secondary">
          <tr>
            <th className="px-6 py-3 w-[64px]">
              <span className="sr-only">Status</span>
            </th>
            <th className="px-6 py-3 w-[80px]">#</th>
            <th className="px-6 py-3">Question</th>
            <th className="px-6 py-3 w-[150px]">Track</th>
            <th className="px-6 py-3 w-[150px]">Category</th>
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
