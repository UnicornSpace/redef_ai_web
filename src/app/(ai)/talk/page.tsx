"use client";

import { Response } from "@/components/ai-elements/response";
import { supabase } from "@/lib/supabase-client";
import { useChat } from "@ai-sdk/react";
import { SetStateAction, useEffect, useState } from "react";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message";
import { FaArrowUp } from "react-icons/fa6";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
  ToolInput,
} from "@/components/ai-elements/tool";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FaTasks,
  FaChartLine,
  FaCalendar,
  FaCheckCircle,
  FaBullseye,
} from "react-icons/fa";
import { createClient } from "@/lib/client";
import { JwtPayload } from "@supabase/supabase-js";
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
export default function Chat() {
  const [user, setUser] = useState<JwtPayload | undefined>(undefined);
  const suggestions = [
    { icon: FaTasks, prompt: "What are my tasks for today?" },
    { icon: FaCalendar, prompt: "What's on my calendar this week?" },
    { icon: FaChartLine, prompt: "Show me this week's progress" },
    {
      icon: FaBullseye,
      prompt: "What should I focus on today?",
    },
    { icon: FaCheckCircle, prompt: "How are my habits tracking?" },
  ];
  const handleSuggestionClick = (suggestion: string) => {
    console.log("Selected suggestion:", suggestion);
    setInput(suggestion);
  };
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();
  console.log("messages ✅", messages, messages.length);
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getClaims();
      console.log("data", data);
      console.log("error", error);
      if (data) {
        setUser(data.claims as JwtPayload);
      }
    })();
  }, []);
  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar();
  console.log("user", user);
  return (
    <div className="flex flex-col w-full max-w-3xl pt-4 md:pt-24 py-24 px-4  mx-auto stretch">
      {/* <SidebarInset className="bg-[#F7F5F3]"> */}
      <header className="flex  h-12 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        {/* <SidebarTrigger className="-ml-1" /> */}
        <Image src={"/logo.png"} height={48} width={48} alt="" />
        <SidebarTrigger className="-ml-1" />
      </header>
      {/* </SidebarInset> */}
      <p className="text-[#0d3c26] text-3xl md:text-5xl mx-auto text-center mb-8 mt-28 font-serif ">
        How's it going, {user?.email.split("@")[0]}?
      </p>
      {messages.map((message, i) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {/* {message.role === 'user' ? '👤User: ' : 'AI: '} */}
          {message.role === "user" && <div></div>}
          {message.parts.map((part, i) => {
            console.log("part", part);
            if (part.type === "text") {
              return (
                <div key={`${message.id}-${i}`}>
                  <Message
                    className="font-serif "
                    from={message.role}
                    key={message.id}
                  >
                    <MessageContent
                      variant={"flat"}
                      className="text-[#0d3c26] text-lg md:text-[22px]"
                    >
                      <Response>{part.text}</Response>
                    </MessageContent>
                    {/* <MessageAvatar name={message.role} /> */}
                  </Message>
                </div>
              );
            } else if (part.type.startsWith("tool-")) {
              console.log("---💕", part);
              const toolPart = part as {
                type: string;
                state?: string;
                input?: unknown;
                output?: unknown;
                errorText?: string;
              };
              console.log(toolPart.input);

              return (
                <Tool defaultOpen={false} key={i}>
                  <ToolHeader
                    type={toolPart.type as `tool-${string}`}
                    state={
                      (toolPart.state as
                        | "input-streaming"
                        | "input-available"
                        | "output-available"
                        | "output-error") || "input-available"
                    }
                  />
                  <ToolContent>
                    {toolPart.input != null && (
                      <ToolInput input={toolPart.input as any} />
                    )}
                    {(toolPart.output != null ||
                      toolPart.errorText != null) && (
                      <ToolOutput
                        output={
                          toolPart.output != null ? (
                            <Response>{String(toolPart.output)}</Response>
                          ) : undefined
                        }
                        errorText={toolPart.errorText}
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }
          })}
        </div>
      ))}

      {/* {messages.map(({ content, ...message }) => (
        <Message from={message.role} key={message.id}>
          <MessageContent>{"content"}</MessageContent>
          <MessageAvatar name={message.role} />
        </Message>
        ))} */}
      <section
        className={cn(
          `fixed bottom-0 re transition-all duration-150 animate-in`,
          messages.length == 0 && "static"
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage({ text: input });
            setInput("");
          }}
          className="relative flex items-center mx-auto justify-between bg-white dark:bg-zinc-900  w-full max-w-2xl px-4 min-w-96 md:min-w-2xl lg:min-w-3xl p-1 pr-1 mb-4 border border-zinc-300 dark:border-zinc-800 rounded-full shadow-xl"
        >
          <input
            className="w-full text-[16px] active:outline-0 focus:outline-0"
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
          />
          <Button
            variant={input.length > 0 ? "primaryGradient" : "ghost"}
            size={"icon"}
            className="relative overflow-hidden px-2"
          >
            <FaArrowUp size={68} />
          </Button>
          {/* <Button variant="primaryGradient" className="relative overflow-hidden">
            <span className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
            <span className="relative z-10">Start for free</span>
          </Button> */}
          <div className="absolute top-[232px] sm:top-[248px] md:top-[264px] lg:-top-[300px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
            <img
              src="/mask-group-pattern.svg"
              alt=""
              className="w-[936px] sm:w-[1404px] md:w-[2106px] lg:w-[2808px] h-auto opacity-30 sm:opacity-40 md:opacity-50 mix-blend-multiply"
              style={{
                filter: "hue-rotate(15deg) saturate(0.7) brightness(1.2)",
              }}
            />
          </div>
        </form>
        {messages.length == 0 && (
          <Suggestions className="flex flex-wrap  md:max-w-2xl w-[90%] items-center justify-center mx-auto">
            {suggestions.map((suggestion, i) => {
              if (isMobile && i == 2) return null;
              const Icon = suggestion.icon;
              return (
                <Suggestion
                  key={i}
                  onClick={handleSuggestionClick}
                  suggestion={suggestion.prompt}
                  className="bg-white/50"
                >
                  {Icon && <Icon className={`mr-1 text-green-950`} />}
                  {suggestion.prompt}
                </Suggestion>
              );
            })}
          </Suggestions>
        )}
      </section>
    </div>
  );
}
