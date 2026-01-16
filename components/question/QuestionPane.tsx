import type { Question } from "@/types";

const trackLabels: Record<Question["track"], string> = {
  estimations: "Estimations",
  behaviorals: "Behaviorals",
  reasoning: "Reasoning",
};

export default function QuestionPane({ question }: { question: Question }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-text-secondary">
          {trackLabels[question.track]}
        </span>
        <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-text-secondary">
          {question.category}
        </span>
        <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-text-secondary">
          {question.suggested_time} min suggested
        </span>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">
          {question.title}
        </h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-text-secondary">
          <p>{question.prompt}</p>
          {question.description && (
             <p className="text-text-secondary/80">{question.description}</p>
          )}
        </div>
      </div>

      {question.companies?.length ? (
        <div className="mt-auto border-t border-white/5 pt-4">
           <p className="text-xs text-text-secondary/60">
            Seen at: <span className="text-text-secondary">{question.companies.join(", ")}</span>
           </p>
        </div>
      ) : null}
    </div>
  );
}
