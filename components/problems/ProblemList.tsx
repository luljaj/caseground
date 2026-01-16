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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 rounded-full bg-white/[0.03] p-3">
          <svg
            className="h-5 w-5 text-text-muted"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M17.5 17.5L13.875 13.875M15.833 9.167a6.667 6.667 0 1 1-13.333 0 6.667 6.667 0 0 1 13.333 0Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-[13px] text-text-secondary">
          No questions match your filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.06]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            <th className="w-12 px-4 py-3">
              <span className="sr-only">Status</span>
            </th>
            <th className="w-16 px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              #
            </th>
            <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Question
            </th>
            <th className="hidden w-32 px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted md:table-cell">
              Track
            </th>
            <th className="hidden w-40 px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted lg:table-cell">
              Category
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
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
