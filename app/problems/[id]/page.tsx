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
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
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
  const [activeTab, setActiveTab] = useState<"question" | "submissions">("question");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!id) return;

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
      } catch {
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
        if (!response.ok) return;
        const payload = await response.json();
        if (isMounted) {
          setResponses(payload.responses ?? []);
        }
      } catch {
        return;
      }
    }

    loadResponses();

    return () => {
      isMounted = false;
    };
  }, [user, id]);

  useEffect(() => {
    if (!transcript) return;
    setResponseText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    clearTranscript();
  }, [transcript, clearTranscript]);

  const handleSubmit = async () => {
    if (!responseText.trim() || !question || isSubmitting) return;

    if (!user) {
      setShowModal(true);
      return;
    }

    try {
      setIsSubmitting(true);
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
    } catch {
      setError("Failed to save your response.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-md border border-error/20 bg-error/5 px-4 py-3 text-[13px] text-error">
        {error}
      </div>
    );
  }

  if (!question) {
    return null;
  }

  const tabs = [
    { id: "question" as const, label: "Problem" },
    { id: "submissions" as const, label: "History" },
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-100px)] max-w-6xl flex-col gap-0 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] lg:flex-row">
      {/* Left Column: Question Content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:max-w-[50%]">
        {/* Header with tabs and timer */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4">
          <div className="flex items-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-3 py-3 text-[13px] font-medium transition-colors duration-150",
                  activeTab === tab.id
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary" />
                )}
              </button>
            ))}
          </div>

          <Timer
            remainingSeconds={timer.remainingSeconds}
            status={timer.status}
            onStart={timer.start}
            onPause={timer.pause}
            onStop={timer.stop}
            onSetDuration={timer.setDuration}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {activeTab === "question" ? (
            <QuestionPane question={question} />
          ) : user ? (
            <SubmissionsTab responses={responses} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-[13px] text-text-secondary">
                Sign in to see your past attempts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Input Area */}
      <div className="flex flex-1 flex-col border-t border-white/[0.06] bg-white/[0.01] p-5 lg:border-l lg:border-t-0">
        {/* Response header */}
        <div className="flex items-center justify-between pb-4">
          <span className="text-[13px] font-medium text-text-secondary">Response</span>
          <SpeechToggle
            supported={isSupported}
            isListening={isListening}
            onToggle={() => (isListening ? stopListening() : startListening())}
          />
        </div>

        {/* Textarea */}
        <div className="flex-1">
          <ResponseInput
            value={responseText}
            onChange={setResponseText}
            disabled={isListening}
            isListening={isListening}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-[12px] text-text-muted">
            {responseText.length > 0 && `${responseText.split(/\s+/).filter(Boolean).length} words`}
          </span>
          <button
            disabled={!responseText.trim() || isSubmitting}
            onClick={handleSubmit}
            className={cn(
              "rounded-md px-4 py-2 text-[13px] font-medium transition-all duration-150",
              responseText.trim() && !isSubmitting
                ? "bg-text-primary text-background hover:bg-white"
                : "cursor-not-allowed bg-white/[0.06] text-text-muted"
            )}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {showModal && (
        <Modal title="Sign in to continue" onClose={() => setShowModal(false)}>
          <p className="text-[13px] text-text-secondary">
            Sign in with Google to save your response and get AI feedback.
          </p>
          <div className="mt-6 flex justify-end">
            <Button onClick={signInWithGoogle} size="sm">
              Sign in with Google
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
