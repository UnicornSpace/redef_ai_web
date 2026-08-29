"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart, type UIMessage } from "ai";
import { play as playSound } from "cuelume";
import {
  ChevronDownIcon,
  CopyIcon,
  Loader2Icon,
  MicIcon,
  PauseIcon,
  PhoneIcon,
  PhoneOffIcon,
  PlayIcon,
  RefreshCcwIcon,
  SquareIcon,
  TriangleAlertIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import type { AgentState } from "@livekit/components-react";
import { AgentAudioVisualizerAura } from "@/components/agent-audio-visualizer-aura";
import { useLiveTranscription } from "@/hooks/use-live-transcription";
import { useRealtimeVoice } from "@/hooks/use-realtime-voice";
import { useTTSQueue } from "@/hooks/use-tts-queue";
import { renderToolOutput } from "@/components/talk/tool-renderers";
import { ToolTrace } from "@/components/talk/tool-trace";
import { messageToSpeech, toolPartToSpeech } from "@/components/talk/speakable";
import {
  FaBullseye,
  FaCalendar,
  FaChartLine,
  FaCheckCircle,
  FaMoon,
  FaTasks,
} from "react-icons/fa";
import { toast } from "sonner";
import { saveChatMessages } from "@/actions/chat";
import { useSetNavHidden } from "@/components/app-shell/mobile-fab-context";
import { Action, Actions } from "@/components/ai-elements/actions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { TextShimmer } from "../text-shimmer";
import { AudioLinesIcon, AudioLinesIconHandle } from "../ui/audio-lines";

const SUGGESTIONS = [
  { icon: FaMoon, prompt: "Wind up my day" },
  { icon: FaTasks, prompt: "What are my tasks for today?" },
  { icon: FaCalendar, prompt: "What's on my calendar this week?" },
  { icon: FaChartLine, prompt: "Show me this week's progress" },
  { icon: FaBullseye, prompt: "What should I focus on today?" },
  { icon: FaCheckCircle, prompt: "How are my habits tracking?" },
];

// Hardcoded acknowledgments spoken the instant the user hits send in
// auto-speak mode — fills the "waiting for the model to start streaming"
// gap. Loosely biased by what the user's message mentions so it doesn't
// sound canned (a task question gets a task-flavored ack, etc.).
const GENERIC_ACKS = [
  "Let me look at that for you.",
  "Give me a second, checking now.",
  "One moment, pulling that up.",
  "On it. Let me take a look.",
  "Alright, checking.",
];
const TASK_ACKS = [
  "Let me check your tasks.",
  "One second, looking at your tasks.",
];
const CALENDAR_ACKS = [
  "Let me look at your calendar.",
  "Checking your schedule.",
];
const FOCUS_ACKS = [
  "Let me check your focus time.",
  "One second, pulling up your deep work.",
];
const HABIT_ACKS = ["Let me look at your habits.", "Checking your habits now."];

function pickAcknowledgment(userText: string): string {
  const t = userText.toLowerCase();
  const pool = /\btask|todo|todos\b/.test(t)
    ? TASK_ACKS
    : /\bcalendar|schedule|meeting|event\b/.test(t)
      ? CALENDAR_ACKS
      : /\bfocus|deep work|pomodoro|session|worked\b/.test(t)
        ? FOCUS_ACKS
        : /\bhabit|streak\b/.test(t)
          ? HABIT_ACKS
          : GENERIC_ACKS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Extract text past `alreadySpoken` that ends on a sentence boundary
// (., !, or ?). Used to feed the TTS queue in ~sentence-sized chunks as
// the response streams in, so speech starts before the whole reply
// finishes. Returns null if there's no complete sentence ready yet.
function extractSpeakableChunk(
  fullText: string,
  alreadySpoken: number,
): { chunk: string; advance: number } | null {
  const remaining = fullText.slice(alreadySpoken);
  // Match everything up to and including the LAST sentence terminator in
  // the remaining text — batching adjacent short sentences into one TTS
  // call rather than one call per period.
  const match = remaining.match(/^[\s\S]*[.!?](?=\s|$)/);
  if (!match) return null;
  const chunk = match[0].trim();
  if (!chunk) return null;
  return { chunk, advance: match[0].length };
}

// Chats loaded from storage can carry messages with a missing (or, rarer,
// accidentally duplicated) `id` — this is the same root cause an earlier
// fix in this file already worked around by keying React's list `key` off
// the array index instead of `message.id`. That workaround doesn't extend
// to identity that needs to survive the array being MUTATED (speech
// progress tracking, and now prepending older messages via "load more"),
// since a plain index shifts every time something is prepended. Fixing
// it at the source — guarantee every message has a real, unique id the
// moment it enters the component — means every downstream `message.id`
// use (Play/Pause tracking, spoken-chars bookkeeping) just works.
function normalizeMessageIds(list: UIMessage[], chatId: string): UIMessage[] {
  const seen = new Set<string>();
  return list.map((m, i) => {
    const needsId = !m.id || seen.has(m.id);
    const id = needsId ? `${chatId}-h${i}` : m.id;
    seen.add(id);
    return needsId ? { ...m, id } : m;
  });
}

// Initial render shows only the most recent WINDOW_SIZE messages — a long
// chat's full history is already in memory (loaded server-side into
// `initialMessages`), but rendering all of it up front is unnecessary
// render/layout cost and is also what was causing the page to visibly
// open scrolled to the wrong place. "Load earlier messages" reveals more
// of the already-in-memory history, LOAD_MORE_BATCH at a time.
const WINDOW_SIZE = 20;
const LOAD_MORE_BATCH = 20;

/**
 * Lives inside <Conversation> purely to reach the underlying scrollable
 * element, which is only exposed via that component's context. Hands the
 * element up to ChatPane (via a ref, not state — this fires on every
 * scroll tick and we don't want a re-render per pixel) for two things:
 * preserving scroll position when older messages get prepended, and
 * auto-loading more once the user scrolls near the top.
 */
function ConversationScrollBridge({
  scrollElRef,
  onNearTop,
}: {
  scrollElRef: React.MutableRefObject<HTMLElement | null>;
  onNearTop: () => void;
}) {
  const { scrollRef } = useStickToBottomContext();

  useEffect(() => {
    scrollElRef.current = scrollRef.current;
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop < 120) onNearTop();
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollRef, scrollElRef, onNearTop]);

  return null;
}

/**
 * Forces an instant jump to the bottom on mount — opening a chat should
 * land on the latest message, not wherever a long history happens to lay
 * out to. A single jump routinely lands short because markdown, webfonts,
 * and the tool-output widgets each grow content height a beat after the
 * first paint. So we re-pin across the next few frames and a couple of
 * short timeouts to outlast that reflow. This only runs on mount, well
 * before the user could have scrolled, so re-pinning can't fight them.
 */
function ScrollToBottomOnMount() {
  const { scrollToBottom } = useStickToBottomContext();
  useEffect(() => {
    const pin = () => scrollToBottom("instant");
    pin();
    const raf1 = requestAnimationFrame(pin);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(pin));
    const t1 = window.setTimeout(pin, 150);
    const t2 = window.setTimeout(pin, 400);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function ChatPane({
  chatId,
  initialMessages,
  greeting,
  autoSendVoice,
  liveMode,
}: {
  chatId: string;
  initialMessages: UIMessage[];
  greeting: string;
  autoSendVoice: boolean;
  /** Controlled by the Talk settings popover in the parent — when true,
      the mic uses the browser's on-device SpeechRecognition instead of
      the Whisper batch flow. */
  liveMode: boolean;
}) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [interimText, setInterimText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const {
    enqueue: enqueueSpeech,
    stop: stopSpeech,
    playOne: playSpeechFor,
    isSpeaking,
    isPaused: isSpeechPaused,
    currentId: speakingMessageId,
  } = useTTSQueue();
  // Base input value (without live-transcription in-progress interim) —
  // we render `input + interimText` so the tentative words show inline
  // while speaking, but only the settled `input` gets sent.
  const liveTranscription = useLiveTranscription({
    onFinal: (t) => setInput((prev) => (prev ? `${prev} ${t}` : t).trim()),
    onInterim: (t) => setInterimText(t),
  });
  const realtimeVoice = useRealtimeVoice();
  const isRealtimeActive =
    realtimeVoice.status === "connecting" ||
    realtimeVoice.status === "connected";
  // Drives the aura visualizer's animation preset — the shader itself has
  // no idea about our hook, it just reacts to one of these state names.
  const auraState: AgentState =
    realtimeVoice.status === "connecting"
      ? "connecting"
      : realtimeVoice.status === "error"
        ? "failed"
        : realtimeVoice.status === "idle"
          ? "disconnected"
          : realtimeVoice.isAssistantSpeaking
            ? "speaking"
            : "listening";
  // Per-message-id counter of how many chars of the assistant reply
  // we've already fed to the TTS queue, so streaming chunks don't get
  // re-spoken on each render.
  const spokenCharsRef = useRef<Record<string, number>>({});
  // Which widget tool outputs (tasks/habits/finance/transactions) we've
  // already spoken in auto-speak mode, keyed `${messageId}::${toolCallId}`.
  // These carry visual-only data the caption omits, so auto-speak reads
  // them once as they complete — same one-shot guarantee spokenCharsRef
  // gives the streaming text.
  const spokenToolPartsRef = useRef<Set<string>>(new Set());

  // Full history normalized once per chat (ChatPane remounts fresh per
  // chatId via `key={chatId}` in the parent, so these lazy initializers
  // each run exactly once for this conversation) — everything else reads
  // from this instead of the raw `initialMessages` prop.
  const [fullHistory] = useState(() =>
    normalizeMessageIds(initialMessages, chatId),
  );
  const [oldestLoadedIndex, setOldestLoadedIndex] = useState(() =>
    Math.max(0, fullHistory.length - WINDOW_SIZE),
  );
  const [initialWindow] = useState(() => fullHistory.slice(-WINDOW_SIZE));
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const scrollElRef = useRef<HTMLElement | null>(null);
  const scrollAnchorRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  // Mirror of oldestLoadedIndex + an in-flight flag, read synchronously by
  // the scroll handler (which fires far more often than React re-renders)
  // so a burst of scroll events near the top can't kick off overlapping
  // loads or flash the spinner when there's nothing left to fetch.
  const oldestLoadedIndexRef = useRef(oldestLoadedIndex);
  const isLoadingOlderRef = useRef(false);
  useEffect(() => {
    oldestLoadedIndexRef.current = oldestLoadedIndex;
  }, [oldestLoadedIndex]);

  const { messages, sendMessage, status, error, stop, regenerate, setMessages } =
    useChat({
      id: chatId,
      messages: initialWindow,
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: { chatId },
      }),
      // Without this the model failing (bad request, provider outage, a
      // Bedrock misconfiguration) looked identical to it doing nothing —
      // no toast, no message, nothing for the user to act on. `error` +
      // `status === "error"` below render the actual message inline in
      // the chat too, not just this toast.
      onError: (err) => toast.error(err.message || "Couldn't get a response."),
    });

  // Splices live voice-call turns into this SAME chat thread as they
  // arrive, so a voice call is just another way of adding to one
  // conversation rather than a separate, throwaway transcript. Persisted
  // through the exact saveChatMessages() the text route's onFinish already
  // uses — the voice call has no server route of its own to hook onFinish
  // into, so this is the client-side equivalent, called after every new
  // turn rather than once per streamed response.
  const mergedVoiceCountRef = useRef(0);
  useEffect(() => {
    const all = realtimeVoice.voiceMessages;
    // A new call starting resets voiceMessages back to [] — detected here
    // (rather than reading realtimeVoice.status) so this doesn't need
    // that as a dependency, and re-syncs the count so the next call's
    // turns aren't skipped as if they were already merged.
    if (all.length < mergedVoiceCountRef.current) {
      mergedVoiceCountRef.current = 0;
    }
    const newOnes = all.slice(mergedVoiceCountRef.current);
    if (newOnes.length === 0) return;
    mergedVoiceCountRef.current = all.length;
    setMessages((prev) => {
      const next = [...prev, ...newOnes];
      void saveChatMessages(chatId, next);
      return next;
    });
  }, [realtimeVoice.voiceMessages, chatId, setMessages]);

  const loadOlderMessages = useCallback(() => {
    if (isLoadingOlderRef.current) return;
    if (oldestLoadedIndexRef.current <= 0) return;
    isLoadingOlderRef.current = true;
    setIsLoadingOlder(true);
    // The history is already in memory, so this is instant — but a bare
    // synchronous prepend feels like a jarring jump. A short beat lets the
    // spinner register as a real "loading more" moment, matching how the
    // user expects reaching the top to behave.
    window.setTimeout(() => {
      setOldestLoadedIndex((current) => {
        if (current <= 0) return current;
        const nextStart = Math.max(0, current - LOAD_MORE_BATCH);
        const older = fullHistory.slice(nextStart, current);
        const el = scrollElRef.current;
        if (el) {
          scrollAnchorRef.current = {
            scrollHeight: el.scrollHeight,
            scrollTop: el.scrollTop,
          };
        }
        setMessages((prev) => [...older, ...prev]);
        return nextStart;
      });
      setIsLoadingOlder(false);
      isLoadingOlderRef.current = false;
    }, 350);
  }, [fullHistory, setMessages]);

  // Prepending older messages above the viewport otherwise makes
  // everything the user was looking at jump down by however tall the
  // newly-inserted content is — compensate by shifting scrollTop by
  // exactly the amount scrollHeight grew, so nothing visibly moves.
  useLayoutEffect(() => {
    const anchor = scrollAnchorRef.current;
    const el = scrollElRef.current;
    if (anchor && el) {
      el.scrollTop = anchor.scrollTop + (el.scrollHeight - anchor.scrollHeight);
      scrollAnchorRef.current = null;
    }
  }, [oldestLoadedIndex]);

  useSetNavHidden(messages.length > 0);

  // Load persisted auto-speak preference — same localStorage pattern
  // as autoSendVoice/other Talk toggles.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setAutoSpeak(localStorage.getItem("talk_auto_speak") === "true");
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("talk_auto_speak", String(autoSpeak));
  }, [autoSpeak]);

  // Handle both edges of the auto-speak toggle:
  //   OFF → silence anything currently playing (a running ack shouldn't
  //   keep talking after the user hits mute).
  //   ON  → mark every existing assistant message as fully-spoken so
  //   flipping the toggle mid-conversation doesn't loudly replay the
  //   whole visible chat history. Only NEW content after the flip
  //   should be spoken.
  useEffect(() => {
    if (!autoSpeak) {
      stopSpeech();
      return;
    }
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      // Widget tool outputs already on screen shouldn't be re-spoken when
      // the toggle flips on — mark them handled alongside the text.
      for (const part of m.parts) {
        if (!part.type.startsWith("tool-")) continue;
        const toolPart = part as ToolUIPart;
        if (toolPart.state !== "output-available") continue;
        spokenToolPartsRef.current.add(`${m.id}::${toolPart.toolCallId}`);
      }
      if (spokenCharsRef.current[m.id] !== undefined) continue;
      const fullText = m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ");
      spokenCharsRef.current[m.id] = fullText.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional:
    // we only want this to run on the toggle transition, not on every
    // `messages` update (the streaming effect below handles those).
  }, [autoSpeak, stopSpeech]);

  // Stream-to-speech: watch the last assistant message and feed complete
  // sentences into the TTS queue as they arrive, then any tail once
  // streaming finishes. No-op when auto-speak is off.
  useEffect(() => {
    if (!autoSpeak) return;
    const last = messages.at(-1);
    if (!last || last.role !== "assistant") return;

    // Speak the widget tool outputs (tasks, habits, finance, transactions)
    // as they finish — the caption deliberately omits this data, so without
    // this the user would see it but never hear it. Ordered before the text
    // below to match the on-screen layout (widget first, caption under it).
    for (const part of last.parts) {
      if (!part.type.startsWith("tool-")) continue;
      const toolPart = part as ToolUIPart;
      if (toolPart.state !== "output-available") continue;
      const key = `${last.id}::${toolPart.toolCallId}`;
      if (spokenToolPartsRef.current.has(key)) continue;
      const spoken = toolPartToSpeech(toolPart);
      if (spoken) enqueueSpeech(spoken, last.id);
      // Mark handled even when not speakable, so we don't re-check it on
      // every subsequent render.
      spokenToolPartsRef.current.add(key);
    }

    const fullText = last.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ")
      .trim();
    if (!fullText) return;

    const alreadySpoken = spokenCharsRef.current[last.id] ?? 0;
    // If the message was already fully-spoken (e.g. toggled ON with
    // prior messages), don't re-speak.
    if (alreadySpoken >= fullText.length) return;

    const isStreaming = status === "streaming" || status === "submitted";

    if (isStreaming) {
      const next = extractSpeakableChunk(fullText, alreadySpoken);
      if (!next) return;
      enqueueSpeech(next.chunk, last.id);
      spokenCharsRef.current[last.id] = alreadySpoken + next.advance;
    } else {
      // Streaming done — flush anything left after the last sentence
      // boundary we already spoke.
      const remaining = fullText.slice(alreadySpoken).trim();
      if (remaining) {
        enqueueSpeech(remaining, last.id);
        spokenCharsRef.current[last.id] = fullText.length;
      }
    }
  }, [messages, status, autoSpeak, enqueueSpeech]);

  // Covers the whole "sent, nothing visible back yet" window — right after
  // submit (before the assistant message even exists) AND mid-stream once
  // tool calls have finished but no text token has landed yet. This is the
  // gap that used to render nothing at all.
  const lastMessage = messages.at(-1);
  const isWaitingForResponse =
    status === "submitted" ||
    (status === "streaming" &&
      lastMessage?.role === "assistant" &&
      !lastMessage.parts.some((p) => p.type === "text"));

  // Surface realtime connection/tool-call errors the same way the rest of
  // the pane reports problems — a toast, not a silent failure.
  useEffect(() => {
    if (realtimeVoice.error) toast.error(realtimeVoice.error);
  }, [realtimeVoice.error]);

  function handleRealtimeToggle() {
    if (isRealtimeActive) {
      playSound("release");
      realtimeVoice.stop();
      return;
    }
    // A live voice call and the type/record-then-send flow don't mix —
    // stop whatever the mic or auto-speak is mid-doing before opening it.
    if (isRecording) mediaRecorderRef.current?.stop();
    if (liveTranscription.isListening) {
      liveTranscription.stop();
      setInterimText("");
    }
    stopSpeech();
    playSound("press");
    realtimeVoice.start();
  }

  async function handleMicClick() {
    // Ignore taps while the previous recording is still being transcribed
    // — otherwise a quick double-click re-fires the recorder AND re-fires
    // the /api/transcribe request, showing "Transcribing..." twice.
    if (isTranscribing) return;

    // Live mode: use the browser's on-device SpeechRecognition — words
    // appear in the input as they're spoken. Falls back below to
    // Whisper-batch capture if live is off or unsupported.
    if (liveMode && liveTranscription.supported) {
      if (liveTranscription.isListening) {
        liveTranscription.stop();
        setInterimText("");
        playSound("release");
      } else {
        playSound("press");
        liveTranscription.start();
      }
      return;
    }

    if (isRecording) {
      playSound("release");
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        for (const track of stream.getTracks()) track.stop();
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        // A silent recording is still ~1-2KB of MediaRecorder container
        // overhead, not zero — bump the threshold so we don't show
        // "Transcribing..." for what's effectively no audio.
        if (blob.size < 2000) return;
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });
          const data: { text?: string; error?: string } = await res.json();
          const text = data.text?.trim();
          if (text) {
            if (autoSendVoice) {
              sendMessage({ text });
            } else {
              setInput((prev) => (prev ? `${prev} ${text}` : text));
            }
          }
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      playSound("press");
    } catch {
      // mic permission denied or unavailable — silently no-op, the text
      // input is always still there as a fallback
    }
  }

  function handleSubmit(message: PromptInputMessage) {
    const text = message.text?.trim();
    if (!text) return;
    // Stop any speech from the previous turn so a lingering ack /
    // half-finished reply doesn't overlap the new one.
    stopSpeech();
    // If live transcription was still running, close it out.
    if (liveTranscription.isListening) {
      liveTranscription.stop();
      setInterimText("");
    }
    // Kick off the placeholder ack BEFORE the model call — this is what
    // fills the "sent, still waiting" gap with something audible. The
    // real response then queues after it via the streaming effect
    // above, no manual glue needed.
    if (autoSpeak) enqueueSpeech(pickAcknowledgment(text));
    sendMessage({ text });
    setInput("");
  }

  // Cuelume: play a subtle "arrived" chime when a response transitions
  // from streaming → ready. Tracked with a ref so we don't fire it on
  // every render, only on the actual state change.
  const wasStreamingRef = useRef(false);
  useEffect(() => {
    const isStreamingNow = status === "streaming" || status === "submitted";
    if (wasStreamingRef.current && !isStreamingNow) {
      playSound("chime");
    }
    wasStreamingRef.current = isStreamingNow;
  }, [status]);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const audioIconRef = useRef<AudioLinesIconHandle>(null);

  // Drive the AudioLines icon's wave animation from recording state. This
  // must run in an effect, not directly in the render body (calling an
  // imperative ref method during render is a side effect masquerading as
  // a plain statement — it re-fires on every render instead of only on
  // actual start/stop transitions).
  useEffect(() => {
    if (isRecording || liveTranscription.isListening) {
      audioIconRef.current?.startAnimation();
    } else {
      audioIconRef.current?.stopAnimation();
    }
  }, [isRecording, liveTranscription.isListening]);

  return (
    <div className="flex w-full flex-col pt-8  md:pb-28 md:pt-16">
      {messages.length === 0 ? (
        <p className="mx-auto mt-16 mb-8 text-center text-3xl font-bold text-ink md:mt-24 md:text-3xl">
          {greeting}
        </p>
      ) : null}
      <Conversation className="flex-1 mb-16 " initial="instant">
        <ScrollToBottomOnMount />
        <ConversationScrollBridge
          scrollElRef={scrollElRef}
          onNearTop={loadOlderMessages}
        />
        <ConversationContent>
          {isLoadingOlder ? (
            <div className="flex justify-center pb-3">
              <Loader2Icon className="size-5 animate-spin text-body-muted" />
            </div>
          ) : null}
          {messages.map((message, mi) => {
            const voiceMeta = message.metadata as
              | {
                  source?: string;
                  kind?: string;
                  usage?: { inputTokens: number; outputTokens: number };
                }
              | undefined;
            const isVoiceMessage = voiceMeta?.source === "voice";

            if (voiceMeta?.kind === "call-summary") {
              const usage = voiceMeta.usage;
              return (
                <Collapsible
                  key={mi}
                  className="my-2 flex justify-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-body-muted hover:text-ink">
                      <PhoneOffIcon className="size-3" />
                      Call ended
                      <ChevronDownIcon className="size-3" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <p className="text-[11px] text-body-muted">
                        {usage
                          ? `${usage.inputTokens} in · ${usage.outputTokens} out · ${
                              usage.inputTokens + usage.outputTokens
                            } tokens total`
                          : "No usage recorded for this call."}
                      </p>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            }

            const isLastMessage = mi === messages.length - 1;
            // Every tool call for this message collapses into ONE trace —
            // never a stack of separate "Working on it" parents, even when
            // the model interleaves tool calls with text across steps.
            // Their purpose-built widgets (task list, habit chips, finance
            // cards) are promoted out below the trace so they read as
            // first-class replies; the remaining text/reasoning follow in
            // order.
            const toolParts = message.parts.filter((p) =>
              p.type.startsWith("tool-"),
            ) as ToolUIPart[];
            const widgets = toolParts
              .map((p) => ({ part: p, custom: renderToolOutput(p) }))
              .filter((x) => x.custom !== null);
            const flowParts = message.parts.filter(
              (p) => p.type === "text" || p.type === "reasoning",
            );

            return (
              <div key={mi} className="whitespace-pre-wrap">
                {toolParts.length > 0 ? <ToolTrace parts={toolParts} /> : null}
                {widgets.map(({ custom }, wi) => (
                  <div key={`${mi}-widget-${wi}`} className="my-3">
                    {custom}
                  </div>
                ))}
                {flowParts.map((part, pi) => {
                  if (part.type === "text") {
                    return (
                      <Fragment key={`${mi}-text-${pi}`}>
                        <Message from={message.role} className="">
                          <MessageContent
                            variant="contained"
                            className="text-base text-ink md:text-lg rounded-sm"
                          >
                            {isVoiceMessage ? (
                              <span
                                className="mb-1 flex items-center gap-1 text-[11px] font-medium opacity-70"
                                title="Said during a voice call"
                              >
                                <MicIcon className="size-3" />
                                Voice
                              </span>
                            ) : null}
                            <Response className="">{part.text}</Response>
                          </MessageContent>
                        </Message>
                        {message.role === "assistant" ? (
                          <Actions className="-mt-2 mb-2 md:gap-0! ml-1">
                            <Action
                              tooltip="Copy"
                              onClick={() => handleCopy(part.text)}
                            >
                              <CopyIcon className="size-3.5" />
                            </Action>
                            <Action
                              tooltip={
                                speakingMessageId === message.id &&
                                isSpeaking &&
                                !isSpeechPaused
                                  ? "Pause"
                                  : "Play"
                              }
                              onClick={() =>
                                playSpeechFor(
                                  messageToSpeech(message),
                                  message.id,
                                )
                              }
                            >
                              {speakingMessageId === message.id &&
                              isSpeaking &&
                              !isSpeechPaused ? (
                                <PauseIcon className="size-3.5" />
                              ) : (
                                <PlayIcon className="size-3.5" />
                              )}
                            </Action>
                            {isLastMessage &&
                            status !== "streaming" &&
                            status !== "submitted" ? (
                              <Action
                                tooltip="Regenerate"
                                onClick={() => regenerate()}
                              >
                                <RefreshCcwIcon className="size-3.5" />
                              </Action>
                            ) : null}
                          </Actions>
                        ) : null}
                      </Fragment>
                    );
                  }

                  if (part.type === "reasoning") {
                    const isReasoningStreaming =
                      isLastMessage &&
                      status === "streaming" &&
                      message.parts.at(-1) === part;
                    return (
                      <Reasoning
                        key={`${mi}-reasoning-${pi}`}
                        className="w-full transition-all duration-300"
                        isStreaming={isReasoningStreaming}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  }

                  return null;
                })}
              </div>
            );
          })}
          {isWaitingForResponse ? (
            <Message from="assistant">
              <MessageContent variant="flat">
                <TextShimmer className="font-mono text-sm" duration={1}>
                  Thinking...
                </TextShimmer>
              </MessageContent>
            </Message>
          ) : null}
          {status === "error" ? (
            <div className="mx-1 flex flex-col gap-2 rounded-xl border border-rf-coral/30 bg-rf-coral/5 px-4 py-3">
              <div className="flex items-start gap-2 text-sm text-rf-coral">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
                <span>
                  {error?.message || "Something went wrong generating a response."}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => regenerate()}
              >
                <RefreshCcwIcon className="size-3.5" />
                Try again
              </Button>
            </div>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <section
        className={cn(
          // z-50 keeps the input above the mobile top-header (which is
          // now sticky at z-30) and any late-arriving overlays — a
          // low-z on the fixed input was letting other layers steal
          // taps on mobile.
          "fixed max-w-3xl mx-auto sm:mr-0 md:mr-0 lg:mr-64  w-full inset-x-0 bottom-0 z-50 transition-all duration-150",
          messages.length === 0 && "static",
        )}
      >
        <div className="mx-auto mb-4 w-full  px-4">
          {isRealtimeActive ? (
            <div className="mb-2 flex flex-col items-center gap-2 rounded-xl border border-line bg-white/90 px-4 py-4 shadow-xl backdrop-blur">
              <AgentAudioVisualizerAura
                size="sm"
                state={auraState}
                volume={
                  realtimeVoice.isAssistantSpeaking
                    ? realtimeVoice.assistantVolume
                    : 0
                }
                color="#3e9a35"
                themeMode="light"
              />
              {realtimeVoice.status === "connecting" ? (
                <TextShimmer
                  key={realtimeVoice.connectingMessage}
                  className="text-sm font-medium"
                  duration={1.3}
                >
                  {realtimeVoice.connectingMessage}
                </TextShimmer>
              ) : (
                <span className="text-sm font-medium text-ink">
                  {realtimeVoice.isAssistantSpeaking
                    ? "Redef is speaking..."
                    : realtimeVoice.isUserSpeaking
                      ? "Listening..."
                      : "Live call connected — say something"}
                </span>
              )}
              {realtimeVoice.transcript.length > 0 ? (
                <p className="line-clamp-2 text-center text-sm text-body-muted">
                  {realtimeVoice.transcript.at(-1)?.text}
                </p>
              ) : null}
            </div>
          ) : null}
          <PromptInput
            onSubmit={handleSubmit}
            // Force the InputGroup to be a rounded-box (not a pill) and
            // clip its contents. The `!important` on min-h-9 defeats the
            // InputGroup's built-in `**:[textarea]:min-h-20.5` (and its
            // `max-sm:min-h-23.5` variant on mobile), so the textarea
            // truly starts at single-line height regardless of viewport.
            // The textarea's own `field-sizing-content` handles auto-grow
            // from there, capped by max-h-28.
            className=" [&>[data-slot=input-group]]:bg-primary/5  [&>[data-slot=input-group]]:overflow-hidden [&>[data-slot=input-group]]:rounded-xl [&>[data-slot=input-group]]:bg-white [&>[data-slot=input-group]]:shadow-xl **:[textarea]:!min-h-9 **:[textarea]:max-sm:!min-h-9"
          >
            <PromptInputBody>
              <PromptInputTextarea
                value={input + (interimText ? ` ${interimText}` : "")}
                onChange={(e) => {
                  // While an interim transcription is being appended
                  // visually, the raw textarea value contains "input +
                  // interim". Strip the interim suffix before saving to
                  // state so a manual edit doesn't lose position.
                  const v = e.target.value;
                  if (interimText && v.endsWith(interimText)) {
                    setInput(v.slice(0, v.length - interimText.length - 1));
                  } else {
                    setInput(v);
                  }
                }}
                placeholder={
                  isRealtimeActive
                    ? "Live call in progress — just talk..."
                    : isRecording
                      ? "Listening..."
                      : isTranscribing
                        ? "Transcribing..."
                        : liveTranscription.isListening
                          ? "Speak now — words appear as you go..."
                          : "Say something..."
                }
                // `disabled` (not readOnly) for recording/transcribing is
                // intentional and matches the InputGroup's built-in
                // has-[textarea:disabled]:opacity-64 rule — a brief dim is
                // the right cue there. For a whole voice call, that same
                // rule made the entire input look transparent/broken for
                // as long as the call ran. `readOnly` blocks typing
                // without tripping that rule.
                disabled={isRecording || isTranscribing}
                readOnly={isRealtimeActive}
                className="max-h-28 px-2 bg-primary/5 w-full overflow-y-auto py-1.5 text-base leading-normal"
              />
            </PromptInputBody>
            <PromptInputFooter className="flex items-end py-1.5 px-4 mb-1 bg-primary/5">
              <PromptInputTools>
                <PromptInputButton
                  variant={autoSpeak ? "default" : "ghost"}
                  onClick={() => setAutoSpeak((v) => !v)}
                  className="p-4!"
                  aria-label={
                    autoSpeak
                      ? "Turn off auto-speak (responses will still be readable)"
                      : "Turn on auto-speak (responses are read aloud)"
                  }
                  aria-pressed={autoSpeak}
                >
                  {autoSpeak ? (
                    <Volume2Icon className="size-5" />
                  ) : (
                    <VolumeXIcon className="size-5" />
                  )}
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputTools className="space-x-1">
                {/* Live voice call (OpenAI Realtime API) — a genuine
                    two-way audio conversation with the model, distinct
                    from the mic button's record → transcribe → send loop.
                    On the right, right before the mic, so the two voice
                    affordances sit next to each other. */}
                <PromptInputButton
                  variant={isRealtimeActive ? "destructive" : "ghost"}
                  onClick={handleRealtimeToggle}
                  // Deliberately NOT disabled while connecting. It used to
                  // be, which meant a connection that stalled left the user
                  // with a spinning, unclickable button and no way to back
                  // out short of reloading the page. Connecting is exactly
                  // when someone most wants to be able to cancel.
                  className="p-4!"
                  aria-label={
                    realtimeVoice.status === "connecting"
                      ? "Cancel connecting"
                      : isRealtimeActive
                        ? "End live voice call"
                        : "Start a live voice call"
                  }
                  aria-pressed={isRealtimeActive}
                >
                  {realtimeVoice.status === "connecting" ? (
                    <Loader2Icon className="size-5 animate-spin" />
                  ) : isRealtimeActive ? (
                    <PhoneOffIcon className="size-5" />
                  ) : (
                    <PhoneIcon className="size-5" />
                  )}
                </PromptInputButton>
                {/* Mic button — while recording/listening, the AudioLines
                    icon's own wave animation (driven via ref above) is the
                    "listening" indicator, replacing the earlier ping-pulse
                    overlay. */}
                <PromptInputButton
                  variant={
                    isRecording || liveTranscription.isListening
                      ? "destructive"
                      : "ghost"
                  }
                  disabled={isTranscribing || isRealtimeActive}
                  // touch-manipulation disables the iOS double-tap-to-zoom
                  // delay, which otherwise makes the mic feel unresponsive
                  // (or outright unclickable if a nearby tap steals focus
                  // during the delay window).
                  className="p-4! touch-manipulation"
                  onClick={handleMicClick}
                  aria-label={
                    isRecording || liveTranscription.isListening
                      ? "Stop recording"
                      : "Record a voice note"
                  }
                >
                  {isTranscribing ? (
                    <Loader2Icon className="size-5 animate-spin" />
                  ) : (
                    // AudioLinesIcon stays mounted at all times — its ref
                    // never re-attaches, so startAnimation()/stopAnimation()
                    // always act on an already-settled component (same as
                    // triggering it via hover, which is what it's built
                    // for). Conditionally MOUNTING it only while recording
                    // raced the very first frame against Motion's
                    // useAnimation() controls and the wave never visibly
                    // kicked in. Visibility is toggled with CSS instead.
                    //
                    // Each icon gets its own absolute inset-0 flex-center
                    // wrapper rather than sizing the icon itself to fill
                    // the box — Mic (lucide, 24x24 viewBox) and
                    // AudioLines (custom svg) don't share the same
                    // intrinsic proportions, so matching their raw boxes
                    // left them visibly off-center relative to each
                    // other. Flex-centering each one independently inside
                    // an identically-sized overlay lands both dead-center
                    // without hand-tuned margin offsets.
                    <div className="relative size-5">
                      <span
                        className={cn(
                          "absolute inset-0 flex items-center justify-center transition-opacity duration-150",
                          isRecording || liveTranscription.isListening
                            ? "opacity-0"
                            : "opacity-100",
                        )}
                      >
                        <MicIcon className="size-5" />
                      </span>
                      <span
                        className={cn(
                          "absolute inset-0 flex items-center justify-center transition-opacity duration-150",
                          isRecording || liveTranscription.isListening
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      >
                        <AudioLinesIcon ref={audioIconRef} size={20} />
                      </span>
                    </div>
                  )}
                </PromptInputButton>
                {/* Send button — hidden until the user has typed something
                    (or a stream is running, so it can act as a stop
                    button). Fade+slide-in animation via tw-animate-css so
                    the mic doesn't jump when it re-appears. */}
                {input.trim().length > 0 || status === "streaming" ? (
                  <PromptInputSubmit
                    status={status}
                    className="p-4! animate-in fade-in-0 slide-in-from-right-1 duration-150"
                    onClick={(e) => {
                      if (status === "streaming") {
                        e.preventDefault();
                        stop();
                      }
                    }}
                  />
                ) : null}
              </PromptInputTools>
            </PromptInputFooter>
          </PromptInput>
        </div>
        {messages.length === 0 ? (
          <Suggestions className="mx-auto w-[90%] flex-wrap items-center justify-center md:max-w-2xl">
            {SUGGESTIONS.map((s, i) => (
              <Suggestion
                key={s.prompt}
                onClick={(text) => setInput(text)}
                suggestion={s.prompt}
                className="bg-white/60"
              >
                <s.icon className={cn("mr-1 ", i % 2 === 0 ? "text-rf-" : "text-rf-blue")} />
                {s.prompt}
              </Suggestion>
            ))}
          </Suggestions>
        ) : null}
      </section>
    </div>
  );
}
