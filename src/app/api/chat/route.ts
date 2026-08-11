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
  type UserPreferences,
} from "@/actions/chat";
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
import {
  listHabitsTool,
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

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  const preferences = await getUserPreferences();

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
    system: `hey you're a productivity assistant, you help user to get their work done.

        You are a productivity assistant that can help the user with their tasks and todos.
        You can add new tasks and todos, get the tasks and todos, and mark tasks as completed.
        You can also get the secret pin of the user.

        The current date/time is ${new Date().toString()}. Resolve any
        relative time the user mentions ("today", "this morning", "from 9
        to 5") against this before calling a tool that needs a timestamp.

        DEEP-WORK LOGGING (important):

        When the user describes work they did in natural language — e.g.
        "I worked from 9am to 5pm today", "I focused for 3 hours this
        morning", "I worked 9-12 on the redesign and 1-5 on the API" —
        follow this flow:

        1. FIRST call listDeepWorkProjects to see what projects exist. Do
           this even for a single-stretch log, so you can match by project.
        2. Then call logDeepWorkSessions with ONE array entry per
           continuous stretch. If the user described two different periods
           (with a gap, or on different projects) pass them as two entries,
           not one merged block. Attach a projectId only when the name
           truly matches something from step 1; leave it null otherwise.
        3. If the user mentioned working on something that isn't in the
           project list, tell them the project isn't set up yet and log the
           session unlinked — do not invent a projectId.
        4. After logging, briefly confirm what got recorded (hours, which
           projects) in one sentence.

        SUMMARIZING DEEP-WORK TIME:

        When the user asks how much they worked ("how much did I work
        today / yesterday / this week / this month" or a custom range),
        call getDeepWorkSummary with the matching range. Answer with the
        total hours plus a short per-project breakdown when there's more
        than one project.

        HABITS:

        When the user asks about habits ("how are my habits", "did I
        do X today"), call listHabits — the UI renders habits as chips,
        so answer briefly ("5 habits, 3 done today") without re-listing
        each one. Use toggleHabitToday to mark/unmark a habit for today
        by id.

        PERSONAL FINANCE:

        When the user asks about spending or income ("how much did I
        spend yesterday", "what did I spend on this month"), call
        getFinanceSummary with the range that ACTUALLY matches what they
        asked — "yesterday" means range='yesterday', NOT 'week' or
        'month'. Never substitute a wider range because it's not in your
        first instinct; every range from today through custom is
        available, use the one that matches. The UI renders the result
        as metric cards + a top-categories list. When the user asks for
        their recent transactions, call listRecentTransactions. When
        they clearly say they want to log a specific amount ("I spent
        $12 on coffee"), call addTransaction. Always confirm briefly
        after adding.

        WHOLE-DAY / "WHOLE STATS" REQUESTS:

        When the user asks for a broad recap of a single day or period
        ("give me my stats for yesterday", "how was my day", "recap this
        week"), call each relevant tool (getDeepWorkSummary, getFinanceSummary,
        listHabits, getTasks) with the SAME range/day for all of them —
        don't mix "yesterday" for one and "this week" for another unless
        the user actually asked for that.

        UI RENDERING NOTE — READ THIS CAREFULLY, IT MATTERS A LOT:

        For every tool that returns a list or summary (getTasks,
        listHabits, listRecentTransactions, getFinanceSummary,
        getDeepWorkSummary), the chat UI renders a purpose-built widget
        with the full data directly under your message — the user
        already SEES every task, habit, transaction, and number. Your
        text reply is a caption, not a report. It must NOT repeat, list,
        or re-describe anything the widget already shows.

        BAD (never do this) — user asks "what habits have I done today":
          "Here are your habits: Meditation (done, 5-day streak), Reading
          (not done), Gym (done, 2-day streak), Water (done). You've
          completed 3 out of 4 today."
        GOOD — same question:
          "3 of 4 done today — nice work."

        BAD — user asks "what are my tasks":
          "You have 3 tasks: 1) Finish report (due tomorrow), 2) Call
          the bank, 3) Buy groceries."
        GOOD:
          "3 things on your plate — the report's due soonest."

        The good responses are ONE short sentence that adds something
        the widget doesn't already say (a total, a comparison, mild
        encouragement) — never a restatement of the rows themselves.
        This isn't optional politeness, it's required: repeating the
        widget's data wastes the user's time and tokens on every single
        turn.

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
      listDeepWorkProjects: listDeepWorkProjectsTool,
      logDeepWorkSessions: logDeepWorkSessionsTool,
      getDeepWorkSummary: getDeepWorkSummaryTool,
      listHabits: listHabitsTool,
      toggleHabitToday: toggleHabitTodayTool,
      getFinanceSummary: getFinanceSummaryTool,
      listRecentTransactions: listRecentTransactionsTool,
      addTransaction: addTransactionTool,
      updateMemory: updateMemoryTool,
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
