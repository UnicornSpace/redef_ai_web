"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import type { DayNote, DayNoteSource } from "@/lib/types/day-notes";

/**
 * Day notes — the free-text "what actually happened" for a calendar day.
 * See src/migrations/20260911090000_day_notes.sql for why there is exactly
 * one row per (user, date).
 */

const MAX_LENGTH = 4000;

function rowToNote(row: {
  id: string;
  user_id: string;
  note_date: string;
  content: string;
  source: string;
  created_at: string;
  updated_at: string;
}): DayNote {
  return {
    id: row.id,
    userId: row.user_id,
    noteDate: row.note_date,
    content: row.content,
    source: (row.source === "ai" ? "ai" : "manual") as DayNoteSource,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Notes for an inclusive date window, keyed by YYYY-MM-DD. */
export async function listDayNotes(
  startDate: string,
  endDate: string,
): Promise<Record<string, DayNote>> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return {};

  const { data, error } = await supabase
    .from("day_notes")
    .select("*")
    .eq("user_id", user.user.id)
    .gte("note_date", startDate)
    .lte("note_date", endDate);
  if (error) {
    console.error("[listDayNotes]", error);
    return {};
  }

  const byDate: Record<string, DayNote> = {};
  for (const row of data ?? []) {
    const note = rowToNote(row);
    byDate[note.noteDate] = note;
  }
  return byDate;
}

export async function getDayNote(noteDate: string): Promise<DayNote | null> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return null;

  const { data, error } = await supabase
    .from("day_notes")
    .select("*")
    .eq("user_id", user.user.id)
    .eq("note_date", noteDate)
    .maybeSingle();
  if (error || !data) return null;
  return rowToNote(data);
}

/**
 * Create or replace the note for a day.
 *
 * Empty content deletes the row instead of storing a blank one — an empty
 * note is indistinguishable from no note to every reader, and keeping it
 * would light up the calendar's "has a note" marker on a day with nothing
 * in it.
 */
export async function saveDayNote(
  noteDate: string,
  content: string,
  source: DayNoteSource = "manual",
): Promise<{ error?: string; note?: DayNote | null }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const trimmed = content.trim().slice(0, MAX_LENGTH);

  if (!trimmed) {
    const { error } = await supabase
      .from("day_notes")
      .delete()
      .eq("user_id", user.user.id)
      .eq("note_date", noteDate);
    if (error) return { error: error.message };
    revalidatePath("/app/calendar");
    return { note: null };
  }

  const { data, error } = await supabase
    .from("day_notes")
    .upsert(
      {
        user_id: user.user.id,
        note_date: noteDate,
        content: trimmed,
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,note_date" },
    )
    .select("*")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/app/calendar");
  return { note: rowToNote(data) };
}

/**
 * Add a line to a day's note, keeping whatever is already there.
 *
 * This is what the assistant calls. Overwriting would mean "tell the AI
 * two things about today" silently discards the first, so appending is the
 * only safe default for a non-interactive writer.
 */
export async function appendDayNote(
  noteDate: string,
  addition: string,
  source: DayNoteSource = "ai",
): Promise<{ error?: string; note?: DayNote | null }> {
  const trimmed = addition.trim();
  if (!trimmed) return { error: "Nothing to add" };

  const existing = await getDayNote(noteDate);
  const merged = existing?.content
    ? `${existing.content}\n${trimmed}`
    : trimmed;
  return saveDayNote(noteDate, merged, source);
}
