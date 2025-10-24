import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai';
import { createClient } from '@/lib/server';
import { addTasksTool, getSecretPinTool, getTasksTool, markTaskAsCompletedTool } from '@/ai-sdk-tools/tasks';
import { NextResponse } from 'next/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const body = await req.json()
    console.log("body", body)
    // const { messages }: { messages: UIMessage[] } = await req.json();
    // req.body.
    // console.log("messages", messages)
    // console.log(req)
    const result = streamText({
        model: openai('gpt-4o'),
        messages: convertToModelMessages(body.messages),
        stopWhen: stepCountIs(5),
        system: `hey you're a productivity assitent, you help user to get their work done.`,
        tools: {
            getTasks: getTasksTool,
            getSecretPin: getSecretPinTool,
            addNewTask: addTasksTool,
            markTaskAsCompleted: markTaskAsCompletedTool,
        },

    });

    return result.toUIMessageStreamResponse({
        onFinish: async ({ messages, isAborted }) => {
            // Save or log messages if needed
            console.log('Stream finished', { isAborted, messages });
        },
    });
    // console.log(result.toUIMessageStreamResponse())
    // return NextResponse.json({ status: "ok" })
    // return result.toUIMessageStreamResponse();
    // Return the streamed response
    return result.toTextStreamResponse();
}

