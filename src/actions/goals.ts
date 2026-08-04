"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import type { GoalPeriodType, GoalWithProgress } from "@/lib/types/productivity";

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Every date key from startKey to endKey, inclusive. */
function dateRange(startKey: string, endKey: string): string[] {
  const cursor = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  const keys: string[] = [];
  while (cursor.getTime() <= end.getTime()) {
    keys.push(todayKeyOf(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function daysBetween(startKey: string, endKey: string): number {
  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

type RawGoal = {
  id: string;
  user_id: string | null;
  title: string;
  period_type: GoalPeriodType;
  start_date: string;
  end_date: string;
  daily_hours_target: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export async function listActiveGoals(): Promise<GoalWithProgress[]> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return [];

  const today = todayKey();

  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rawGoals = (goals ?? []) as RawGoal[];
  if (rawGoals.length === 0) return [];

  const goalIds = rawGoals.map((g) => g.id);
  const earliestStart = rawGoals.reduce(
    (min, g) => (g.start_date < min ? g.start_date : min),
    rawGoals[0].start_date,
  );

  const [goalHabitsRes, goalTasksRes, sessionsRes] = await Promise.all([
    supabase
      .from("goal_habits")
      .select("goal_id, habit:habits(id, name, completed_dates)")
      .in("goal_id", goalIds),
    supabase
      .from("goal_tasks")
      .select("goal_id, task:tasks(id, name, is_completed)")
      .in("goal_id", goalIds),
    supabase
      .from("deepwork_sessions")
      .select("start_time, duration_in_seconds")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .gte("start_time", `${earliestStart}T00:00:00`),
  ]);

  type HabitRow = { id: string; name: string; completed_dates: string[] };
  type TaskRow = { id: string; name: string; is_completed: boolean };

  const habitsByGoal = new Map<string, HabitRow[]>();
  for (const row of (goalHabitsRes.data ?? []) as unknown as {
    goal_id: string;
    habit: HabitRow | null;
  }[]) {
    if (!row.habit) continue;
    const list = habitsByGoal.get(row.goal_id) ?? [];
    list.push(row.habit);
    habitsByGoal.set(row.goal_id, list);
  }

  const tasksByGoal = new Map<string, TaskRow[]>();
  for (const row of (goalTasksRes.data ?? []) as unknown as {
    goal_id: string;
    task: TaskRow | null;
  }[]) {
    if (!row.task) continue;
    const list = tasksByGoal.get(row.goal_id) ?? [];
    list.push(row.task);
    tasksByGoal.set(row.goal_id, list);
  }

  const sessions =
    (sessionsRes.data as { start_time: string; duration_in_seconds: number }[]) ??
    [];

  function hoursInRange(startKey: string, endKey: string): number {
    const startMs = new Date(`${startKey}T00:00:00`).getTime();
    const endMs = new Date(`${endKey}T23:59:59`).getTime();
    const totalSeconds = sessions
      .filter((s) => {
        const t = new Date(s.start_time).getTime();
        return t >= startMs && t <= endMs;
      })
      .reduce((sum, s) => sum + s.duration_in_seconds, 0);
    return totalSeconds / 3600;
  }

  return rawGoals.map((goal) => {
    const habits = habitsByGoal.get(goal.id) ?? [];
    const tasks = tasksByGoal.get(goal.id) ?? [];
    const elapsedEnd = goal.end_date < today ? goal.end_date : today;
    const hoursLogged =
      goal.daily_hours_target != null
        ? hoursInRange(goal.start_date, elapsedEnd)
        : null;

    const componentsPct: number[] = [];

    if (habits.length > 0) {
      const elapsedDays = dateRange(goal.start_date, elapsedEnd);
      let done = 0;
      for (const h of habits) {
        const set = new Set(h.completed_dates ?? []);
        for (const d of elapsedDays) if (set.has(d)) done++;
      }
      const total = habits.length * elapsedDays.length;
      if (total > 0) componentsPct.push((done / total) * 100);
    }

    if (tasks.length > 0) {
      const done = tasks.filter((t) => t.is_completed).length;
      componentsPct.push((done / tasks.length) * 100);
    }

    if (goal.daily_hours_target != null && goal.daily_hours_target > 0) {
      const days = daysBetween(goal.start_date, elapsedEnd);
      const targetTotal = goal.daily_hours_target * days;
      if (targetTotal > 0) {
        componentsPct.push(
          Math.min(100, ((hoursLogged ?? 0) / targetTotal) * 100),
        );
      }
    }

    const progressPct =
      componentsPct.length > 0
        ? Math.round(
            componentsPct.reduce((a, b) => a + b, 0) / componentsPct.length,
          )
        : 0;

    return {
      ...goal,
      habits: habits.map((h) => ({ id: h.id, name: h.name })),
      tasks,
      hoursLogged,
      progressPct,
    };
  });
}

export async function createGoal(input: {
  title: string;
  periodType: GoalPeriodType;
  startDate: string;
  endDate: string;
  dailyHoursTarget: number | null;
  habitIds: string[];
  taskIds: string[];
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const title = input.title.trim();
  if (!title) return { error: "Goal title is required" };
  if (input.endDate < input.startDate) {
    return { error: "End date must be on or after the start date" };
  }

  const goalId = crypto.randomUUID();
  const { error } = await supabase.from("goals").insert({
    id: goalId,
    user_id: user.user.id,
    title,
    period_type: input.periodType,
    start_date: input.startDate,
    end_date: input.endDate,
    daily_hours_target: input.dailyHoursTarget,
  });
  if (error) return { error: error.message };

  if (input.habitIds.length > 0) {
    const { error: habitsError } = await supabase.from("goal_habits").insert(
      input.habitIds.map((habitId) => ({ goal_id: goalId, habit_id: habitId })),
    );
    if (habitsError) return { error: habitsError.message };
  }

  if (input.taskIds.length > 0) {
    const { error: tasksError } = await supabase.from("goal_tasks").insert(
      input.taskIds.map((taskId) => ({ goal_id: goalId, task_id: taskId })),
    );
    if (tasksError) return { error: tasksError.message };
  }

  revalidatePath("/app");
  return {};
}

export async function deleteGoal(goalId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("goals")
    .update({ is_deleted: true })
    .eq("id", goalId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app");
  return {};
}
