import type { Question } from "@/types";

const trackLabels: Record<Question["track"], string> = {
  estimations: "Estimations",
  behaviorals: "Behaviorals",
  reasoning: "Reasoning",
};

const trackPillStyles: Record<Question["track"], string> = {
  estimations: "border-[#21314b] bg-[#121e31] text-[#a8b8d6]",
  behaviorals: "border-[#20362c] bg-[#12231c] text-[#a7cdb8]",
  reasoning: "border-[#2c2342] bg-[#1b1528] text-[#c0b2dd]",
};

export default function QuestionPane({ question }: { question: Question }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-text-secondary">
        <span
          className={`rounded-md border px-3 py-1 ${trackPillStyles[question.track]}`}
        >
          {trackLabels[question.track]}
        </span>
        <span className="rounded-md border border-border/80 bg-surface/50 px-3 py-1">
          {question.category}
        </span>
        <span className="rounded-md border border-border/80 bg-surface/50 px-3 py-1">
          {question.suggested_time} min suggested
        </span>
      </div>
      <div className="rounded-md border border-border/80 bg-background/30 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
          Question
        </p>
        <h2 className="mt-2 text-lg font-semibold text-text-primary">
          {question.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {question.prompt}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {question.description}
        </p>
      </div>
      {question.companies?.length ? (
        <div className="rounded-md border border-border/80 bg-background/30 p-4 text-xs text-text-secondary">
          Common companies: {question.companies.join(", ")}
        </div>
      ) : null}
    </div>
  );
}
