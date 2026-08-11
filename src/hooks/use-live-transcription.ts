"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Live speech-to-text via the browser's Web Speech API — cheap, on-device,
 * streams into the caller's text handler as the user speaks so they can
 * see the transcript build up in real time. NOT as accurate as Whisper
 * for accents/noisy environments, but zero latency and free.
 *
 * Chrome/Edge have it as `webkitSpeechRecognition`; Firefox is unsupported
 * and this hook reports `supported: false` so callers can hide the toggle.
 */

// Minimal types — TS DOM lib doesn't ship SpeechRecognition since it's
// still non-standard.
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useLiveTranscription({
  onFinal,
  onInterim,
}: {
  /** Called with a complete phrase once the recognizer settles. */
  onFinal: (text: string) => void;
  /** Called with the tentative in-progress transcript on every update. */
  onInterim?: (text: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Mobile Chrome (and some Android WebViews) has a well-known bug where
  // it re-emits the SAME utterance as a "final" result multiple times as
  // it keeps refining recognition — "I", then "I spent", then "I spent
  // like", each marked isFinal:true — instead of one clean final per
  // utterance. Naively appending every final transcript produces exactly
  // the "I I spent I spent like I spent like..." duplication reported.
  // Fix: track the last final transcript and only emit the DELTA past it.
  const lastFinalRef = useRef("");

  useEffect(() => {
    setSupported(getConstructor() !== null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getConstructor();
    if (!Ctor) return;

    // Stop any lingering instance before starting a new one.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    lastFinalRef.current = "";

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0]?.transcript ?? "";
        if (res.isFinal) {
          const prev = lastFinalRef.current;
          let delta = transcript;
          if (prev) {
            if (transcript.startsWith(prev)) {
              // Same utterance, grown longer — only the new tail is new.
              delta = transcript.slice(prev.length);
            } else if (prev.startsWith(transcript)) {
              // A shorter re-send of something we already have in full —
              // stale duplicate, nothing new to add.
              delta = "";
            }
            // else: genuinely a new, unrelated utterance — emit it whole.
          }
          lastFinalRef.current = transcript;
          const trimmed = delta.trim();
          if (trimmed) onFinal(trimmed);
        } else {
          interim += transcript;
        }
      }
      if (interim && onInterim) onInterim(interim);
    };
    rec.onerror = () => {
      setIsListening(false);
    };
    rec.onend = () => {
      setIsListening(false);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [onFinal, onInterim]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(
    () => () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    },
    [],
  );

  return { supported, isListening, start, stop };
}
