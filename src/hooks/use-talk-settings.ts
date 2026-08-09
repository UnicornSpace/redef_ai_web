"use client";

import { useEffect, useState } from "react";

const AUTO_SEND_VOICE_KEY = "redef.talk.autoSendVoice";
const LIVE_MODE_KEY = "redef.talk.liveMode";

/**
 * Whether a voice note should send itself the moment it's transcribed, vs.
 * just filling the input box for the user to review/edit first. Defaults to
 * off — silently firing off whatever was transcribed is surprising, so
 * auto-send is something you opt into. Persisted in localStorage (not the
 * server) since this is a per-device UI preference, not account data.
 */
export function useAutoSendVoice(): [boolean, (value: boolean) => void] {
  const [autoSend, setAutoSendState] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTO_SEND_VOICE_KEY);
    if (stored != null) setAutoSendState(stored === "true");
  }, []);

  function setAutoSend(value: boolean): void {
    setAutoSendState(value);
    window.localStorage.setItem(AUTO_SEND_VOICE_KEY, String(value));
  }

  return [autoSend, setAutoSend];
}

/**
 * Voice-input model preference — `true` uses the browser's on-device
 * SpeechRecognition (Chrome/Edge; streams words into the input as you
 * speak); `false` uses the existing Whisper batch flow (better accuracy,
 * captured all-at-once at stop). Persisted per device like autoSendVoice.
 */
export function useLiveMode(): [boolean, (value: boolean) => void] {
  const [live, setLiveState] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(LIVE_MODE_KEY);
    if (stored != null) setLiveState(stored === "true");
  }, []);

  function setLive(value: boolean): void {
    setLiveState(value);
    window.localStorage.setItem(LIVE_MODE_KEY, String(value));
  }

  return [live, setLive];
}
