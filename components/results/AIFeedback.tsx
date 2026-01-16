"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

export default function AIFeedback({
  responseId,
  initialCredits,
  initialFeedback,
}: {
  responseId: string;
  initialCredits: number;
  initialFeedback?: string | null;
}) {
  const [credits, setCredits] = useState(initialCredits);
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response_id: responseId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to get feedback.");
      }

      setFeedback(payload.feedback ?? "");
      setCredits(payload.creditsRemaining ?? credits - 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const showRetry = Boolean(error) && !feedback;

  return (
    <div className={cn(
        "rounded-lg border p-5 transition-all",
        feedback 
            ? "border-accent/20 bg-accent/5" 
            : "border-white/5 bg-surface/30"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">AI Feedback</h3>
            {feedback && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">Generated</span>}
        </div>
        <span className="text-xs text-text-secondary">
          {credits} credits left
        </span>
      </div>
      
      <div className="mt-4 text-[15px] leading-relaxed text-text-secondary">
        {feedback ? (
          <p className="text-text-primary">{feedback}</p>
        ) : (
          <p className="italic text-text-secondary/60">Generate targeted feedback based on the rubric to improve your answer.</p>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-xs text-error bg-error/10 p-2 rounded">{error}</p>
      ) : null}

      {!feedback || showRetry ? (
        <div className="mt-5">
            <Button
            size="sm"
            onClick={handleFetch}
            disabled={loading || credits <= 0}
            className="w-full sm:w-auto"
            variant="primary"
            >
            {loading ? (
                <span className="flex items-center gap-2">
                <Spinner size={14} /> Generating...
                </span>
            ) : credits <= 0 ? (
                "No credits remaining"
            ) : showRetry ? (
                "Retry feedback"
            ) : (
                "Generate Feedback"
            )}
            </Button>
        </div>
      ) : null}
    </div>
  );
}
