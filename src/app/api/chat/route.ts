import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai';
import { createClient } from '@/lib/server';
import { addTasksTool, getSecretPinTool, getTasksTool, markTaskAsCompletedTool } from '@/ai-sdk-tools/tasks';
import { pomodoroHoursTool } from '@/ai-sdk-tools/pomodoro';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    
    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log("messages", messages)
    // console.log(req)
    const result = streamText({
        model: openai('gpt-4o'),
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        system: `hey you're a productivity assistant, you help user to get their work done.
        
        You are a productivity assistant that can help the user with their tasks and todos.
        You can add new tasks and todos, get the tasks and todos, and mark tasks as completed.
        You can also get the secret pin of the user.
        `,
        tools: {
            getTasks: getTasksTool,
            getSecretPin: getSecretPinTool,
            addNewTask: addTasksTool,
            markTaskAsCompleted: markTaskAsCompletedTool,
            pomodoroHours: pomodoroHoursTool, // get the pomodoro hours of the user based on today
            // getHabits: getHabitsTool, // get the habits of the user based on today,
            // getProgressSummary: getProgressSummaryTool, // get the progress summary of the user based on today,

        },

    });

    return result.toUIMessageStreamResponse();
}

