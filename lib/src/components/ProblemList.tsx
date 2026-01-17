import type { Question } from "../types";
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
      <div className="relative overflow-hidden rounded-[24px]" style={{ backgroundImage: "linear-gradient(163.348deg, rgb(24, 24, 27) 0%, rgb(24, 24, 27) 50%, rgb(39, 39, 42) 100%)" }}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-zinc-800 p-4">
            <svg
              className="h-6 w-6 text-[#9F9FA9]"
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
          <p className="text-[15px] text-[#9F9FA9]">
            No questions match your filters
          </p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#27272a] border-solid inset-0 pointer-events-none rounded-[24px]" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[24px]" style={{ backgroundImage: "linear-gradient(163.348deg, rgb(24, 24, 27) 0%, rgb(24, 24, 27) 50%, rgb(39, 39, 42) 100%)" }}>
      <table className="w-full border-collapse text-left">
        <thead className="bg-zinc-800/40">
          <tr className="border-b border-[#27272a]">
            <th className="w-12 px-4 py-5 sm:w-16 sm:px-8">
              <span className="sr-only">Status</span>
            </th>
            <th className="w-12 px-2 py-5 text-[11px] uppercase tracking-wider text-[#9F9FA9] sm:w-20 sm:px-8">
              #
            </th>
            <th className="px-2 py-5 text-[11px] uppercase tracking-wider text-[#9F9FA9] sm:px-8">
              Question
            </th>
            <th className="hidden w-24 px-2 py-5 text-[11px] uppercase tracking-wider text-[#9F9FA9] sm:table-cell sm:w-36 sm:px-8">
              Track
            </th>
            <th className="hidden w-64 px-8 py-5 text-[11px] uppercase tracking-wider text-[#9F9FA9] lg:table-cell">
              Category
            </th>
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
      <div aria-hidden="true" className="absolute border border-[#27272a] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}