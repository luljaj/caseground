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
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-error/20 bg-error/5 p-4 text-sm text-error">
        {error}
      </div>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-100px)] max-w-[1400px] flex-col gap-6 px-4 pb-6 md:flex-row md:px-8">
      {/* Left Column: Question Content */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 md:max-w-[50%]">
        <div className="flex items-center gap-6 border-b border-white/5 pb-2">
            <div className="flex gap-4">
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${
                    activeTab === "question"
                        ? "border-b border-accent text-text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    onClick={() => setActiveTab("question")}
                >
                    Problem
                </button>
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${
                    activeTab === "submissions"
                        ? "border-b border-accent text-text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    onClick={() => setActiveTab("submissions")}
                >
                    History
                </button>
            </div>
            
             <div className="ml-auto flex items-center">
                <Timer
                    remainingSeconds={timer.remainingSeconds}
                    status={timer.status}
                    onStart={timer.start}
                    onPause={timer.pause}
                    onStop={timer.stop}
                    onSetDuration={timer.setDuration}
                />
            </div>
        </div>

        <div className="flex-1">
          {activeTab === "question" ? (
            <QuestionPane question={question} />
          ) : user ? (
            <SubmissionsTab responses={responses} />
          ) : (
            <div className="rounded-lg border border-white/5 bg-surface/30 p-8 text-center text-sm text-text-secondary">
              Sign in to see your past attempts.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Input Area */}
      <div className="flex flex-1 flex-col gap-4 border-t border-white/5 pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <div className="flex items-center justify-between">
             <span className="text-sm font-medium text-text-secondary">Your Response</span>
             <div className="flex items-center gap-3">
                <SpeechToggle
                    supported={isSupported}
                    isListening={isListening}
                    onToggle={() =>
                        isListening ? stopListening() : startListening()
                    }
                />
                <span className="text-xs text-text-secondary">
                    {isListening ? "Listening..." : "Dictate"}
                </span>
             </div>
        </div>
        
        <ResponseInput
            value={responseText}
            onChange={setResponseText}
            disabled={isListening}
            isListening={isListening}
        />

        <div className="mt-auto flex justify-end pt-4">
          <SubmitButton disabled={!responseText.trim()} onClick={handleSubmit} />
        </div>
      </div>

      {showModal ? (
        <Modal
          title="Sign in to save progress"
          onClose={() => setShowModal(false)}
        >
          <p className="text-sm text-text-secondary">
            Sign in with Google to save your response and unlock AI feedback.
          </p>
          <div className="mt-6 flex justify-end">
            <Button onClick={signInWithGoogle} size="sm">
              Sign in with Google
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
