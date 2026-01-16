import type { Question } from "@/types";

type Track = Question["track"];

type MockProblem = {
  id: string;
  number: number;
  title: string;
  track: Track;
  category: string;
  completed: boolean;
};

const trackConfig: Record<Track, { label: string; color: string }> = {
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

const mockProblems: MockProblem[] = [
  {
    id: "p1",
    number: 12,
    title: "Market size of coffee shops in NYC",
    track: "estimations",
    category: "market-sizing",
    completed: true,
  },
  {
    id: "p2",
    number: 7,
    title: "Tell me about a time you led a team",
    track: "behaviorals",
    category: "medium",
    completed: false,
  },
  {
    id: "p3",
    number: 3,
    title: "How many tennis balls fit in a school bus?",
    track: "reasoning",
    category: "logic",
    completed: true,
  },
  {
    id: "p4",
    number: 21,
    title: "Cutting costs without layoffs",
    track: "behaviorals",
    category: "hard",
    completed: true,
  },
  {
    id: "p5",
    number: 18,
    title: "Estimate annual rideshare trips in LA",
    track: "estimations",
    category: "volume",
    completed: false,
  },
];

export default function ProblemListPreview() {
  return (
    <div className="relative w-full max-w-xl opacity-40 lg:opacity-100 lg:[transform:perspective(1200px)_rotateY(-12deg)_rotateX(3deg)_scale(0.92)] lg:[transform-origin:left_center]">
      <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent opacity-70 blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-surface/40 backdrop-blur-sm shadow-[0_30px_60px_-45px_rgba(0,0,0,0.8)]">
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
            {mockProblems.map((problem, index) => {
              const track = trackConfig[problem.track];
              const rowVisibility =
                index > 2 ? "hidden md:table-row" : "";

              return (
                <tr
                  key={problem.id}
                  className={`group transition-colors duration-150 hover:bg-white/[0.02] ${rowVisibility}`}
                >
                  <td className="px-4 pb-2.5 pt-3.5 align-middle">
                    {problem.completed ? (
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

                  <td className="px-4 pb-3.5 pt-2.5 align-middle">
                    <span className="font-mono text-[12px] text-text-muted">
                      {problem.number}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span className="block text-[13px] font-medium text-text-primary">
                      {problem.title}
                    </span>
                  </td>

                  <td className="hidden px-4 py-3 align-middle md:table-cell">
                    <span className={`text-[12px] ${track.color}`}>
                      {track.label}
                    </span>
                  </td>

                  <td className="hidden px-4 py-3 align-middle lg:table-cell">
                    <span className="text-[12px] text-text-muted">
                      {problem.category}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
