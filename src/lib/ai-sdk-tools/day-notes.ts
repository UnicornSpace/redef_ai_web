import { tool } from "ai";
import z from "zod";
import { createClient } from "@/lib/server";

/**
 * Day-note tools — how the assistant records "what happened today" for
 * things none of the structured modules cover.
 *
 * Deliberately append-first: the user telling the assistant a second thing
 * about the same day must not silently erase the first. Replacing is
 * possible but has to be asked for.
 */

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MAX_LENGTH = 4000;

export const saveDayNoteTool = tool({
  description:
    "Record something that happened on a given day — events, feelings, " +
    "people, anything that is not a habit, task, deep-work session or " +
    "transaction. The user sees this on that day in their calendar. Write " +
    "a short third-person-free summary in the user's own words, e.g. " +
    '"Sister visited, finally sorted the car out." Defaults to appending ' +
    "to whatever is already on that day; only use mode='replace' if the " +
    "user explicitly wants to rewrite the note.",
  inputSchema: z.object({
    text: z
      .string()
      .min(1)
      .describe("The summary to store. One or two sentences."),
    date: z.string().optional().describe("YYYY-MM-DD. Omit for today."),
    mode: z
      .enum(["append", "replace"])
      .optional()
      .describe("Defaults to append. Use replace only when asked to."),
  }),
  execute: async ({ text, date, mode }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const noteDate = date ?? todayKey();
    const addition = text.trim();
    if (!addition) return { error: "Nothing to record" };

    // Read-modify-write rather than a DB-side concatenation: the note is a
    // single text column and these writes are one-at-a-time from a single
    // user's chat, so the race window isn't worth a stored procedure.
    let content = addition;
    if (mode !== "replace") {
      const { data: existing } = await supabase
        .from("day_notes")
        .select("content")
        .eq("user_id", user.user.id)
        .eq("note_date", noteDate)
        .maybeSingle();
      const prior = (existing?.content as string | undefined)?.trim();
      if (prior) content = `${prior}\n${addition}`;
    }
    content = content.slice(0, MAX_LENGTH);

    const { error } = await supabase.from("day_notes").upsert(
      {
        user_id: user.user.id,
        note_date: noteDate,
        content,
        source: "ai",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,note_date" },
    );
    if (error) return { error: error.message };

    return { data: { date: noteDate, content, added: addition } };
  },
});

export const getDayNoteTool = tool({
  description:
    "Read back what the user recorded about a day — use this when they " +
    "ask what happened on a date, or before answering questions about " +
    "their week that the structured modules would not know.",
  inputSchema: z.object({
    date: z.string().optional().describe("YYYY-MM-DD. Omit for today."),
  }),
  execute: async ({ date }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }
    const noteDate = date ?? todayKey();
    const { data, error } = await supabase
      .from("day_notes")
      .select("content, source, updated_at")
      .eq("user_id", user.user.id)
      .eq("note_date", noteDate)
      .maybeSingle();
    if (error) return { error: error.message };

    return {
      data: {
        date: noteDate,
        content: (data?.content as string | undefined) ?? null,
        source: (data?.source as string | undefined) ?? null,
      },
    };
  },
});
