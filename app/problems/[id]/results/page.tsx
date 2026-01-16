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
      <div className="flex justify-center py-12">
        <Spinner size={28} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-md border border-border/80 bg-surface/40 p-6 text-sm text-text-secondary">
        Sign in to view your results.
      </div>
    );
  }

  if (!question || !response || credits === null) {
    return (
      <div className="rounded-md border border-border/80 bg-surface/40 p-6 text-sm text-text-secondary">
        No results found for this attempt yet.
      </div>
    );
  }

  const rubricItems = Array.isArray(question.rubric) ? question.rubric : [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="rounded-md border border-border/80 bg-surface/40 p-6">
        <h1 className="text-2xl font-semibold text-text-primary">Your Response</h1>
        <p className="mt-3 text-sm text-text-secondary">{response.response}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-border/80 bg-surface/40 p-6">
          <h2 className="text-lg font-semibold text-text-primary">Rubric</h2>
          <div className="mt-4">
            <RubricChecklist items={rubricItems} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <ExampleAnswer answer={question.example_answer} />
          <AIFeedback
            responseId={response.id}
            initialCredits={credits}
            initialFeedback={response.ai_feedback}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/problems/${question.id}`}>
          <Button size="sm" variant="secondary">
            Try Again
          </Button>
        </Link>
        <Link href="/problems" className="text-sm text-text-secondary">
          Back to Problems
        </Link>
      </div>
    </div>
  );
}
