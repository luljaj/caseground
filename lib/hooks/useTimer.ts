"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export function useTimer(initialSeconds: number) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [status, setStatus] = useState<TimerStatus>("idle");

  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setRemainingSeconds(initialSeconds);
    setStatus("idle");
  }, [initialSeconds]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setStatus("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const start = useCallback(() => {
    if (remainingSeconds <= 0) {
      setRemainingSeconds(totalSeconds);
    }
    setStatus("running");
  }, [remainingSeconds, totalSeconds]);

  const pause = useCallback(() => {
    if (status === "running") {
      setStatus("paused");
    }
  }, [status]);

  const stop = useCallback(() => {
    setStatus("idle");
    setRemainingSeconds(totalSeconds);
  }, [totalSeconds]);

  const setDuration = useCallback((seconds: number) => {
    const next = Math.max(0, Math.floor(seconds));
    setTotalSeconds(next);
    setRemainingSeconds(next);
    setStatus("idle");
  }, []);

  const timeTaken = useMemo(
    () => Math.max(0, totalSeconds - remainingSeconds),
    [totalSeconds, remainingSeconds]
  );

  return {
    totalSeconds,
    remainingSeconds,
    status,
    start,
    pause,
    stop,
    setDuration,
    timeTaken,
  };
}
