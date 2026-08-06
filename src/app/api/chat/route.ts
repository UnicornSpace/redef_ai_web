import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import {
  getUserPreferences,
  saveChatMessages,
  type UserPreferences,
} from "@/actions/chat";
import { logDeepWorkSessionTool } from "@/lib/ai-sdk-tools/deepwork";
import { updateMemoryTool } from "@/lib/ai-sdk-tools/memory";
import { pomodoroHoursTool } from "@/lib/ai-sdk-tools/pomodoro";
import {
  addTasksTool,
  getSecretPinTool,
  getTasksTool,
  markTaskAsCompletedTool,
} from "@/lib/ai-sdk-tools/tasks";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

function buildPersonalizationPrompt(prefs: UserPreferences | null): string {
  if (!prefs) return "";

  const lines: string[] = [];
  if (prefs.nickname) lines.push(`Call the user "${prefs.nickname}".`);
  if (prefs.occupation) lines.push(`The user works as: ${prefs.occupation}.`);
  if (prefs.traits.enthusiasm)
    lines.push(`Be ${prefs.traits.enthusiasm} enthusiasm in tone.`);
  if (prefs.traits.verbosity)
    lines.push(`Keep responses ${prefs.traits.verbosity}.`);
  if (prefs.traits.useImages === false)
    lines.push("Do not suggest or reference images.");
  if (prefs.custom_instructions) lines.push(prefs.custom_instructions);
  if (prefs.memory_summary)
    lines.push(`What you remember about this user: ${prefs.memory_summary}`);

  if (lines.length === 0) return "";
  return `\n\nPersonalization:\n${lines.join("\n")}`;
}

export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } =
    await req.json();

  const preferences = await getUserPreferences();

  const result = streamText({
    model: openai("gpt-4o"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    system: `hey you're a productivity assistant, you help user to get their work done.

        You are a productivity assistant that can help the user with their tasks and todos.
        You can add new tasks and todos, get the tasks and todos, and mark tasks as completed.
        You can also get the secret pin of the user.

        The current date/time is ${new Date().toString()}. Resolve any
        relative time the user mentions ("today", "this morning", "from 9
        to 5") against this before calling a tool that needs a timestamp.

        When the user describes work they did in natural language — e.g. "I
        worked from 9am to 5pm today" or "I focused for 3 hours this
        morning" — call logDeepWorkSession with the resolved start/end
        times to record it as a focus session.

        When you learn something durable about the user worth remembering for
        future conversations (their goals, ongoing projects, context, recurring
        preferences), call updateMemory with the complete updated summary.
        Don't call it for one-off details that don't matter later.
        ${buildPersonalizationPrompt(preferences)}`,
    tools: {
      getTasks: getTasksTool,
      getSecretPin: getSecretPinTool,
      addNewTask: addTasksTool,
      markTaskAsCompleted: markTaskAsCompletedTool,
      pomodoroHours: pomodoroHoursTool, // get the pomodoro hours of the user based on today
      logDeepWorkSession: logDeepWorkSessionTool,
      updateMemory: updateMemoryTool,
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: finalMessages }) => {
      if (chatId) {
        await saveChatMessages(chatId, finalMessages);
      }
    },
  });
}
