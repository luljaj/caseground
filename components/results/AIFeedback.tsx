"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

export default function AIFeedback({
  responseId,
  initialCredits,
  initialFeedback,
  isSubscriber = false,
}: {
  responseId: string;
  initialCredits: number;
  initialFeedback?: string | null;
  isSubscriber?: boolean;
}) {
  const [credits, setCredits] = useState(initialCredits);
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => (prev && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setRetryAfter(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response_id: responseId }),
      });

      const payload = await response.json();

      if (response.status === 429) {
        setRetryAfter(payload.retry_after || 15);
        setError("Please wait before generating more feedback.");
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to get feedback.");
      }

      setFeedback(payload.feedback ?? "");
      if (payload.creditsRemaining !== null && payload.creditsRemaining !== undefined) {
        setCredits(payload.creditsRemaining);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const showRetry = Boolean(error) && !feedback;

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Violet gradient border for emphasis */}
      <div className={cn(
        "absolute inset-0 rounded-xl transition-all duration-300",
        feedback
          ? "bg-gradient-to-br from-violet-500/40 via-blue-500/20 to-violet-600/40"
          : "bg-gradient-to-br from-violet-500/25 via-zinc-700/15 to-violet-600/25"
      )} />
      <div className="absolute inset-[1px] bg-gradient-to-br from-zinc-900/98 via-[#0d0d12] to-zinc-950/98 rounded-xl" />

      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-100">AI Feedback</h3>
            {feedback && (
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                Generated
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">
            {isSubscriber ? "Unlimited plan" : `${credits} credits left`}
          </span>
        </div>

        <div className="mt-4 text-[15px] leading-relaxed">
          {feedback ? (
            <div className="prose prose-sm prose-invert prose-zinc max-w-none text-zinc-200">
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          ) : (
            <p className="italic text-zinc-500">
              Generate targeted feedback based on the rubric to improve your answer.
            </p>
          )}
        </div>

        {error && (
          <p className="mt-3 text-xs text-error bg-error/10 p-2 rounded-lg">{error}</p>
        )}

        {(!feedback || showRetry) && (
          <div className="mt-5">
            {credits <= 0 && !isSubscriber ? (
              <Link
                href="/pricing"
                className="text-sm font-medium text-violet-400 underline"
              >
                Get Credits
              </Link>
            ) : (
              <Button
                size="sm"
                onClick={handleFetch}
                disabled={loading || retryAfter !== null}
                variant="primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size={14} /> Generating...
                  </span>
                ) : retryAfter !== null ? (
                  `Wait ${retryAfter}s`
                ) : showRetry ? (
                  "Retry feedback"
                ) : (
                  "Generate Feedback"
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
