"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type QueueItem = { text: string; id: string | null };

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
 *
 * Every item optionally carries an `id` (typically a message id) so
 * callers — e.g. a per-message Play/Pause button — can tell whether
 * THIS specific piece of content is the one currently playing via
 * `currentId` + `isSpeaking` + `isPaused`.
 */
export function useTTSQueue() {
  const queueRef = useRef<QueueItem[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const currentIdRef = useRef<string | null>(null);
  // Once /api/tts has 501'd once we stop hitting it — no point
  // re-requesting audio the server can't produce.
  const disabledRef = useRef(false);
  // Single flag covering both "fetching audio" and "playing audio" —
  // this is the mutex that prevents overlapping speech.
  const workingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

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
    currentIdRef.current = null;
    setCurrentId(null);
    setIsPaused(false);
  }, []);

  const playNext = useCallback(async () => {
    if (workingRef.current || queueRef.current.length === 0) return;
    if (disabledRef.current) {
      queueRef.current = [];
      setIsSpeaking(false);
      return;
    }

    workingRef.current = true;
    const item = queueRef.current.shift();
    if (!item) {
      workingRef.current = false;
      return;
    }
    const { text, id } = item;

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
      currentIdRef.current = id;

      const audio = new Audio(url);
      audioRef.current = audio;
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentId(id);

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
    (text: string, id: string | null = null) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      queueRef.current.push({ text: trimmed, id });
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

  /**
   * Play a specific item right now, interrupting anything queued or
   * playing — used by a manual per-message "Play" button, as opposed to
   * `enqueue` which politely waits its turn (used for streaming chunks).
   * If this exact id is already the active clip, toggles pause/resume
   * in place instead of re-fetching.
   */
  const playOne = useCallback(
    (text: string, id: string) => {
      if (currentIdRef.current === id && audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play();
          setIsPaused(false);
        } else {
          audioRef.current.pause();
          setIsPaused(true);
        }
        return;
      }
      stop();
      queueRef.current = [{ text, id }];
      playNext();
    },
    [stop, playNext],
  );

  useEffect(() => () => cleanupCurrent(), [cleanupCurrent]);

  return { enqueue, stop, playOne, isSpeaking, isPaused, currentId };
}
