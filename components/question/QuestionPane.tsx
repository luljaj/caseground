import type { Question } from "@/types";

const trackConfig: Record<Question["track"], { label: string; color: string }> = {
  estimations: { label: "Estimations", color: "text-blue-400/70" },
  behaviorals: { label: "Behaviorals", color: "text-violet-400/70" },
  reasoning: { label: "Reasoning", color: "text-amber-400/70" },
};

export default function QuestionPane({ question }: { question: Question }) {
  const track = trackConfig[question.track];

  return (
    <div className="flex flex-col gap-8">
      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-[12px]">
        <span className={track.color}>{track.label}</span>
        <span className="text-text-muted">·</span>
        <span className="text-text-muted">{question.category}</span>
        <span className="text-text-muted">·</span>
        <span className="text-text-muted">{question.suggested_time} min</span>
      </div>

      {/* Title & Prompt */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          {question.title}
        </h1>
        <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-text-secondary">
          <p>{question.prompt}</p>
          {question.description && (
            <p className="text-text-muted">{question.description}</p>
          )}
        </div>
      </div>

      {/* Companies */}
      {question.companies?.length ? (
        <div className="border-t border-white/[0.06] pt-6">
          <p className="text-[12px] text-text-muted">
            Seen at{" "}
            <span className="text-text-secondary">
              {question.companies.join(", ")}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
