"use client";

import { play as playSound } from "cuelume";
import { useCallback, useRef, useState } from "react";

/**
 * OpenAI Realtime API over WebRTC — a genuine live voice call with the
 * model (continuous audio both directions, server-side voice-activity
 * detection, mid-sentence interruption), as opposed to the existing
 * mic button's record → transcribe → send-as-text → speak-the-reply loop.
 *
 * Flow: mint an ephemeral session server-side (POST /api/realtime/session
 * — this is where the system prompt and the tool list get attached, so
 * neither the real OPENAI_API_KEY nor the prompt internals ever reach the
 * browser) → open an RTCPeerConnection with the mic track attached →
 * exchange SDP directly with OpenAI using the ephemeral secret → from
 * then on audio flows over the WebRTC media track in both directions,
 * and a parallel data channel carries JSON protocol events (tool calls,
 * speech-started/stopped, transcripts).
 *
 * Tool calls are proxied through POST /api/realtime/tool-call rather than
 * executed in the browser — same trust boundary as the text chat's tools,
 * which all run server-side against the signed-in user's session.
 */

export type RealtimeStatus = "idle" | "connecting" | "connected" | "error";

export interface RealtimeTranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

// Raw Realtime API protocol events over the data channel — a large,
// evolving union upstream; narrowed locally to just the fields this hook
// reads rather than modeling the whole protocol.
interface RealtimeEvent {
  type: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  transcript?: string;
  error?: { message?: string };
}

// GA endpoint for the WebRTC SDP exchange. The preview-era URL was bare
// /v1/realtime — that now hard-fails with "The Realtime Beta API is no
// longer supported. Please use /v1/realtime/calls for the GA API."
// (verified directly against the API, not inferred).
const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

export function useRealtimeVoice() {
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  // Mirrors `status` for callbacks that need the current value without
  // depending on `status` itself (avoids stale closures without having to
  // recreate the callback on every status change).
  const statusRef = useRef<RealtimeStatus>("idle");
  const setStatusBoth = useCallback((next: RealtimeStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  // 0-1 amplitude of the assistant's own audio, sampled from the remote
  // WebRTC track — feeds the aura visualizer's `volume` prop so it reacts
  // to how loud the model is actually being, not just a boolean.
  const [assistantVolume, setAssistantVolume] = useState(0);
  const [transcript, setTranscript] = useState<RealtimeTranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // --- assistant volume analysis ------------------------------------------
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeRafRef = useRef<number | null>(null);
  const volumeDataRef = useRef<Uint8Array | null>(null);

  const stopVolumeLoop = useCallback(() => {
    if (volumeRafRef.current != null) cancelAnimationFrame(volumeRafRef.current);
    volumeRafRef.current = null;
    analyserRef.current = null;
    volumeDataRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setAssistantVolume(0);
  }, []);

  const startVolumeLoop = useCallback((stream: MediaStream) => {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    volumeDataRef.current = new Uint8Array(analyser.frequencyBinCount);

    // Sampled on rAF but only pushed to state every ~5th frame — smooth
    // enough for the shader, without a state update on every repaint.
    let frame = 0;
    const tick = () => {
      volumeRafRef.current = requestAnimationFrame(tick);
      const analyserNode = analyserRef.current;
      const data = volumeDataRef.current;
      if (!analyserNode || !data) return;
      frame++;
      if (frame % 5 !== 0) return;
      // TS's dom lib types getByteTimeDomainData as wanting
      // Uint8Array<ArrayBuffer> specifically; the array above is backed by
      // a plain ArrayBuffer at runtime regardless, so this is a type-only
      // mismatch between lib versions, not a real one.
      analyserNode.getByteTimeDomainData(data as Uint8Array<ArrayBuffer>);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const centered = (data[i] - 128) / 128;
        sumSquares += centered * centered;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      // RMS of speech rarely exceeds ~0.3 — scale so normal speaking
      // volume actually reaches toward 1 instead of maxing out at 0.3.
      setAssistantVolume(Math.min(1, rms * 3.5));
    };
    volumeRafRef.current = requestAnimationFrame(tick);
  }, []);

  // --- response/tool-call bookkeeping ------------------------------------
  // The Realtime API allows exactly ONE in-flight response per conversation.
  // Violating that throws "Conversation already has an active response in
  // progress: resp_...". Two things used to cause it here:
  //
  //   1. Each `response.function_call_arguments.done` fired its own
  //      `response.create`. A turn with several tool calls (very common —
  //      a day recap hits habits + deep work + finance at once) sent one
  //      per call, and every one after the first was rejected.
  //   2. server_vad runs with create_response: true, so OpenAI creates a
  //      response on its own when the user speaks. Ours could collide.
  //
  // Fix: buffer the calls as they stream in, run them all once the model's
  // turn actually finishes (`response.done`), then send a single
  // `response.create` — and only when no response is already active.
  const pendingCallsRef = useRef<
    { callId: string; name: string; rawArgs: string }[]
  >([]);
  const activeResponseRef = useRef(false);

  const cleanup = useCallback(() => {
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
      audioElRef.current = null;
    }
    stopVolumeLoop();
    pendingCallsRef.current = [];
    activeResponseRef.current = false;
    setIsUserSpeaking(false);
    setIsAssistantSpeaking(false);
  }, [stopVolumeLoop]);

  const stop = useCallback(() => {
    // A hangup only gets its own "call ended" tone if a call was actually
    // in flight — calling stop() on an already-idle hook (StrictMode
    // double-invoke, a stray click) should stay silent.
    if (statusRef.current !== "idle") playSound("droplet");
    cleanup();
    setStatusBoth("idle");
  }, [cleanup, setStatusBoth]);

  async function runOneCall(call: {
    callId: string;
    name: string;
    rawArgs: string;
  }): Promise<void> {
    let parsedArgs: unknown = {};
    try {
      parsedArgs = call.rawArgs ? JSON.parse(call.rawArgs) : {};
    } catch {
      // malformed arguments — still report it back to the model rather
      // than silently dropping the call, so it can retry or explain.
    }

    let output: unknown;
    try {
      const res = await fetch("/api/realtime/tool-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: call.name, arguments: parsedArgs }),
      });
      output = await res.json();
    } catch (err) {
      output = { error: err instanceof Error ? err.message : "Tool call failed" };
    }

    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call.callId,
          output: JSON.stringify(output),
        },
      }),
    );
  }

  /**
   * Drains every tool call the model asked for in the turn that just
   * ended, then asks for exactly one follow-up response. Running them in
   * parallel keeps a multi-tool recap fast; sending a single
   * `response.create` afterwards is what avoids the "active response in
   * progress" rejection.
   */
  async function flushPendingCalls() {
    const calls = pendingCallsRef.current;
    if (calls.length === 0) return;
    pendingCallsRef.current = [];

    await Promise.all(calls.map(runOneCall));

    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    // If the user started talking while tools were running, server_vad has
    // already opened a response of its own — ours would be rejected, and
    // the model will pick the outputs up in that response anyway.
    if (activeResponseRef.current) return;
    dc.send(JSON.stringify({ type: "response.create" }));
  }

  function handleServerEvent(event: RealtimeEvent) {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        setIsUserSpeaking(true);
        break;
      case "input_audio_buffer.speech_stopped":
        setIsUserSpeaking(false);
        break;
      case "response.created":
        activeResponseRef.current = true;
        setIsAssistantSpeaking(true);
        break;
      case "response.done":
        activeResponseRef.current = false;
        setIsAssistantSpeaking(false);
        // The turn is over, so every function call it was going to make
        // has now arrived — safe to run them and ask for one follow-up.
        void flushPendingCalls();
        break;
      case "conversation.item.input_audio_transcription.completed":
        if (event.transcript?.trim()) {
          setTranscript((prev) => [
            ...prev,
            { role: "user", text: event.transcript?.trim() ?? "" },
          ]);
        }
        break;
      case "response.audio_transcript.done":
        if (event.transcript?.trim()) {
          setTranscript((prev) => [
            ...prev,
            { role: "assistant", text: event.transcript?.trim() ?? "" },
          ]);
        }
        break;
      case "response.function_call_arguments.done":
        // Buffer only — executing here (one `response.create` per call)
        // is what produced the "active response in progress" error on any
        // turn that used more than one tool.
        if (event.call_id && event.name) {
          pendingCallsRef.current.push({
            callId: event.call_id,
            name: event.name,
            rawArgs: event.arguments ?? "{}",
          });
        }
        break;
      case "error":
        setError(event.error?.message ?? "Realtime session error");
        break;
      default:
        break;
    }
  }

  const start = useCallback(async () => {
    if (status === "connecting" || status === "connected") return;
    setError(null);
    setStatusBoth("connecting");
    playSound("loading");
    setTranscript([]);

    try {
      const sessionRes = await fetch("/api/realtime/session", { method: "POST" });
      if (!sessionRes.ok) {
        const body: { error?: string; detail?: string } = await sessionRes
          .json()
          .catch(() => ({}));
        // `detail` is the raw upstream OpenAI error body — surfaced while
        // this integration is still stabilizing so a failure is
        // actionable from the toast alone, not just server logs.
        throw new Error(
          [body.error, body.detail].filter(Boolean).join(": ") ||
            "Could not start a voice session",
        );
      }
      const session: { clientSecret?: string; model?: string } = await sessionRes.json();
      if (!session.clientSecret) throw new Error("No session credential returned");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      for (const track of stream.getTracks()) pc.addTrack(track, stream);

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        audioEl.play().catch(() => {
          // Autoplay can still be blocked in some browsers even from a
          // click-originated flow — the call continues either way, audio
          // just won't be audible until the tab gets a further gesture.
        });
        startVolumeLoop(e.streams[0]);
      };

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onopen = () => {
        setStatusBoth("connected");
        playSound("ready");
        // Without this, the model just sits there waiting for the user to
        // speak first — a live call should open like a call, not a chat
        // window staring back at you. The per-response `instructions`
        // override applies ONLY to this first turn; every later turn
        // still follows the full session instructions from
        // /api/realtime/session (which already tell it never to open with
        // an abstract "what's on your mind" — this reinforces it for the
        // one turn that has no user message to react to yet).
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "The call just connected and the user hasn't said anything yet — you speak first, right now. Call getDayReview for today before you say anything, and open with something concrete from it (hours logged, habits done or not, how it compares to their usual) — never an abstract opener like 'what's on your mind' or 'how are you feeling'. One or two sentences, then a real question tied to what you just said.",
            },
          }),
        );
      };
      dc.onmessage = (e) => {
        try {
          handleServerEvent(JSON.parse(e.data));
        } catch {
          // ignore malformed/unrecognized events rather than crash the call
        }
      };
      dc.onerror = () => setError("Voice connection error");
      dc.onclose = () => {
        if (pcRef.current) stop();
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const model = session.model ?? "gpt-realtime";
      const sdpRes = await fetch(
        `${REALTIME_CALLS_URL}?model=${encodeURIComponent(model)}`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${session.clientSecret}`,
            "Content-Type": "application/sdp",
          },
        },
      );
      if (!sdpRes.ok) {
        // Include the upstream body — a bare status code here is what made
        // the first round of this integration hard to diagnose.
        const detail = await sdpRes.text().catch(() => "");
        throw new Error(
          `Realtime handshake failed (${sdpRes.status})${detail ? `: ${detail}` : ""}`,
        );
      }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      cleanup();
      setStatusBoth("error");
      playSound("error");
      setError(err instanceof Error ? err.message : "Could not start voice call");
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: stop/cleanup/setStatusBoth/startVolumeLoop are stable refs-backed callbacks
  }, [status]);

  return {
    status,
    isUserSpeaking,
    isAssistantSpeaking,
    assistantVolume,
    transcript,
    error,
    start,
    stop,
  };
}
