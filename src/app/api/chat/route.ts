import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai';
import { createClient } from '@/lib/server';
import { addTasksTool, getSecretPinTool, getTasksTool, markTaskAsCompletedTool } from '@/ai-sdk-tools/tasks';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    
    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log("messages", messages)
    console.log(req)
    const result = streamText({
        model: openai('gpt-4o'),
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        system: `hey you're a productivity assitent, you help user to get their work done.`,
        tools: {
            getTasks: getTasksTool,
            getSecretPin: getSecretPinTool,
            addNewTask: addTasksTool,
            markTaskAsCompleted: markTaskAsCompletedTool,
        },

    });

    return result.toUIMessageStreamResponse();
}

