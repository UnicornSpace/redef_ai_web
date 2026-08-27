import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import {
  getUserPreferences,
  recordChatUsage,
  saveChatMessages,
} from "@/actions/chat";
import { getMyProfile } from "@/actions/profile";
import { getMyStandards } from "@/actions/standards";
import { getUserBaseline } from "@/lib/baseline";
import { buildSystemPrompt } from "@/lib/chat-prompt";
import { DEFAULT_ENABLED_MODULES, type ModuleKey } from "@/lib/modules";
import { updateWorkStandardsTool } from "@/lib/ai-sdk-tools/standards";
import {
  getDeepWorkSummaryTool,
  listDeepWorkProjectsTool,
  logDeepWorkSessionsTool,
} from "@/lib/ai-sdk-tools/deepwork";
import {
  addTransactionTool,
  getFinanceSummaryTool,
  listRecentTransactionsTool,
} from "@/lib/ai-sdk-tools/finance";
import { getDayReviewTool } from "@/lib/ai-sdk-tools/day-review";
import {
  listHabitsTool,
  logHabitNumberTool,
  toggleHabitChecklistItemTool,
  toggleHabitTodayTool,
} from "@/lib/ai-sdk-tools/habits";
import { updateMemoryTool } from "@/lib/ai-sdk-tools/memory";
import {
  addTasksTool,
  getSecretPinTool,
  getTasksTool,
  markTaskAsCompletedTool,
} from "@/lib/ai-sdk-tools/tasks";
import { createClient } from "@/lib/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } =
    await req.json();

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  const [preferences, profile, standards] = await Promise.all([
    getUserPreferences(),
    getMyProfile(),
    getMyStandards(),
  ]);
  const enabledModules: ModuleKey[] =
    profile?.enabled_modules ?? DEFAULT_ENABLED_MODULES;

  // Measured behavior, so the model can answer "have I done enough?"
  // against this person's own numbers instead of a generic 8-hour day.
  // Needs userId, so it can't join the Promise.all above.
  const baseline = userId
    ? await getUserBaseline(supabase, userId, enabledModules)
    : null;

  const result = streamText({
    // openai("gpt-4o") defaults to OpenAI's Responses API (stateful — it
    // references stored `msg_...` items server-side). Our chat history
    // is stored in Supabase and replayed from there, so those ids don't
    // exist on OpenAI's side across environments/orgs and the API
    // returns "Item not found." `openai.chat(...)` uses the stateless
    // Chat Completions API which is what this app was on before the
    // ai@7 upgrade, and it works cross-environment.
    model: openai.chat("gpt-4o"),
    // convertToModelMessages became async in ai@7 — used to return
    // ModelMessage[] directly, now returns Promise<ModelMessage[]>.
    messages: await convertToModelMessages(messages),
    // Bumped from 5 → 8 so a full deep-work flow (list projects → log a
    // batch of sessions → summarize back to the user) fits in one turn.
    stopWhen: stepCountIs(8),
    onFinish: async ({ totalUsage }) => {
      if (chatId && userId) {
        await recordChatUsage(chatId, userId, {
          inputTokens: totalUsage.inputTokens ?? 0,
          outputTokens: totalUsage.outputTokens ?? 0,
        });
      }
    },
    system: buildSystemPrompt({
      preferences,
      enabledModules,
      mode: "text",
      baseline,
      standards,
    }),
    // Tools are gated by the user's enabled modules — offering a
    // habit/finance tool the user turned OFF would let the model make
    // calls that either fail or return empty, either of which erodes
    // trust. `updateMemory` and `getSecretPin` are always available;
    // memory is a cross-module concept and the pin is a static demo
    // response.
    tools: {
      updateMemory: updateMemoryTool,
      updateWorkStandards: updateWorkStandardsTool,
      // Spans every module and gates itself internally on what's enabled,
      // so it's registered unconditionally rather than per-module.
      getDayReview: getDayReviewTool,
      getSecretPin: getSecretPinTool,
      ...(enabledModules.includes("tasks")
        ? {
            getTasks: getTasksTool,
            addNewTask: addTasksTool,
            markTaskAsCompleted: markTaskAsCompletedTool,
          }
        : {}),
      ...(enabledModules.includes("deep_work")
        ? {
            listDeepWorkProjects: listDeepWorkProjectsTool,
            logDeepWorkSessions: logDeepWorkSessionsTool,
            getDeepWorkSummary: getDeepWorkSummaryTool,
          }
        : {}),
      ...(enabledModules.includes("habits")
        ? {
            listHabits: listHabitsTool,
            toggleHabitToday: toggleHabitTodayTool,
            toggleHabitChecklistItem: toggleHabitChecklistItemTool,
            logHabitNumber: logHabitNumberTool,
          }
        : {}),
      ...(enabledModules.includes("personal_finance")
        ? {
            getFinanceSummary: getFinanceSummaryTool,
            listRecentTransactions: listRecentTransactionsTool,
            addTransaction: addTransactionTool,
          }
        : {}),
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    // gpt-4o never emits reasoning parts, so this is a no-op today — but
    // the chat UI already renders a Reasoning block if one shows up, so
    // switching to a reasoning-capable model later needs no other change.
    sendReasoning: true,
    onFinish: async ({ messages: finalMessages }) => {
      if (chatId) {
        await saveChatMessages(chatId, finalMessages);
      }
    },
  });
}
