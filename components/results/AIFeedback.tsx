"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

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
    <div className="rounded-md border border-border/80 bg-background/30 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">AI Feedback</h3>
        <span className="text-xs text-text-secondary">
          {credits} credits left
        </span>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-text-secondary">
        {feedback ? (
          <p>{feedback}</p>
        ) : (
          <p>Generate targeted feedback based on the rubric.</p>
        )}
      </div>
      {error ? (
        <p className="mt-3 text-xs text-error">{error}</p>
      ) : null}
      <div className="mt-4">
        <Button
          size="sm"
          onClick={handleFetch}
          disabled={loading || credits <= 0}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner size={14} /> Loading
            </span>
          ) : credits <= 0 ? (
            "No credits remaining"
          ) : feedback ? (
            "Refresh feedback"
          ) : showRetry ? (
            `Retry feedback (${credits} credits left)`
          ) : (
            `Get AI Feedback (${credits} credits left)`
          )}
        </Button>
      </div>
    </div>
  );
}
