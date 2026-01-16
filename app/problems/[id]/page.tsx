"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTimer } from "@/lib/hooks/useTimer";
import { useSpeechToText } from "@/lib/hooks/useSpeechToText";
import QuestionPane from "@/components/question/QuestionPane";
import SubmissionsTab from "@/components/question/SubmissionsTab";
import ResponseInput from "@/components/question/ResponseInput";
import SpeechToggle from "@/components/question/SpeechToggle";
import Timer from "@/components/question/Timer";
import SubmitButton from "@/components/question/SubmitButton";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import type { Question, UserResponse } from "@/types";

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const id = params?.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [responseText, setResponseText] = useState("");
  const [activeTab, setActiveTab] = useState<"question" | "submissions">(
    "question"
  );
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timer = useTimer(question ? question.suggested_time * 60 : 300);
  const {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechToText();

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;

    async function loadQuestion() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/questions/${id}`, { cache: "no-store" });
        if (!response.ok) {
          setError("Question not found.");
          setLoading(false);
          return;
        }
        const payload = await response.json();
        if (isMounted) {
          setQuestion(payload.question ?? null);
          setLoading(false);
        }
      } catch (_error) {
        if (isMounted) {
          setError("Unable to load this question.");
          setLoading(false);
        }
      }
    }

    loadQuestion();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setResponses([]);
      return;
    }

    let isMounted = true;

    async function loadResponses() {
      try {
        const response = await fetch(`/api/responses?question_id=${id}`);
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        if (isMounted) {
          setResponses(payload.responses ?? []);
        }
      } catch (_error) {
        return;
      }
    }

    loadResponses();

    return () => {
      isMounted = false;
    };
  }, [user, id]);

  useEffect(() => {
    if (!transcript) {
      return;
    }
    setResponseText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    clearTranscript();
  }, [transcript, clearTranscript]);

  const handleSubmit = async () => {
    if (!responseText.trim() || !question) {
      return;
    }

    if (!user) {
      setShowModal(true);
      return;
    }

    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.id,
          response: responseText,
          time_taken: timer.timeTaken,
        }),
      });

      if (!response.ok) {
        setError("Failed to save your response.");
        return;
      }

      const payload = await response.json();
      router.push(`/problems/${question.id}/results?response_id=${payload.id}`);
    } catch (_error) {
      setError("Failed to save your response.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-error/40 bg-error/10 p-4 text-sm text-error">
        {error}
      </div>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex justify-center">
        <Timer
          remainingSeconds={timer.remainingSeconds}
          status={timer.status}
          onStart={timer.start}
          onPause={timer.pause}
          onStop={timer.stop}
          onSetDuration={timer.setDuration}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-md border border-border/80 bg-surface/40 p-6">
          <div className="flex items-center gap-2 border-b border-border/60 pb-4 text-sm">
            <button
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                activeTab === "question"
                  ? "bg-accent/15 text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setActiveTab("question")}
            >
              Question
            </button>
            <button
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                activeTab === "submissions"
                  ? "bg-accent/15 text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setActiveTab("submissions")}
            >
              Submissions
            </button>
          </div>
          <div className="mt-6">
            {activeTab === "question" ? (
              <QuestionPane question={question} />
            ) : user ? (
              <SubmissionsTab responses={responses} />
            ) : (
              <div className="text-sm text-text-secondary">
                Sign in to see your submissions.
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-md border border-border/80 bg-surface/40 p-6">
          <ResponseInput
            value={responseText}
            onChange={setResponseText}
            disabled={isListening}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SpeechToggle
              supported={isSupported}
              isListening={isListening}
              onToggle={() =>
                isListening ? stopListening() : startListening()
              }
            />
            <span className="text-[13px] text-text-secondary">
              {isListening
                ? "Listening... typing disabled"
                : "Type or use the mic"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton disabled={!responseText.trim()} onClick={handleSubmit} />
      </div>
      {showModal ? (
        <Modal
          title="Sign in to save progress"
          onClose={() => setShowModal(false)}
        >
          <p className="text-sm text-text-secondary">
            Sign in with Google to save your response and unlock AI feedback.
          </p>
          <div className="mt-4">
            <Button onClick={signInWithGoogle} size="sm">
              Sign in with Google
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
