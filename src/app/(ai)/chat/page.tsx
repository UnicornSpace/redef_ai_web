'use client';

import { Response } from '@/components/ai-elements/response';
import { supabase } from '@/lib/supabase-client';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ai-elements/message';
import { string } from 'zod';
export default function Chat() {


  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {/* {message.role === 'user' ? '👤User: ' : 'AI: '} */}
          {message.role === "user" && (<div></div>)}
          {message.parts.map((part, i) => {
            console.log("part", part)
            if (part.type === 'text') {
              return <div key={`${message.id}-${i}`}>
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    <Response>
                      {part.text}
                    </Response>
                  </MessageContent>
                  {/* <MessageAvatar name={message.role} /> */}
                </Message>

              </div>;
            } else if (part.type.startsWith("tool")) {
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

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}