"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionResultList = {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export function useSpeechToText() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wantToListenRef = useRef(false);
  const isRunningRef = useRef(false);

  // Initialize recognition once
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        setTranscript(finalTranscript.trim());
      }
    };

    recognition.onstart = () => {
      isRunningRef.current = true;
      setIsListening(true);
    };

    recognition.onend = () => {
      isRunningRef.current = false;

      // Only restart if user still wants to listen
      if (wantToListenRef.current) {
        setTimeout(() => {
          if (wantToListenRef.current && recognitionRef.current && !isRunningRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              wantToListenRef.current = false;
              setIsListening(false);
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event) => {
      // Ignore no-speech and aborted - they're not real errors
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      wantToListenRef.current = false;
      isRunningRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      wantToListenRef.current = false;
      isRunningRef.current = false;
      try {
        recognition.abort();
      } catch { }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (wantToListenRef.current) return; // Already want to listen

    wantToListenRef.current = true;
    setTranscript("");
    setIsListening(true);

    if (!isRunningRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // Already running is fine
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    wantToListenRef.current = false;
    setIsListening(false);

    if (recognitionRef.current && isRunningRef.current) {
      try {
        recognitionRef.current.abort();
      } catch { }
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
  };
}
