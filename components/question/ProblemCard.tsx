"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/utils/formatTime";
import type { TimerStatus } from "@/lib/hooks/useTimer";
import type { Question, UserResponse } from "@/types";

type TimerControls = {
  remainingSeconds: number;
  status: TimerStatus;
  start: () => void;
  pause: () => void;
  stop: () => void;
  setDuration: (seconds: number) => void;
};

type ProblemCardProps = {
  question: Question;
  responses: UserResponse[];
  canViewHistory: boolean;
  timer: TimerControls;
};

const trackLabels: Record<Question["track"], string> = {
  estimations: "Estimations",
  behaviorals: "Behaviorals",
  reasoning: "Reasoning",
};

function formatTimeTaken(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatAttemptDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ProblemTimerCard({
  remainingSeconds,
  status,
  start,
  pause,
  stop,
  setDuration,
  onClose,
  isVisible,
}: TimerControls & { onClose: () => void; isVisible: boolean }) {
  const [draftMinutes, setDraftMinutes] = useState(
    Math.max(1, Math.round(remainingSeconds / 60))
  );
  const [isEditing, setIsEditing] = useState(false);
  const isRunning = status === "running";

  useEffect(() => {
    if (status === "idle") {
      setDraftMinutes(Math.max(1, Math.round(remainingSeconds / 60)));
    }
  }, [remainingSeconds, status]);

  const handleApply = () => {
    const minutes = Number(draftMinutes);
    if (Number.isFinite(minutes) && minutes > 0) {
      setDuration(minutes * 60);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`absolute top-4 right-4 z-10 transition-all duration-200 ease-out ${
        isVisible
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-2xl backdrop-blur-sm">
        <div className="p-8 min-w-[240px]">
          {/* Header */}
          <div className="flex items-center justify-end mb-6">
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 hover:bg-zinc-800/50 rounded-lg"
              aria-label="Close timer"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 4L4 12M4 4L12 12" />
              </svg>
            </button>
          </div>

          {/* Time Display */}
          <div className="text-center mb-8">
            {isEditing ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-20 rounded-md border border-zinc-700/60 bg-transparent px-2 py-1 text-center font-mono text-3xl text-white focus:border-zinc-500 focus:outline-none"
                  value={draftMinutes}
                  onChange={(event) => setDraftMinutes(Number(event.target.value))}
                  onKeyDown={(event) => event.key === "Enter" && handleApply()}
                  onBlur={handleApply}
                  autoFocus
                />
                <span className="text-sm text-zinc-400">min</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => status === "idle" && setIsEditing(true)}
                className="text-6xl font-mono text-white tracking-tight"
                title={status === "idle" ? "Click to edit" : undefined}
              >
                {formatTime(remainingSeconds)}
              </button>
            )}
            <div className="h-1 w-20 mx-auto mt-4 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={start}
              disabled={isRunning}
              className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white"
              aria-label="Start"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2L14 8L4 14V2Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={pause}
              disabled={!isRunning}
              className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white"
              aria-label="Pause"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <rect x="5" y="3" width="2" height="10" rx="1" />
                <rect x="9" y="3" width="2" height="10" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={stop}
              className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300 transition-all duration-200 hover:text-white"
              aria-label="Reset"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 4V8H12M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProblemCard({
  question,
  responses,
  canViewHistory,
  timer,
}: ProblemCardProps) {
  const [activeTab, setActiveTab] = useState<"problem" | "history">("problem");
  const [showTimer, setShowTimer] = useState(false);
  const problemRef = useRef<HTMLButtonElement>(null);
  const historyRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeRef = activeTab === "problem" ? problemRef : historyRef;
    if (activeRef.current) {
      setIndicatorStyle({
        left: activeRef.current.offsetLeft,
        width: activeRef.current.offsetWidth,
      });
    }
  }, [activeTab]);

  const trackLabel = trackLabels[question.track] ?? question.track;
  const timeLabel = `${question.suggested_time} min`;
  const problemPanelClasses = `absolute inset-0 p-6 transition-all duration-300 ease-out ${
    activeTab === "problem"
      ? "opacity-100 translate-x-0 blur-0 pointer-events-auto"
      : "opacity-0 -translate-x-8 blur-sm pointer-events-none"
  }`;
  const historyPanelClasses = `absolute inset-0 p-6 transition-all duration-300 ease-out ${
    activeTab === "history"
      ? "opacity-100 translate-x-0 blur-0 pointer-events-auto"
      : "opacity-0 translate-x-8 blur-sm pointer-events-none"
  }`;

  return (
    <div className="relative h-full">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl overflow-hidden border border-zinc-800 transition-all duration-300 h-full min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-6 relative">
            <button
              type="button"
              ref={problemRef}
              onClick={() => setActiveTab("problem")}
              className={`${
                activeTab === "problem" ? "text-white" : "text-zinc-500"
              } transition-colors pb-2`}
              aria-pressed={activeTab === "problem"}
            >
              Problem
            </button>
            <button
              type="button"
              ref={historyRef}
              onClick={() => setActiveTab("history")}
              className={`${
                activeTab === "history" ? "text-white" : "text-zinc-500"
              } transition-colors pb-2`}
              aria-pressed={activeTab === "history"}
            >
              History
            </button>
            <span
              className="absolute bottom-0 h-0.5 bg-white transition-all duration-300 ease-in-out"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTimer((prev) => !prev)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Toggle timer"
              aria-expanded={showTimer}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 5V10L13 13M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" />
              </svg>
            </button>
            <span className="text-zinc-500 hover:text-zinc-400 transition-colors" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17.5 10C17.5 10 14.5 4.5 10 4.5C5.5 4.5 2.5 10 2.5 10C2.5 10 5.5 15.5 10 15.5C14.5 15.5 17.5 10 17.5 10Z" />
                <circle cx="10" cy="10" r="2.5" />
              </svg>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <div className={problemPanelClasses} aria-hidden={activeTab !== "problem"}>
            <div className="h-full overflow-y-auto pr-2">
              {/* Title */}
              <h3 className="text-white text-2xl leading-tight mb-4 transition-colors">
                {question.title}
              </h3>

              {/* Pills */}
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs">
                  {trackLabel}
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs">
                  {question.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs">
                  {timeLabel}
                </span>
              </div>

              {/* Description */}
              <p className="text-zinc-400 text-sm mb-3 transition-colors">
                {question.prompt}
              </p>

              {/* Detailed Description */}
              {question.description && (
                <p className="text-zinc-500 text-sm mb-6 transition-colors">
                  {question.description}
                </p>
              )}

              {/* Seen At */}
              {question.companies?.length ? (
                <p className="text-zinc-600 text-xs">
                  Seen at{" "}
                  <span className="text-blue-400">
                    {question.companies.join(", ")}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
          <div className={historyPanelClasses} aria-hidden={activeTab !== "history"}>
            <div className="space-y-3 h-full overflow-y-auto pr-2">
              {!canViewHistory ? (
                <p className="text-zinc-500 text-sm text-center py-8">
                  Sign in to see your past attempts.
                </p>
              ) : responses.length > 0 ? (
                responses.map((response, index) => (
                  <div
                    key={response.id}
                    className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-zinc-500 text-sm">
                        Attempt {responses.length - index}
                      </span>
                      <div className="flex items-center gap-3">
                        {response.time_taken ? (
                          <span className="text-zinc-400 text-sm">
                            {formatTimeTaken(response.time_taken)}
                          </span>
                        ) : null}
                        <span className="text-zinc-500 text-sm">
                          {formatAttemptDate(response.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      {response.response.length > 180
                        ? `${response.response.slice(0, 180)}...`
                        : response.response}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-sm text-center py-8">
                  No attempts yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProblemTimerCard
        remainingSeconds={timer.remainingSeconds}
        status={timer.status}
        start={timer.start}
        pause={timer.pause}
        stop={timer.stop}
        setDuration={timer.setDuration}
        onClose={() => setShowTimer(false)}
        isVisible={showTimer}
      />
    </div>
  );
}
