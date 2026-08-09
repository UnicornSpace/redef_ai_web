"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A tiny FIFO speech queue that keeps one Audio element playing at a
 * time. Each `enqueue()` pushes text into the queue; if nothing is
 * playing or in-flight, it starts immediately, otherwise it plays after
 * the current clip finishes.
 *
 * The `workingRef` mutex covers BOTH the /api/tts fetch and the audio
 * playback — previously only the Audio element counted as "busy", so a
 * second enqueue during the fetch window would race and start a
 * parallel fetch, producing overlapping speech. `stop()` also aborts
 * an in-flight fetch by nulling the working flag and dropping the
 * about-to-be-created audio.
 */
export function useTTSQueue() {
  const queueRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Once /api/tts has 501'd once we stop hitting it — no point
  // re-requesting audio the server can't produce.
  const disabledRef = useRef(false);
  // Single flag covering both "fetching audio" and "playing audio" —
  // this is the mutex that prevents overlapping speech.
  const workingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cleanupCurrent = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const playNext = useCallback(async () => {
    if (workingRef.current || queueRef.current.length === 0) return;
    if (disabledRef.current) {
      queueRef.current = [];
      setIsSpeaking(false);
      return;
    }

    workingRef.current = true;
    const text = queueRef.current.shift();
    if (!text) {
      workingRef.current = false;
      return;
    }

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: abort.signal,
      });
      if (!res.ok) {
        if (res.status === 501) disabledRef.current = true;
        workingRef.current = false;
        abortRef.current = null;
        setIsSpeaking(false);
        playNext();
        return;
      }
      const blob = await res.blob();
      // stop() was called mid-fetch — drop this clip.
      if (abort.signal.aborted) {
        workingRef.current = false;
        return;
      }

      const url = URL.createObjectURL(blob);
      currentUrlRef.current = url;
      abortRef.current = null;

      const audio = new Audio(url);
      audioRef.current = audio;
      setIsSpeaking(true);

      audio.onended = () => {
        cleanupCurrent();
        workingRef.current = false;
        setIsSpeaking(false);
        playNext();
      };
      audio.onerror = () => {
        cleanupCurrent();
        workingRef.current = false;
        setIsSpeaking(false);
        playNext();
      };

      await audio.play().catch(() => {
        cleanupCurrent();
        workingRef.current = false;
        setIsSpeaking(false);
      });
    } catch {
      workingRef.current = false;
      abortRef.current = null;
      setIsSpeaking(false);
      playNext();
    }
  }, [cleanupCurrent]);

  const enqueue = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      queueRef.current.push(trimmed);
      playNext();
    },
    [playNext],
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    cleanupCurrent();
    workingRef.current = false;
    setIsSpeaking(false);
  }, [cleanupCurrent]);

  useEffect(() => () => cleanupCurrent(), [cleanupCurrent]);

  return { enqueue, stop, isSpeaking };
}
