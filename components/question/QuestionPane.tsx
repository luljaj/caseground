import type { Question } from "@/types";

const trackLabels: Record<Question["track"], string> = {
  estimations: "Estimations",
  behaviorals: "Behaviorals",
  reasoning: "Reasoning",
};

export default function QuestionPane({ question }: { question: Question }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        <span className="rounded-full border border-border bg-border/40 px-3 py-1">
          {trackLabels[question.track]}
        </span>
        <span className="rounded-full border border-border bg-border/40 px-3 py-1">
          {question.category}
        </span>
        <span className="rounded-full border border-border bg-border/40 px-3 py-1">
          {question.suggested_time} min suggested
        </span>
      </div>
      <div className="rounded-2xl border border-border bg-background/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">
          Question
        </p>
        <h2 className="mt-2 text-lg font-semibold text-text-primary">
          {question.title}
        </h2>
        <p className="mt-3 text-sm text-text-secondary">{question.prompt}</p>
        <p className="mt-3 text-sm text-text-secondary">
          {question.description}
        </p>
      </div>
      {question.companies?.length ? (
        <div className="rounded-2xl border border-border bg-background/40 p-4 text-xs text-text-secondary">
          Common companies: {question.companies.join(", ")}
        </div>
      ) : null}
    </div>
  );
}
