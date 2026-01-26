"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import AIFeedback from "@/components/results/AIFeedback";

type CompletionProblem = {
  id: string;
  title: string;
  example_answer?: string | null;
};

type CompletionResponse = {
  id: string;
  question_id: string;
  response: string;
  ai_feedback?: string | null;
};

export default function CompletionResultsTabs({
  problems,
  responses,
  initialProblemId,
  credits,
  isSubscriber,
}: {
  problems: CompletionProblem[];
  responses: CompletionResponse[];
  initialProblemId?: string | null;
  credits: number;
  isSubscriber: boolean;
}) {
  const [activeId, setActiveId] = useState<string>(() => {
    if (initialProblemId && problems.some((problem) => problem.id === initialProblemId)) {
      return initialProblemId;
    }
    return problems[0]?.id ?? "";
  });

  useEffect(() => {
    if (problems.length === 0) {
      return;
    }
    if (!activeId || !problems.some((problem) => problem.id === activeId)) {
      const fallback =
        initialProblemId && problems.some((problem) => problem.id === initialProblemId)
          ? initialProblemId
          : problems[0]?.id ?? "";
      if (fallback) {
        setActiveId(fallback);
      }
    }
  }, [problems, initialProblemId, activeId]);

  const activeProblem = problems.find((problem) => problem.id === activeId) ?? null;
  const responsesByQuestion = useMemo(() => {
    const map = new Map<string, CompletionResponse>();
    responses.forEach((response) => {
      if (!map.has(response.question_id)) {
        map.set(response.question_id, response);
      }
    });
    return map;
  }, [responses]);

  const activeResponse = activeProblem
    ? responsesByQuestion.get(activeProblem.id) ?? null
    : null;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {problems.map((problem, index) => {
            const isActive = problem.id === activeId;
            return (
              <button
                key={problem.id}
                type="button"
                onClick={() => setActiveId(problem.id)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-text-secondary hover:text-text-primary"
                }`}
              >
                Problem {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {activeProblem ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {activeProblem.title}
            </h3>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-surface/40 p-5">
              <h4 className="text-xs font-medium uppercase tracking-wider text-text-secondary/70">
                Your Response
              </h4>
              <div className="mt-3 text-sm text-text-secondary">
                {activeResponse ? (
                  <div className="prose prose-sm prose-invert max-w-none text-text-primary">
                    <ReactMarkdown>{activeResponse.response}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="italic text-text-muted">No response recorded.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-surface/40 p-5">
              <h4 className="text-xs font-medium uppercase tracking-wider text-text-secondary/70">
                Example Answer
              </h4>
              <div className="mt-3 text-sm text-text-secondary">
                {activeProblem.example_answer ? (
                  <div className="prose prose-sm prose-invert max-w-none text-text-muted">
                    <ReactMarkdown>{activeProblem.example_answer}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="italic text-text-muted">No example answer available.</p>
                )}
              </div>
            </div>
          </div>

          {activeResponse ? (
            <AIFeedback
              responseId={activeResponse.id}
              initialCredits={credits}
              initialFeedback={activeResponse.ai_feedback ?? null}
              isSubscriber={isSubscriber}
            />
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">No problems to display.</p>
      )}
    </div>
  );
}
