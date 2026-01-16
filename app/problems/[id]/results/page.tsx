"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import RubricChecklist from "@/components/results/RubricChecklist";
import ExampleAnswer from "@/components/results/ExampleAnswer";
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

  useEffect(() => {
    if (!id) {
      return;
    }

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

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setResponse(null);
      return;
    }

    let isMounted = true;

    async function loadResponses() {
      const result = await fetch(`/api/responses?question_id=${id}`);
      if (!result.ok) {
        return;
      }
      const payload = await result.json();
      const responses: UserResponse[] = payload.responses ?? [];
      const match = responseId
        ? responses.find((entry) => entry.id === responseId)
        : responses[0];
      if (isMounted) {
        setResponse(match ?? null);
      }
    }

    loadResponses();

    return () => {
      isMounted = false;
    };
  }, [user, id, responseId]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    async function loadUser() {
      const result = await fetch("/api/user", { cache: "no-store" });
      if (!result.ok) {
        return;
      }
      const payload = await result.json();
      if (isMounted) {
        setCredits(payload.user?.ai_credits ?? 0);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-white/5 bg-surface/30 p-8 text-center text-sm text-text-secondary">
        Sign in to view your results.
      </div>
    );
  }

  if (!question || !response || credits === null) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-white/5 bg-surface/30 p-8 text-center text-sm text-text-secondary">
        No results found for this attempt yet.
      </div>
    );
  }

  const rubricItems = Array.isArray(question.rubric) ? question.rubric : [];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-semibold text-text-primary">Results</h1>
            <p className="text-sm text-text-secondary">Review your performance and get feedback.</p>
        </div>
        <div className="flex gap-3">
            <Link href={`/problems/${question.id}`}>
            <Button size="sm" variant="secondary">
                Try Again
            </Button>
            </Link>
            <Link href="/problems">
            <Button size="sm" variant="ghost">
                Back to Problems
            </Button>
            </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-8">
            <div className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                    Your Response
                </h3>
                <div className="rounded-lg border border-white/5 bg-surface/30 p-6 min-h-[200px]">
                    <p className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap font-sans">
                        {response.response}
                    </p>
                </div>
            </div>
            
            <div className="space-y-3">
                 <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
                    Rubric
                </h3>
                <RubricChecklist items={rubricItems} />
            </div>
        </div>

        <div className="flex flex-col gap-6">
          <AIFeedback
            responseId={response.id}
            initialCredits={credits}
            initialFeedback={response.ai_feedback}
          />
          <ExampleAnswer answer={question.example_answer} />
        </div>
      </div>
    </div>
  );
}
