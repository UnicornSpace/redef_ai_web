import { tool } from "ai";
import z from "zod";
import { DEFAULT_ENABLED_MODULES, type ModuleKey } from "@/lib/modules";
import { createClient } from "@/lib/server";

/**
 * One-shot snapshot of a single day across every module the user has on —
 * the data backbone of the "wind up the day" flow.
 *
 * The point is that the assistant should NOT open by asking "how many
 * hours did you work?" when the answer is already in the database. Asking
 * a person to re-state what the app already knows is the fastest way to
 * make a daily ritual feel like data entry. This returns what's known so
 * the assistant can lead with it and ask only about the gaps: the habits
 * with no entry, the hours that look short against their own baseline,
 * the spending they may not have logged.
 */

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const getDayReviewTool = tool({
  description:
    "Gather everything already logged for one day (defaults to today) " +
    "across the user's enabled modules: deep-work hours, habit status " +
    "including per-item checklist detail, tasks completed vs still open, " +
    "and money spent. Call this FIRST when winding up / summarizing a " +
    "day, before asking the user anything — then ask only about what's " +
    "missing rather than re-asking what's already here.",
  inputSchema: z.object({
    date: z
      .string()
      .nullable()
      .optional()
      .describe("YYYY-MM-DD to review. Omit for today."),
  }),
  execute: async ({ date }) => {
    const target = date?.trim() || todayIso();
    if (!DATE_PATTERN.test(target)) {
      return { error: `Invalid date "${target}" — use YYYY-MM-DD.` };
    }
    if (target > todayIso()) {
      return { error: "Can't review a day that hasn't happened yet." };
    }

    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }
    const userId = user.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("enabled_modules")
      .eq("user_id", userId)
      .maybeSingle();
    const enabled = (profile?.enabled_modules ??
      DEFAULT_ENABLED_MODULES) as ModuleKey[];

    const [deepWork, habits, tasks, finance] = await Promise.all([
      enabled.includes("deep_work") ? loadDeepWork(supabase, userId, target) : null,
      enabled.includes("habits") ? loadHabits(supabase, userId, target) : null,
      enabled.includes("tasks") ? loadTasks(supabase, userId, target) : null,
      enabled.includes("personal_finance")
        ? loadFinance(supabase, userId, target)
        : null,
    ]);

    return { data: { date: target, deepWork, habits, tasks, finance } };
  },
});

type Supa = Awaited<ReturnType<typeof createClient>>;

async function loadDeepWork(supabase: Supa, userId: string, date: string) {
  const { data } = await supabase
    .from("deepwork_sessions")
    .select("duration_in_seconds")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .gte("start_time", `${date}T00:00:00`)
    .lte("start_time", `${date}T23:59:59.999`);
  const rows = data ?? [];
  const seconds = rows.reduce(
    (sum, r) => sum + ((r.duration_in_seconds as number) ?? 0),
    0,
  );
  return {
    hoursLogged: Number((seconds / 3600).toFixed(2)),
    sessionCount: rows.length,
  };
}

async function loadHabits(supabase: Supa, userId: string, date: string) {
  const { data } = await supabase
    .from("habits")
    .select("id, name, type, completed_dates, started_at, goal_number, goal_unit")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  const rows = (data ?? []).filter(
    (h) => String(h.started_at).slice(0, 10) <= date,
  );
  const ids = rows.map((h) => h.id as string);

  const [itemsRes, completionsRes] = await Promise.all([
    ids.length > 0
      ? supabase
          .from("habit_checklist_items")
          .select("id, habit_id, name, is_optional")
          .in("habit_id", ids)
          .eq("is_deleted", false)
          .order("order_index", { ascending: true })
      : Promise.resolve({ data: [] }),
    ids.length > 0
      ? supabase
          .from("habit_completions")
          .select("habit_id, completed_item_ids, numeric_value")
          .in("habit_id", ids)
          .eq("user_id", userId)
          .eq("completion_date", date)
      : Promise.resolve({ data: [] }),
  ]);

  const itemsByHabit = new Map<
    string,
    { id: string; name: string; is_optional: boolean }[]
  >();
  for (const i of (itemsRes.data ?? []) as {
    id: string;
    habit_id: string;
    name: string;
    is_optional: boolean;
  }[]) {
    const list = itemsByHabit.get(i.habit_id) ?? [];
    list.push(i);
    itemsByHabit.set(i.habit_id, list);
  }
  const completionByHabit = new Map<
    string,
    { completed_item_ids: string[] | null; numeric_value: number | null }
  >();
  for (const c of (completionsRes.data ?? []) as {
    habit_id: string;
    completed_item_ids: string[] | null;
    numeric_value: number | null;
  }[]) {
    completionByHabit.set(c.habit_id, c);
  }

  const habits = rows.map((h) => {
    const id = h.id as string;
    const done = ((h.completed_dates as string[] | null) ?? []).includes(date);
    const completion = completionByHabit.get(id);
    const items = itemsByHabit.get(id) ?? [];
    const doneIds = completion?.completed_item_ids ?? [];
    return {
      id,
      name: h.name as string,
      type: (h.type as string | null) ?? "boolean",
      done,
      ...(items.length > 0
        ? {
            // Per-item detail is what lets the assistant ask "you didn't
            // tick stretching — did you skip it?" instead of the useless
            // "did you do your morning routine?"
            checklistItems: items.map((i) => ({
              id: i.id,
              name: i.name,
              isOptional: i.is_optional,
              done: doneIds.includes(i.id),
            })),
            remainingItems: items
              .filter((i) => !i.is_optional && !doneIds.includes(i.id))
              .map((i) => i.name),
          }
        : {}),
      ...(h.goal_number != null
        ? {
            goal: {
              target: Number(h.goal_number),
              unit: (h.goal_unit as string | null) ?? null,
              loggedValue: completion?.numeric_value ?? null,
            },
          }
        : {}),
    };
  });

  return {
    habits,
    count: habits.length,
    doneCount: habits.filter((h) => h.done).length,
    notDone: habits.filter((h) => !h.done).map((h) => h.name),
  };
}

async function loadTasks(supabase: Supa, userId: string, date: string) {
  const { data } = await supabase
    .from("tasks")
    .select("id, name, is_completed, updated_at, due_date")
    .eq("user_id", userId)
    .eq("is_deleted", false);
  const rows = data ?? [];
  // updated_at is the closest thing to a completion timestamp this schema
  // has — same approximation reports.ts and activity.ts make.
  const completedToday = rows.filter(
    (t) => t.is_completed && String(t.updated_at).slice(0, 10) === date,
  );
  const open = rows.filter((t) => !t.is_completed);
  return {
    completedCount: completedToday.length,
    completed: completedToday.map((t) => t.name as string),
    openCount: open.length,
    open: open.slice(0, 10).map((t) => ({
      id: t.id as string,
      name: t.name as string,
      dueDate: (t.due_date as string | null) ?? null,
    })),
  };
}

async function loadFinance(supabase: Supa, userId: string, date: string) {
  const { data } = await supabase
    .from("transactions")
    .select("type, amount, category, description")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .eq("occurred_on", date);
  const rows = (data ?? []) as {
    type: string;
    amount: number;
    category: string | null;
    description: string | null;
  }[];
  let spent = 0;
  let income = 0;
  for (const t of rows) {
    if (t.type === "income") income += Number(t.amount ?? 0);
    else spent += Number(t.amount ?? 0);
  }
  return {
    spent: Number(spent.toFixed(2)),
    income: Number(income.toFixed(2)),
    transactionCount: rows.length,
    items: rows.map((t) => ({
      type: t.type,
      amount: Number(t.amount ?? 0),
      category: t.category,
      description: t.description,
    })),
  };
}
