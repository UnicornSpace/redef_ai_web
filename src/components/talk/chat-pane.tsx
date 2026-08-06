"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart, type UIMessage } from "ai";
import { Loader2Icon, MicIcon, SquareIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  FaBullseye,
  FaCalendar,
  FaChartLine,
  FaCheckCircle,
  FaTasks,
} from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa6";
import { useSetNavHidden } from "@/components/app-shell/mobile-fab-context";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: FaTasks, prompt: "What are my tasks for today?" },
  { icon: FaCalendar, prompt: "What's on my calendar this week?" },
  { icon: FaChartLine, prompt: "Show me this week's progress" },
  { icon: FaBullseye, prompt: "What should I focus on today?" },
  { icon: FaCheckCircle, prompt: "How are my habits tracking?" },
];

export function ChatPane({
  chatId,
  initialMessages,
  greeting,
  autoSendVoice,
}: {
  chatId: string;
  initialMessages: UIMessage[];
  greeting: string;
  autoSendVoice: boolean;
}) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { messages, sendMessage } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId },
    }),
  });

  useSetNavHidden(messages.length > 0);

  async function handleMicClick() {
    if (isRecording) {
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
        if (blob.size === 0) return;
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
    } catch {
      // mic permission denied or unavailable — silently no-op, the text
      // input is always still there as a fallback
    }
  }

  return (
    <div className="flex w-full flex-col px-4 pt-8 pb-28 md:pt-16">
      {messages.length === 0 ? (
        <p className="mx-auto mt-16 mb-8 text-center text-3xl font-extrabold text-ink md:mt-24 md:text-5xl">
          {greeting}
        </p>
      ) : null}

      {messages.map((message, i) => (
        <div key={i} className="whitespace-pre-wrap">
          {message.parts.map((part, i) => {
            if (part.type === "text") {
              return (
                <Message key={`${message.id}-${i}`} from={message.role}>
                  <MessageContent
                    variant="flat"
                    className="text-base text-ink md:text-lg"
                  >
                    <Response>{part.text}</Response>
                  </MessageContent>
                </Message>
              );
            }
            if (part.type.startsWith("tool-")) {
              const toolPart = part as ToolUIPart;
              return (
                <Tool defaultOpen={false} key={`${message.id}-${i}`}>
                  <ToolHeader type={toolPart.type} state={toolPart.state} />
                  <ToolContent>
                    {toolPart.input != null ? (
                      <ToolInput input={toolPart.input} />
                    ) : null}
                    {toolPart.output != null || toolPart.errorText != null ? (
                      <ToolOutput
                        output={
                          toolPart.output != null ? (
                            <Response>{String(toolPart.output)}</Response>
                          ) : undefined
                        }
                        errorText={toolPart.errorText}
                      />
                    ) : null}
                  </ToolContent>
                </Tool>
              );
            }
            return null;
          })}
        </div>
      ))}

      <section
        className={cn(
          "fixed inset-x-0 bottom-0 transition-all duration-150",
          messages.length === 0 && "static",
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            sendMessage({ text: input });
            setInput("");
          }}
          className="relative mx-auto mb-4 flex w-full max-w-2xl min-w-0 items-center justify-between rounded-full border border-line bg-white px-4 py-2 shadow-xl md:px-3 md:py-1"
        >
          <input
            className="w-full text-lg outline-none md:text-base"
            value={input}
            placeholder={
              isRecording
                ? "Listening..."
                : isTranscribing
                  ? "Transcribing..."
                  : "Say something..."
            }
            disabled={isRecording || isTranscribing}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            type="button"
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            className="size-11 shrink-0 md:size-9"
            disabled={isTranscribing}
            onClick={handleMicClick}
            aria-label={isRecording ? "Stop recording" : "Record a voice note"}
          >
            {isTranscribing ? (
              <Loader2Icon size={18} className="animate-spin md:size-4" />
            ) : isRecording ? (
              <SquareIcon size={18} className="md:size-4" />
            ) : (
              <MicIcon size={18} className="md:size-4" />
            )}
          </Button>
          <Button
            type="submit"
            variant={input.trim().length > 0 ? "default" : "ghost"}
            size="icon"
            className="size-11 shrink-0 md:size-9"
            disabled={!input.trim() || isRecording || isTranscribing}
          >
            <FaArrowUp size={18} className="md:size-4" />
          </Button>
        </form>
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
