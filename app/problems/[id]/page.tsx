"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTimer } from "@/lib/hooks/useTimer";
import { useSpeechToText } from "@/lib/hooks/useSpeechToText";
import { useQueue } from "@/lib/hooks/useQueue";
import { useSettings } from "@/lib/hooks/useSettings";
import ProblemCard from "@/components/question/ProblemCard";
import ResponseInput from "@/components/question/ResponseInput";
import SpeechToggle from "@/components/question/SpeechToggle";
import TimerPill from "@/components/question/TimerPill";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import type { Question, UserResponse } from "@/types";

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const { settings } = useSettings();
  const {
    state: queueState,
    currentProblemId,
    addProblem,
    markCompleted,
    advanceQueue,
    setActiveTimerSeconds,
  } = useQueue();
  const id = params?.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [responseText, setResponseText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueNotice, setQueueNotice] = useState<string | null>(null);
  const queueNoticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechAutoStartRef = useRef<string | null>(null);

  const playTimerSound = useCallback(() => {
    if (!settings.timerSound) {
      return;
    }
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.15;
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.4);
      oscillator.onended = () => {
        context.close();
      };
    } catch {
      // Ignore audio errors to avoid blocking UI.
    }
  }, [settings.timerSound]);

  const timer = useTimer(question ? question.suggested_time * 60 : 300, {
    onFinish: playTimerSound,
  });
  const {
    status: timerStatus,
    start: startTimer,
    remainingSeconds: remainingTimerSeconds,
  } = timer;
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

  const questionId = question?.id ?? null;

  useEffect(() => {
    if (!questionId) {
      return;
    }
    if (!settings.autoStartTimer) {
      return;
    }
    if (timerStatus === "idle") {
      startTimer();
    }
  }, [questionId, settings.autoStartTimer, timerStatus, startTimer]);

  useEffect(() => {
    if (!questionId) {
      return;
    }
    if (!settings.speechToTextReady || !isSupported) {
      return;
    }
    if (speechAutoStartRef.current === questionId) {
      return;
    }
    speechAutoStartRef.current = questionId;
    startListening();
  }, [questionId, settings.speechToTextReady, isSupported, startListening]);

  // Stop listening when speech setting is disabled (only check on setting change, not isListening)
  const prevSpeechReadyRef = useRef(settings.speechToTextReady);
  useEffect(() => {
    if (prevSpeechReadyRef.current && !settings.speechToTextReady) {
      // Setting was just turned off
      stopListening();
    }
    prevSpeechReadyRef.current = settings.speechToTextReady;
  }, [settings.speechToTextReady, stopListening]);

  useEffect(() => {
    if (!queueState.isPlaying || !questionId || currentProblemId !== questionId) {
      setActiveTimerSeconds(null);
      return;
    }
    setActiveTimerSeconds(remainingTimerSeconds);
  }, [
    queueState.isPlaying,
    currentProblemId,
    questionId,
    remainingTimerSeconds,
    setActiveTimerSeconds,
  ]);

  useEffect(() => {
    return () => {
      setActiveTimerSeconds(null);
      if (queueNoticeTimeout.current) {
        clearTimeout(queueNoticeTimeout.current);
      }
    };
  }, [setActiveTimerSeconds]);

  const showQueueNotice = (message: string) => {
    setQueueNotice(message);
    if (queueNoticeTimeout.current) {
      clearTimeout(queueNoticeTimeout.current);
    }
    queueNoticeTimeout.current = setTimeout(() => {
      setQueueNotice(null);
    }, 2500);
  };

  const handleAddToQueue = () => {
    if (!question) {
      return;
    }
    if (queueState.problemIds.includes(question.id)) {
      showQueueNotice("Already in your queue.");
      return;
    }
    addProblem(question.id, {
      title: question.title,
      track: question.track,
      category: question.category,
      suggestedTime: question.suggested_time,
      number: question.number,
    });
    showQueueNotice("Added to queue.");
  };

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

      const isQueueActive =
        queueState.isPlaying && currentProblemId === question.id;

      if (isQueueActive) {
        markCompleted(question.id, payload.id);
        if (settings.showResultsBetween) {
          router.push(`/problems/${question.id}/results?response_id=${payload.id}`);
          return;
        }
        const nextId = queueState.problemIds[queueState.currentIndex + 1];
        advanceQueue();
        if (nextId) {
          router.push(`/problems/${nextId}`);
        }
        return;
      }

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

  return (
    <div className="mx-auto flex h-[80vh] max-w-6xl flex-col gap-0 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] lg:flex-row">
      {/* Left Column: Question Content */}
      <div className="flex flex-1 flex-col overflow-hidden p-5 lg:max-w-[50%]">
        <ProblemCard
          question={question}
          responses={responses}
          canViewHistory={Boolean(user)}
          timer={timer}
        />
      </div>

      {/* Right Column: Input Area */}
      <div className="flex flex-1 flex-col border-t border-white/[0.06] bg-white/[0.01] p-5 lg:border-l lg:border-t-0">
        {/* Response header */}
        <div className="flex items-center justify-between pb-4">
          <span className="text-[13px] font-medium text-text-secondary">Response</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleAddToQueue}>
              Add to Queue
            </Button>
            <SpeechToggle
              supported={isSupported}
              isListening={isListening}
              onToggle={() => (isListening ? stopListening() : startListening())}
            />
          </div>
        </div>

        {/* Dictate mode indicator */}
        {isListening && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5">
            <div className="relative flex items-center justify-center">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-accent/60" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-accent" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-accent">Dictate Mode Active</span>
              <p className="text-xs text-accent/70">Speak clearly — your words will appear below</p>
            </div>
            <button
              onClick={stopListening}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              Stop
            </button>
          </div>
        )}

        {queueNotice ? (
          <p className="pb-3 text-xs text-emerald-400">{queueNotice}</p>
        ) : null}

        {/* Textarea */}
        <div className="flex-1">
          <ResponseInput
            value={responseText}
            onChange={setResponseText}
            disabled={isListening}
            isListening={isListening}
          />
        </div>

        {/* Submit footer with timer */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-[12px] text-text-muted">
            {responseText.length > 0 && `${responseText.split(/\s+/).filter(Boolean).length} words`}
          </span>
          <div className="flex items-center gap-3">
            <TimerPill
              remainingSeconds={timer.remainingSeconds}
              status={timer.status}
              onStart={timer.start}
              onPause={timer.pause}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!responseText.trim() || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Sign in to continue" onClose={() => setShowModal(false)}>
          <p className="text-[13px] text-text-secondary">
            Sign in with Google to save your response and get AI feedback.
          </p>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => signInWithGoogle()} size="sm">
              Sign in with Google
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
