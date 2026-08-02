"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart, type UIMessage } from "ai";
import { useState } from "react";
import {
  FaBullseye,
  FaCalendar,
  FaChartLine,
  FaCheckCircle,
  FaTasks,
} from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa6";
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
}: {
  chatId: string;
  initialMessages: UIMessage[];
  greeting: string;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId },
    }),
  });

  return (
    <div className="flex w-full flex-col px-4 pt-8 pb-28 md:pt-16">
      {messages.length === 0 ? (
        <p className="mx-auto mt-16 mb-8 text-center text-3xl font-extrabold text-ink md:mt-24 md:text-5xl">
          {greeting}
        </p>
      ) : null}

      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
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
          className="relative mx-auto mb-4 flex w-full max-w-2xl min-w-0 items-center justify-between rounded-full border border-line bg-white px-3 py-1 shadow-xl"
        >
          <input
            className="w-full text-base outline-none"
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            type="submit"
            variant={input.trim().length > 0 ? "default" : "ghost"}
            size="icon"
            disabled={!input.trim()}
          >
            <FaArrowUp size={16} />
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
