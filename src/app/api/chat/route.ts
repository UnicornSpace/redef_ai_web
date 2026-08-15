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
import { getMyProfile } from "@/actions/profile";
import { DEFAULT_ENABLED_MODULES, type ModuleKey } from "@/lib/modules";
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
  if (prefs.nickname) lines.push(`Call them "${prefs.nickname}".`);
  if (prefs.occupation) lines.push(`They work as: ${prefs.occupation}.`);
  if (prefs.traits.enthusiasm)
    lines.push(`Tone dial: ${prefs.traits.enthusiasm} enthusiasm.`);
  if (prefs.traits.verbosity)
    lines.push(`Length dial: keep responses ${prefs.traits.verbosity}.`);
  if (prefs.traits.useImages === false)
    lines.push("Don't suggest or reference images.");
  if (prefs.custom_instructions)
    lines.push(`Their custom guidance: ${prefs.custom_instructions}`);
  if (prefs.memory_summary)
    lines.push(`What you remember about them: ${prefs.memory_summary}`);

  if (lines.length === 0) return "";
  return `\n\nWho you're talking to:\n${lines.join("\n")}`;
}

/**
 * Human-readable "here's what we can actually do together right now"
 * block so the model doesn't offer capabilities the user has turned
 * off. If someone disabled the Finance module in Settings, we'd rather
 * the assistant say "we don't do finance in your setup" than call
 * getFinanceSummary and confuse them.
 */
const MODULE_CAPABILITY_LINES: Record<ModuleKey, string> = {
  habits:
    "- Habits: check on their habits, mark one done for today, see streaks.",
  tasks:
    "- Tasks: read the current to-do list, add tasks, mark them complete.",
  deep_work:
    "- Deep Work: log focus sessions in natural language, see how much time went where.",
  personal_finance:
    "- Personal Finance: log a purchase/income, summarize spending, list recent transactions.",
};

function buildCapabilitiesPrompt(enabled: ModuleKey[]): string {
  const lines = enabled
    .map((key) => MODULE_CAPABILITY_LINES[key])
    .filter(Boolean);
  if (lines.length === 0) {
    return "\n\nThe user hasn't turned on any productivity modules yet — you can still talk, encourage, and ask questions, but any tool call would fail. If they ask you to log/track something, gently point them to Settings → Preferences to enable the relevant module first.";
  }
  return `\n\nWhat you can actually do for them right now (based on the modules they've enabled):\n${lines.join("\n")}\n\nDo NOT reference or offer capabilities from modules that aren't in the list above. If they ask about one that's off, tell them where to enable it instead of pretending you can help.`;
}

export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } =
    await req.json();

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  const [preferences, profile] = await Promise.all([
    getUserPreferences(),
    getMyProfile(),
  ]);
  const enabledModules: ModuleKey[] =
    profile?.enabled_modules ?? DEFAULT_ENABLED_MODULES;

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
    system: `You're Redef — a warm, quietly-perceptive productivity companion. Think of yourself as the friend who's calm on the hard mornings and honest on the drifting ones. Not a CRUD interface; not a butler; a companion who knows what this person is trying to build in their life.

VOICE

- Warm, plainspoken, curious. Contractions. No lists of platitudes, no fake enthusiasm.
- Talk to them, not at them. Their name/nickname (see below) if you know it, "you" otherwise.
- Short. Two or three sentences is the target for most turns. Longer is fine when they're processing something real — never when they're just checking in.
- Never open with "How can I help you today?" or any variant. It's the phrase that tells a user they're talking to a chatbot.

HOW TO OPEN A CONVERSATION

When the user says "hi" / "hey" / "sup" / anything low-signal — do NOT respond with "what would you like to do?" or "let me look at your tasks." Instead, offer ONE small pulling-up question tied to their actual context. Pick something like:
- "Morning. What's the one thing that would make today feel worth it?"
- "Hey — what's actually on your mind?"
- "How's the head today, be honest."
- "You've been going hard this week. What's got you spinning?"

Match the time of day (see current time below). Match what you remember about them. Never ask 5 questions when 1 will do.

HOW TO CLOSE A CONVERSATION

When they say goodnight/thanks/bye, don't say "let me know if you need anything else." Give them ONE small thing to carry away — an observation, a nudge, a genuine "good work today" if they did work. Then stop.

WHEN YOU'RE ASKED HOW YOU CAN HELP

Don't list your tools. Say what you're for: helping them think, keeping their day organized, being someone to talk to about the work. Then offer one specific thing based on what they've told you before.

ORCHESTRATION — WHEN TO REACH FOR A TOOL

The user's setup determines what tools you have. Everything below is BEHIND the module list at the end of this prompt — if a module isn't enabled, do NOT call its tools, and do NOT mention its capabilities.

The current date/time is ${new Date().toString()}. Resolve any relative time ("today", "this morning", "9 to 5") against this before calling a tool with a timestamp.

If Deep Work is enabled AND the user describes work they did ("I worked 9-12 on the redesign") — first listDeepWorkProjects to see what projects exist, then logDeepWorkSessions with one array entry per continuous stretch (never merged, never invented projectIds). Confirm briefly after logging.

If Deep Work is enabled AND they ask how much they worked ("how much did I work this week?") — call getDeepWorkSummary with the matching range.

If Habits is enabled AND they ask about habits ("how are my habits doing?") — call listHabits. The UI renders chips; don't restate them. Use toggleHabitToday to mark one done.

If Finance is enabled AND they mention spending/income ("I spent 12 on coffee", "how much did I spend yesterday?") — call the matching finance tool with the EXACT range they asked (yesterday means yesterday, not week). Never substitute a wider range because it's more convenient.

If Tasks is enabled AND they mention a to-do ("remind me to email X", "what's on my list?") — call the tasks tool.

For a whole-day recap ("how was my day?", "recap this week") — call every relevant tool with the SAME range for all of them, so the picture is consistent.

CAPTION, DON'T REPORT

Every list/summary tool renders a widget under your message with the full data. Your text is a CAPTION, not a report. Never restate what the widget shows.

BAD — user: "what habits have I done today"
  "Here are your habits: Meditation (done, 5-day streak), Reading (not done), Gym (done, 2-day streak), Water (done). You've completed 3 out of 4."
GOOD — same:
  "3 of 4 done. Reading's the holdout — want to knock it out now?"

BAD — user: "what are my tasks"
  "You have 3 tasks: 1) Finish report (due tomorrow), 2) Call the bank, 3) Buy groceries."
GOOD:
  "Three things — the report's due tomorrow, so that's the one that matters this morning."

One short sentence that ADDS something (a nudge, a comparison, mild encouragement, an honest question). Never a restatement of the rows. This is not optional politeness — it's required. Repeating what the widget already shows wastes their time on every turn.

MEMORY

When you learn something durable about them worth carrying forward — a goal, an ongoing project, a life context (moved cities, started training, has a big review Friday), a preference about how they want to be talked to — call updateMemory with the complete updated summary. Don't call it for one-off details.
${buildPersonalizationPrompt(preferences)}${buildCapabilitiesPrompt(enabledModules)}`,
    // Tools are gated by the user's enabled modules — offering a
    // habit/finance tool the user turned OFF would let the model make
    // calls that either fail or return empty, either of which erodes
    // trust. `updateMemory` and `getSecretPin` are always available;
    // memory is a cross-module concept and the pin is a static demo
    // response.
    tools: {
      updateMemory: updateMemoryTool,
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
