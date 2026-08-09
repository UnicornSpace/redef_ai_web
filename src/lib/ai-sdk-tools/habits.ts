import { createClient } from "@/lib/server";
import { tool } from "ai";
import z from "zod";

/**
 * Habit tools for AI Talk. Structured outputs — the chat pane renders
 * habits as chips (name + a "done today" pill), not as a JSON dump.
 */

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const listHabitsTool = tool({
  description:
    "List the user's active habits with today's completion status and " +
    "current streak length. Renders as a habit chip grid — don't re-list " +
    "them in prose, just summarize (e.g. \"5 habits, 3 done today\") and " +
    "let the UI show the detail.",
  inputSchema: z.object({}),
  execute: async () => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }
    const { data, error } = await supabase
      .from("habits")
      .select("id, name, category, completed_dates, created_at")
      .eq("user_id", user.user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    if (error) return { error: error.message };

    const today = todayIso();
    const habits = (data ?? []).map((h) => {
      const done = new Set((h.completed_dates as string[] | null) ?? []);
      // Streak: count backwards from today (or yesterday if today isn't
      // done yet) while consecutive days are marked.
      let streak = 0;
      const cursor = new Date(`${today}T00:00:00`);
      if (!done.has(today)) cursor.setDate(cursor.getDate() - 1);
      while (true) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, "0");
        const d = String(cursor.getDate()).padStart(2, "0");
        const key = `${y}-${m}-${d}`;
        if (!done.has(key)) break;
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      return {
        id: h.id as string,
        name: h.name as string,
        category: (h.category as string | null) ?? null,
        doneToday: done.has(today),
        streak,
      };
    });

    return {
      data: {
        habits,
        count: habits.length,
        doneCount: habits.filter((h) => h.doneToday).length,
      },
    };
  },
});

export const toggleHabitTodayTool = tool({
  description:
    "Mark a habit as done (or unmark it) for today. Use the habit id " +
    "from listHabits.",
  inputSchema: z.object({
    habitId: z.string(),
  }),
  execute: async ({ habitId }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const { data: habit, error: fetchError } = await supabase
      .from("habits")
      .select("completed_dates")
      .eq("id", habitId)
      .eq("user_id", user.user.id)
      .single();
    if (fetchError || !habit) {
      return { error: fetchError?.message ?? "Habit not found" };
    }

    const current: string[] = (habit.completed_dates as string[] | null) ?? [];
    const today = todayIso();
    const next = current.includes(today)
      ? current.filter((d) => d !== today)
      : [...current, today];

    const { error } = await supabase
      .from("habits")
      .update({ completed_dates: next })
      .eq("id", habitId)
      .eq("user_id", user.user.id);
    if (error) return { error: error.message };

    return {
      data: next.includes(today) ? "Marked done for today." : "Unmarked for today.",
    };
  },
});
