import { createClient } from "@/lib/server";
import { tool } from "ai";
import z from "zod";

/**
 * Habit tools for AI Talk. Structured outputs — the chat pane renders
 * habits as chips (name + a "done today" pill), not as a JSON dump.
 *
 * Every write tool takes an explicit `date`, defaulting to today. That's
 * deliberate: the earlier today-only versions made "I forgot to tick
 * yesterday's run" impossible to fix by voice, which is exactly the kind
 * of thing people want to say during an end-of-day wrap-up. The
 * `chk_completion_not_future` DB constraint was dropped back in migration
 * 20260814, so past dates write cleanly; future dates are rejected here
 * in the tool instead.
 */

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Shared guard: valid shape, and never in the future. */
function normalizeDate(date?: string | null): { date: string } | { error: string } {
  const value = date?.trim() || todayIso();
  if (!DATE_PATTERN.test(value)) {
    return { error: `Invalid date "${value}" — use YYYY-MM-DD.` };
  }
  if (value > todayIso()) {
    return { error: "Can't log a habit for a future date." };
  }
  return { date: value };
}

function streakFrom(completed: Set<string>, today: string): number {
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00`);
  if (!completed.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    if (!completed.has(`${y}-${m}-${d}`)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const listHabitsTool = tool({
  description:
    "List the user's habits with completion status for a given date " +
    "(defaults to today) and current streak. Also returns each habit's " +
    "TYPE and, for checklist habits, its sub-items with their ids — you " +
    "need those ids to tick individual items. Renders as a habit chip " +
    "grid, so don't re-list them in prose; summarize (e.g. \"5 habits, 3 " +
    "done\") and let the UI show detail.",
  inputSchema: z.object({
    date: z
      .string()
      .nullable()
      .optional()
      .describe("YYYY-MM-DD to check. Omit for today."),
  }),
  execute: async ({ date }) => {
    const normalized = normalizeDate(date);
    if ("error" in normalized) return { error: normalized.error };
    const target = normalized.date;

    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const { data, error } = await supabase
      .from("habits")
      .select(
        "id, name, category, completed_dates, created_at, type, goal_number, goal_unit, goal_comparator",
      )
      .eq("user_id", user.user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    if (error) return { error: error.message };

    const habitRows = data ?? [];
    const habitIds = habitRows.map((h) => h.id as string);

    // Checklist sub-items + that date's per-item / numeric state. Fetched
    // for all habits at once rather than per-habit — the model often asks
    // about everything in one breath during a day wrap-up.
    const [itemsRes, completionsRes] = await Promise.all([
      habitIds.length > 0
        ? supabase
            .from("habit_checklist_items")
            .select("id, habit_id, name, is_optional, order_index")
            .in("habit_id", habitIds)
            .eq("is_deleted", false)
            .order("order_index", { ascending: true })
        : Promise.resolve({ data: [] }),
      habitIds.length > 0
        ? supabase
            .from("habit_completions")
            .select("habit_id, completed_item_ids, numeric_value")
            .in("habit_id", habitIds)
            .eq("user_id", user.user.id)
            .eq("completion_date", target)
        : Promise.resolve({ data: [] }),
    ]);

    const itemsByHabit = new Map<
      string,
      { id: string; name: string; isOptional: boolean }[]
    >();
    for (const item of (itemsRes.data ?? []) as {
      id: string;
      habit_id: string;
      name: string;
      is_optional: boolean;
    }[]) {
      const list = itemsByHabit.get(item.habit_id) ?? [];
      list.push({ id: item.id, name: item.name, isOptional: item.is_optional });
      itemsByHabit.set(item.habit_id, list);
    }

    const completionByHabit = new Map<
      string,
      { completedItemIds: string[]; numericValue: number | null }
    >();
    for (const row of (completionsRes.data ?? []) as {
      habit_id: string;
      completed_item_ids: string[] | null;
      numeric_value: number | null;
    }[]) {
      completionByHabit.set(row.habit_id, {
        completedItemIds: row.completed_item_ids ?? [],
        numericValue: row.numeric_value ?? null,
      });
    }

    const today = todayIso();
    const habits = habitRows.map((h) => {
      const done = new Set((h.completed_dates as string[] | null) ?? []);
      const completion = completionByHabit.get(h.id as string);
      const items = itemsByHabit.get(h.id as string) ?? [];
      return {
        id: h.id as string,
        name: h.name as string,
        category: (h.category as string | null) ?? null,
        type: (h.type as string | null) ?? "boolean",
        doneToday: done.has(target),
        streak: streakFrom(done, today),
        ...(items.length > 0
          ? {
              checklistItems: items.map((i) => ({
                ...i,
                done: (completion?.completedItemIds ?? []).includes(i.id),
              })),
            }
          : {}),
        ...(h.goal_number != null
          ? {
              goal: {
                target: Number(h.goal_number),
                unit: (h.goal_unit as string | null) ?? null,
                comparator: (h.goal_comparator as string | null) ?? "at_least",
                loggedValue: completion?.numericValue ?? null,
              },
            }
          : {}),
      };
    });

    return {
      data: {
        date: target,
        habits,
        count: habits.length,
        doneCount: habits.filter((h) => h.doneToday).length,
      },
    };
  },
});

export const toggleHabitTodayTool = tool({
  description:
    "Mark a habit done, or unmark it, for a given date (defaults to " +
    "today). Works for PAST dates too — use this when the user says they " +
    "forgot to log something yesterday. Use the habit id from listHabits. " +
    "For checklist habits prefer toggleHabitChecklistItem; for number " +
    "habits prefer logHabitNumber.",
  inputSchema: z.object({
    habitId: z.string(),
    date: z
      .string()
      .nullable()
      .optional()
      .describe("YYYY-MM-DD. Omit for today."),
  }),
  execute: async ({ habitId, date }) => {
    const normalized = normalizeDate(date);
    if ("error" in normalized) return { error: normalized.error };
    const target = normalized.date;

    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const { data: habit, error: fetchError } = await supabase
      .from("habits")
      .select("completed_dates, name")
      .eq("id", habitId)
      .eq("user_id", user.user.id)
      .maybeSingle();
    if (fetchError || !habit) {
      return { error: fetchError?.message ?? "Habit not found" };
    }

    const current: string[] = (habit.completed_dates as string[] | null) ?? [];
    const next = current.includes(target)
      ? current.filter((d) => d !== target)
      : [...current, target];

    const { error } = await supabase
      .from("habits")
      .update({ completed_dates: next })
      .eq("id", habitId)
      .eq("user_id", user.user.id);
    if (error) return { error: error.message };

    const marked = next.includes(target);
    return {
      data: `${habit.name}: ${marked ? "marked done" : "unmarked"} for ${target}.`,
    };
  },
});

export const toggleHabitChecklistItemTool = tool({
  description:
    "Tick or untick ONE sub-item of a checklist habit, for a given date " +
    "(defaults to today, past dates allowed). Get habitId and the item's " +
    "id from listHabits — never invent an item id. When every non-optional " +
    "item is ticked the parent habit is marked done automatically, so " +
    "don't also call toggleHabitToday afterwards.",
  inputSchema: z.object({
    habitId: z.string(),
    itemId: z.string().describe("Sub-item id from listHabits.checklistItems"),
    date: z
      .string()
      .nullable()
      .optional()
      .describe("YYYY-MM-DD. Omit for today."),
  }),
  execute: async ({ habitId, itemId, date }) => {
    const normalized = normalizeDate(date);
    if ("error" in normalized) return { error: normalized.error };
    const target = normalized.date;

    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select("id, name, completed_dates")
      .eq("id", habitId)
      .eq("user_id", user.user.id)
      .maybeSingle();
    if (habitError || !habit) {
      return { error: habitError?.message ?? "Habit not found" };
    }

    const { data: items, error: itemsError } = await supabase
      .from("habit_checklist_items")
      .select("id, name, is_optional")
      .eq("habit_id", habitId)
      .eq("is_deleted", false);
    if (itemsError) return { error: itemsError.message };
    const item = (items ?? []).find((i) => i.id === itemId);
    if (!item) return { error: "That sub-item doesn't belong to this habit." };

    const { data: existing } = await supabase
      .from("habit_completions")
      .select("completed_item_ids")
      .eq("habit_id", habitId)
      .eq("user_id", user.user.id)
      .eq("completion_date", target)
      .maybeSingle();

    const current: string[] = existing?.completed_item_ids ?? [];
    const nextItemIds = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];

    const { error: upsertError } = await supabase
      .from("habit_completions")
      .upsert(
        {
          habit_id: habitId,
          user_id: user.user.id,
          completion_date: target,
          completed_item_ids: nextItemIds,
        },
        { onConflict: "habit_id,user_id,completion_date" },
      );
    if (upsertError) return { error: upsertError.message };

    // Roll the parent habit's completed_dates up/down to match — same
    // rule the UI uses (src/actions/habits.ts toggleChecklistItem), so
    // streaks and heatmaps stay consistent regardless of entry point.
    const requiredIds = (items ?? [])
      .filter((i) => !i.is_optional)
      .map((i) => i.id);
    const dayComplete =
      requiredIds.length > 0 && requiredIds.every((id) => nextItemIds.includes(id));

    const currentDates: string[] = (habit.completed_dates as string[] | null) ?? [];
    const hasDate = currentDates.includes(target);
    if (dayComplete !== hasDate) {
      const nextDates = dayComplete
        ? [...currentDates, target]
        : currentDates.filter((d) => d !== target);
      const { error: datesError } = await supabase
        .from("habits")
        .update({ completed_dates: nextDates })
        .eq("id", habitId)
        .eq("user_id", user.user.id);
      if (datesError) return { error: datesError.message };
    }

    const ticked = nextItemIds.includes(itemId);
    return {
      data: `${item.name}: ${ticked ? "ticked" : "unticked"} for ${target}.${
        dayComplete ? ` All items done — ${habit.name} is complete.` : ""
      }`,
    };
  },
});

export const logHabitNumberTool = tool({
  description:
    "Log the value for a NUMBER habit (e.g. 30 pushups, 8 glasses of " +
    "water) on a given date, defaulting to today. Past dates allowed. " +
    "Whether it counts as done is decided by the habit's own goal, so " +
    "just log the number — don't also call toggleHabitToday.",
  inputSchema: z.object({
    habitId: z.string(),
    value: z.number().describe("The amount they actually did"),
    date: z
      .string()
      .nullable()
      .optional()
      .describe("YYYY-MM-DD. Omit for today."),
  }),
  execute: async ({ habitId, value, date }) => {
    const normalized = normalizeDate(date);
    if ("error" in normalized) return { error: normalized.error };
    const target = normalized.date;
    if (!Number.isFinite(value)) return { error: "Enter a valid number" };

    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select("name, completed_dates, goal_number, goal_comparator, goal_unit")
      .eq("id", habitId)
      .eq("user_id", user.user.id)
      .maybeSingle();
    if (habitError || !habit) {
      return { error: habitError?.message ?? "Habit not found" };
    }
    if (habit.goal_number == null || !habit.goal_comparator) {
      return { error: `"${habit.name}" isn't a number habit — it has no goal set.` };
    }

    const { error: upsertError } = await supabase
      .from("habit_completions")
      .upsert(
        {
          habit_id: habitId,
          user_id: user.user.id,
          completion_date: target,
          numeric_value: value,
        },
        { onConflict: "habit_id,user_id,completion_date" },
      );
    if (upsertError) return { error: upsertError.message };

    const goal = Number(habit.goal_number);
    const comparator = habit.goal_comparator as string;
    const dayComplete =
      comparator === "less_than"
        ? value < goal
        : comparator === "exactly"
          ? value === goal
          : value >= goal;

    const currentDates: string[] = (habit.completed_dates as string[] | null) ?? [];
    const hasDate = currentDates.includes(target);
    if (dayComplete !== hasDate) {
      const nextDates = dayComplete
        ? [...currentDates, target]
        : currentDates.filter((d) => d !== target);
      const { error: datesError } = await supabase
        .from("habits")
        .update({ completed_dates: nextDates })
        .eq("id", habitId)
        .eq("user_id", user.user.id);
      if (datesError) return { error: datesError.message };
    }

    const unit = habit.goal_unit ? ` ${habit.goal_unit}` : "";
    return {
      data: `${habit.name}: logged ${value}${unit} for ${target}${
        dayComplete ? " — goal met." : ` (goal is ${goal}${unit}).`
      }`,
    };
  },
});
