"use client";

import { Response } from "@/components/ai-elements/response";
import { supabase } from "@/lib/supabase-client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
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
import { string } from "zod";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { CircleArrowOutUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FaTasks, FaChartLine, FaLightbulb, FaHeart } from "react-icons/fa";
export default function Chat() {
  const suggestions = [
    { icon: FaTasks, prompt: "What are my tasks?" },
    {
      icon: FaLightbulb,
      prompt: "Can you explain me about how can I implement Eisenhover matrix?",
    },
    { icon: FaChartLine, prompt: "show me this weeks progress" },
    { icon: FaHeart, prompt: "hey can you motivate me with my consistency" },
  ];
  const handleSuggestionClick = (suggestion: string) => {
    console.log("Selected suggestion:", suggestion);
    setInput(suggestion);
  };
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();
  console.log("messages ✅", messages, messages.length);
  return (
    <div className="flex flex-col w-full max-w-3xl py-24 mx-auto stretch">
      <p className="text-[#0d3c26] text-5xl mx-auto mb-8 mt-16 font-serif ">
        How's it going, Faizan?
      </p>
      {messages.map((message) => (
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
                      className="text-[#0d3c26] text-[22px]"
                    >
                      <Response>{part.text}</Response>
                    </MessageContent>
                    {/* <MessageAvatar name={message.role} /> */}
                  </Message>
                </div>
              );
            } else if (part.type.startsWith("tool-")) {
              console.log("---💕", part);
              console.log(part.input);
              
              return (
                <Tool defaultOpen={false} >
                  <ToolHeader
                    type={part.type}
                    state={part.state}
                  />
                  <ToolContent>
                    <ToolInput input={part.input} />
                    <ToolOutput
                      output={<Response>{part.output}</Response>}
                      errorText={part.errorText}
                    />
                  </ToolContent>
                </Tool>
              );
              return (
                //   <Tool>
                //   <ToolHeader type={toolCall.type} state={toolCall.state} />
                //   <ToolContent>
                //     <ToolInput input={toolCall.input} />
                //     {toolCall.state === 'output-available' && (
                //       <ToolOutput errorText={toolCall.errorText} output={toolCall.output} />
                //     )}
                //   </ToolContent>
                // </Tool>
                <pre key={`${message.id}-${i}`}>
                  {JSON.stringify(part, null, 2)}
                </pre>
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
          `fixed bottom-0 transition-all duration-150 animate-in`,
          messages.length == 0 && "static"
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage({ text: input });
            setInput("");
          }}
          className="relative flex items-center mx-auto justify-between bg-white dark:bg-zinc-900  w-full max-w-2xl px-4  p-1 pr-1 mb-4 border border-zinc-300 dark:border-zinc-800 rounded-full shadow-xl"
        >
          <input
            className="w-full text-[16px] active:outline-0 focus:outline-0"
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
          />
          <Button
            variant={input.length > 0 ? "default" : "ghost"}
            size={"icon"}
            className="rounded-full"
          >
            <FaArrowUp size={68} />
          </Button>
        </form>
        {messages.length == 0 && (
          <Suggestions className="flex flex-wrap max-w-2xl w-[90%] items-center justify-center mx-auto">
            {suggestions.map((suggestion, i) => {
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
