"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart, type UIMessage } from "ai";
import { play as playSound } from "cuelume";
import {
  CopyIcon,
  Loader2Icon,
  MicIcon,
  RefreshCcwIcon,
  SquareIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useLiveTranscription } from "@/hooks/use-live-transcription";
import { useTTSQueue } from "@/hooks/use-tts-queue";
import { renderToolOutput } from "@/components/talk/tool-renderers";
import {
  FaBullseye,
  FaCalendar,
  FaChartLine,
  FaCheckCircle,
  FaTasks,
} from "react-icons/fa";
import { toast } from "sonner";
import { useSetNavHidden } from "@/components/app-shell/mobile-fab-context";
import { Action, Actions } from "@/components/ai-elements/actions";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { cn } from "@/lib/utils";
import { TextShimmer } from "../text-shimmer";

const SUGGESTIONS = [
  { icon: FaTasks, prompt: "What are my tasks for today?" },
  { icon: FaCalendar, prompt: "What's on my calendar this week?" },
  { icon: FaChartLine, prompt: "Show me this week's progress" },
  { icon: FaBullseye, prompt: "What should I focus on today?" },
  { icon: FaCheckCircle, prompt: "How are my habits tracking?" },
];

// Friendly labels for the tool-call steps shown in the Chain of Thought —
// keyed by the exact `tool-<name>` part type the AI SDK emits, matching the
// tool names registered in src/app/api/chat/route.ts.
const TOOL_STEP_LABELS: Record<string, string> = {
  "tool-getTasks": "Checking your tasks",
  "tool-getSecretPin": "Getting your PIN",
  "tool-addNewTask": "Adding a task",
  "tool-markTaskAsCompleted": "Marking a task complete",
  "tool-listDeepWorkProjects": "Checking your projects",
  "tool-logDeepWorkSessions": "Logging your focus sessions",
  "tool-getDeepWorkSummary": "Checking your focus time",
  "tool-listHabits": "Checking your habits",
  "tool-toggleHabitToday": "Updating a habit",
  "tool-getFinanceSummary": "Checking your finances",
  "tool-listRecentTransactions": "Fetching recent transactions",
  "tool-addTransaction": "Logging a transaction",
  "tool-updateMemory": "Updating memory",
};

function toolStepStatus(
  state: ToolUIPart["state"],
): "complete" | "active" | "pending" {
  if (state === "output-available" || state === "output-error")
    return "complete";
  if (state === "input-available") return "active";
  return "pending";
}

type PartGroup =
  | { kind: "tools"; parts: ToolUIPart[] }
  | { kind: "single"; part: UIMessage["parts"][number] };

// Consecutive tool-call parts collapse into one Chain of Thought block
// instead of a separate card per tool call — reads as one "here's what I
// did" step list rather than a stack of unrelated boxes.
function groupParts(parts: UIMessage["parts"]): PartGroup[] {
  const groups: PartGroup[] = [];
  for (const part of parts) {
    if (part.type.startsWith("tool-")) {
      const last = groups.at(-1);
      if (last?.kind === "tools") {
        last.parts.push(part as ToolUIPart);
      } else {
        groups.push({ kind: "tools", parts: [part as ToolUIPart] });
      }
      continue;
    }
    groups.push({ kind: "single", part });
  }
  return groups;
}

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
  const { enqueue: enqueueSpeech, stop: stopSpeech } = useTTSQueue();
  // Base input value (without live-transcription in-progress interim) —
  // we render `input + interimText` so the tentative words show inline
  // while speaking, but only the settled `input` gets sent.
  const liveTranscription = useLiveTranscription({
    onFinal: (t) => setInput((prev) => (prev ? `${prev} ${t}` : t).trim()),
    onInterim: (t) => setInterimText(t),
  });
  // Per-message-id counter of how many chars of the assistant reply
  // we've already fed to the TTS queue, so streaming chunks don't get
  // re-spoken on each render.
  const spokenCharsRef = useRef<Record<string, number>>({});
  const { messages, sendMessage, status, stop, regenerate } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId },
    }),
  });

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
      enqueueSpeech(next.chunk);
      spokenCharsRef.current[last.id] = alreadySpoken + next.advance;
    } else {
      // Streaming done — flush anything left after the last sentence
      // boundary we already spoke.
      const remaining = fullText.slice(alreadySpoken).trim();
      if (remaining) {
        enqueueSpeech(remaining);
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

  return (
    <div className="flex w-full flex-col pt-8  md:pb-28 md:pt-16">
      {messages.length === 0 ? (
        <p className="mx-auto mt-16 mb-8 text-center text-3xl font-extrabold text-ink md:mt-24 md:text-5xl">
          {greeting}
        </p>
      ) : null}
      <Conversation className="flex-1 mb-16 ">
        <ConversationContent>
          {messages.map((message, mi) => {
            const isLastMessage = mi === messages.length - 1;
            const groups = groupParts(message.parts);

            return (
              <div key={mi} className="whitespace-pre-wrap">
                {groups.map((group, gi) => {
                  if (group.kind === "tools") {
                    const anyActive = group.parts.some(
                      (p) => toolStepStatus(p.state) !== "complete",
                    );
                    // Split parts into (a) tools that have a purpose-built
                    // widget in tool-renderers.tsx and (b) everything else.
                    // The widgets get promoted out of the collapsible
                    // "Working on it" indicator into the main response
                    // flow — a task list should feel like a first-class
                    // reply, not a debug detail buried inside a fold.
                    const widgets = group.parts
                      .map((p) => ({ part: p, custom: renderToolOutput(p) }))
                      .filter((x) => x.custom !== null);

                    return (
                      <Fragment key={`${mi}-tools-${gi}`}>
                        <ChainOfThought defaultOpen={anyActive}>
                          <ChainOfThoughtHeader>
                            Working on it
                          </ChainOfThoughtHeader>
                          <ChainOfThoughtContent>
                            {group.parts.map((toolPart, ti) => (
                              <ChainOfThoughtStep
                                key={`${mi}-${gi}-${ti}`}
                                label={
                                  TOOL_STEP_LABELS[toolPart.type] ??
                                  toolPart.type.replace("tool-", "")
                                }
                                status={toolStepStatus(toolPart.state)}
                              >
                                {toolPart.output != null ||
                                toolPart.errorText != null ? (
                                  <Tool defaultOpen={false}>
                                    <ToolHeader
                                      type={toolPart.type}
                                      state={toolPart.state}
                                    />
                                    <ToolContent>
                                      {toolPart.input != null ? (
                                        <ToolInput input={toolPart.input} />
                                      ) : null}
                                      <ToolOutput
                                        output={
                                          toolPart.output != null ? (
                                            <Response>
                                              {String(toolPart.output)}
                                            </Response>
                                          ) : undefined
                                        }
                                        errorText={toolPart.errorText}
                                      />
                                    </ToolContent>
                                  </Tool>
                                ) : null}
                              </ChainOfThoughtStep>
                            ))}
                          </ChainOfThoughtContent>
                        </ChainOfThought>
                        {widgets.map(({ part: w, custom }, wi) => (
                          <div
                            key={`${mi}-widget-${gi}-${wi}`}
                            className="my-3"
                          >
                            {custom}
                          </div>
                        ))}
                      </Fragment>
                    );
                  }

                  const part = group.part;

                  if (part.type === "text") {
                    return (
                      <Fragment key={`${mi}-text-${gi}`}>
                        <Message from={message.role} className="">
                          <MessageContent
                            variant="contained"
                            className="text-base text-ink md:text-lg rounded-sm"
                          >
                            <Response className="">{part.text}</Response>
                          </MessageContent>
                        </Message>
                        {message.role === "assistant" ? (
                          <Actions className="-mt-2 mb-2 ml-1">
                            <Action
                              tooltip="Copy"
                              onClick={() => handleCopy(part.text)}
                            >
                              <CopyIcon className="size-3.5" />
                            </Action>
                            <Action
                              tooltip="Read aloud"
                              onClick={() => enqueueSpeech(part.text)}
                            >
                              <Volume2Icon className="size-3.5" />
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
                        key={`${mi}-reasoning-${gi}`}
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
                  isRecording
                    ? "Listening..."
                    : isTranscribing
                      ? "Transcribing..."
                      : liveTranscription.isListening
                        ? "Speak now — words appear as you go..."
                        : "Say something..."
                }
                disabled={isRecording || isTranscribing}
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
                {/* Mic button. When recording, wrap the icon in a relative
                    span so the animate-ping ring sits behind it — gives a
                    subtle "listening" pulse without moving the icon. */}
                <PromptInputButton
                  variant={
                    isRecording || liveTranscription.isListening
                      ? "destructive"
                      : "ghost"
                  }
                  disabled={isTranscribing}
                  // touch-manipulation disables the iOS double-tap-to-zoom
                  // delay, which otherwise makes the mic feel unresponsive
                  // (or outright unclickable if a nearby tap steals focus
                  // during the delay window).
                  className={cn(
                    "p-4! touch-manipulation",
                    (isRecording || liveTranscription.isListening) &&
                      "relative",
                  )}
                  onClick={handleMicClick}
                  aria-label={
                    isRecording || liveTranscription.isListening
                      ? "Stop recording"
                      : "Record a voice note"
                  }
                >
                  {isRecording || liveTranscription.isListening ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-2 rounded-full bg-white/40 animate-ping"
                    />
                  ) : null}
                  {isTranscribing ? (
                    <Loader2Icon className="size-5 animate-spin" />
                  ) : isRecording || liveTranscription.isListening ? (
                    <SquareIcon className="size-5 relative" />
                  ) : (
                    <MicIcon className="size-5" />
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
            {SUGGESTIONS.map((s) => (
              <Suggestion
                key={s.prompt}
                onClick={(text) => setInput(text)}
                suggestion={s.prompt}
                className="bg-white/60"
              >
                <s.icon className="mr-1 text-rf-green-deep" />
                {s.prompt}
              </Suggestion>
            ))}
          </Suggestions>
        ) : null}
      </section>
    </div>
  );
}
