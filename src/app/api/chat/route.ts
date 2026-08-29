// OpenAI — commented out in favor of Amazon Bedrock below, not deleted so
// switching back is a two-line change (this import + the `model:` line in
// streamText further down).
// import { openai } from "@ai-sdk/openai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
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
  listRecentDeepWorkSessionsTool,
  logDeepWorkSessionsTool,
  updateDeepWorkSessionTool,
} from "@/lib/ai-sdk-tools/deepwork";
import {
  addTransactionTool,
  getFinanceSummaryTool,
  listRecentTransactionsTool,
} from "@/lib/ai-sdk-tools/finance";
import { getDayReviewTool } from "@/lib/ai-sdk-tools/day-review";
import {
  createHabitTool,
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

/**
 * By default toUIMessageStreamResponse() sends a generic "An error
 * occurred." to the client for any mid-stream failure — with no feedback
 * at all otherwise, a broken model call (wrong Bedrock model id, missing
 * AWS credentials, model access not enabled, throttling) looked exactly
 * like the assistant silently doing nothing. The real error message is
 * safe to show here (this only ever reaches the authenticated owner of
 * this chat, the same trust boundary as the realtime voice error surfaces
 * on the other side of this feature), and is what makes the failure
 * something the user can actually act on instead of just re-typing the
 * same message into the void.
 */
function formatChatError(error: unknown): string {
  // Logged server-side too — the client only gets the message text, not
  // the stack/cause, and this is the one place a Bedrock misconfiguration
  // (bad model id, no model access, missing credentials) would otherwise
  // go completely unlogged.
  console.error("[chat] streamText error:", error);
  const message = error instanceof Error ? error.message : String(error);
  return message ? message.slice(0, 400) : "Something went wrong generating a response.";
}

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
    // Was openai.chat("gpt-4o") — see the commented-out import above for
    // why the stateless Chat Completions API specifically was used. Now on
    // Amazon Bedrock instead; Bedrock's models are stateless per-request
    // the same way, so that concern doesn't apply here. Needs
    // AWS_REGION/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY in the
    // environment (the provider reads them itself, same as the AWS SDK's
    // default credential chain), and this exact model must be switched on
    // under "Model access" in the Bedrock console for that region before
    // it'll respond — swap the id below for any other Bedrock model
    // without touching anything else in this file.
    // model: bedrock("us.anthropic.claude-sonnet-4-5-20250929-v1:0"),
    model: bedrock("us.amazon.nova-pro-v1:0"),
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
            listRecentDeepWorkSessions: listRecentDeepWorkSessionsTool,
            updateDeepWorkSession: updateDeepWorkSessionTool,
          }
        : {}),
      ...(enabledModules.includes("habits")
        ? {
            listHabits: listHabitsTool,
            toggleHabitToday: toggleHabitTodayTool,
            toggleHabitChecklistItem: toggleHabitChecklistItemTool,
            logHabitNumber: logHabitNumberTool,
            createHabit: createHabitTool,
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
    // Without this, a failed model call reached the client as a bare
    // generic error with no detail at all — see formatChatError above.
    onError: formatChatError,
    onFinish: async ({ messages: finalMessages }) => {
      if (chatId) {
        await saveChatMessages(chatId, finalMessages);
      }
    },
  });
}
