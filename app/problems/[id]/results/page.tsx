"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import RubricChecklist from "@/components/results/RubricChecklist";
import AIFeedback from "@/components/results/AIFeedback";
import type { Question, UserResponse } from "@/types";

export default function ResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const id = params?.id as string;
  const responseId = searchParams.get("response_id");

  const [question, setQuestion] = useState<Question | null>(null);
  const [response, setResponse] = useState<UserResponse | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedCount, setCheckedCount] = useState(0);
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadQuestion() {
      const result = await fetch(`/api/questions/${id}`, { cache: "no-store" });
      if (!result.ok) {
        setLoading(false);
        return;
      }
      const payload = await result.json();
      if (isMounted) {
        setQuestion(payload.question ?? null);
        setLoading(false);
      }
    }

    loadQuestion();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setResponse(null);
      return;
    }
    let isMounted = true;

    async function loadResponses() {
      const result = await fetch(`/api/responses?question_id=${id}`);
      if (!result.ok) return;
      const payload = await result.json();
      const responses: UserResponse[] = payload.responses ?? [];
      const match = responseId
        ? responses.find((entry) => entry.id === responseId)
        : responses[0];
      if (isMounted) setResponse(match ?? null);
    }

    loadResponses();
    return () => { isMounted = false; };
  }, [user, id, responseId]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadUser() {
      const result = await fetch("/api/user", { cache: "no-store" });
      if (!result.ok) return;
      const payload = await result.json();
      if (isMounted) setCredits(payload.user?.ai_credits ?? 0);
    }

    loadUser();
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function checkSubscription() {
      const res = await fetch("/api/stats");
      if (!res.ok) return;
      const data = await res.json();
      if (isMounted) {
        setIsSubscriber(
          ["active", "trialing", "past_due"].includes(
            data.subscription?.status
          )
        );
      }
    }

    checkSubscription();
    return () => { isMounted = false; };
  }, [user]);

  const handleCheckedChange = useCallback((count: number) => {
    setCheckedCount(count);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-white/5 bg-surface/30 p-8 text-center text-sm text-text-secondary">
        Sign in to view your results.
      </div>
    );
  }

  if (!question || !response || credits === null) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-white/5 bg-surface/30 p-8 text-center text-sm text-text-secondary">
        No results found for this attempt yet.
      </div>
    );
  }

  const rubricItems = Array.isArray(question.rubric) ? question.rubric : [];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 pb-12">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold text-text-primary">Results</h1>
        <p className="text-sm text-text-secondary mt-1">Review your performance and get feedback.</p>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid gap-6 lg:grid-cols-2 animate-fade-up-1">
        {/* Your Response */}
        <div className="relative rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-600/30 via-zinc-700/15 to-zinc-800/30 rounded-xl" />
          <div className="absolute inset-[1px] bg-gradient-to-br from-zinc-900/95 via-[#0f0f11] to-zinc-950/95 rounded-xl" />
          <div className="relative p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
              Your Response
            </h3>
            <div className="prose prose-sm prose-invert prose-zinc max-w-none text-[15px] leading-relaxed text-zinc-200">
              <ReactMarkdown>{response.response}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Example Answer */}
        <div className="relative rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-600/30 via-zinc-700/15 to-zinc-800/30 rounded-xl" />
          <div className="absolute inset-[1px] bg-gradient-to-br from-zinc-900/95 via-[#0f0f11] to-zinc-950/95 rounded-xl" />
          <div className="relative p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
              Example Answer
            </h3>
            <div className="prose prose-sm prose-invert prose-zinc max-w-none text-[15px] leading-relaxed text-zinc-400">
              <ReactMarkdown>{question.example_answer}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* AI Feedback (emphasized) */}
      <div className="animate-fade-up-2">
        <AIFeedback
          responseId={response.id}
          initialCredits={credits}
          initialFeedback={response.ai_feedback}
          isSubscriber={isSubscriber}
        />
      </div>

      {/* Rubric */}
      <div className="animate-fade-up-3">
        <RubricChecklist items={rubricItems} onCheckedChange={handleCheckedChange} />
      </div>
    </div>
  );
}
