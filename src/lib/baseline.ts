import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModuleKey } from "@/lib/modules";

/**
 * A user's *derived* behavioral baseline — what they actually do, computed
 * from the data they've already logged. No AI, no new tables, no guessing.
 *
 * This exists because the assistant used to give generic productivity
 * advice ("you've done two hours, maybe wrap up soon") to someone whose
 * normal day is nine hours. It had every one of that person's deep-work
 * sessions sitting in the database and never looked at them. Feeding a
 * few honest numbers into the system prompt makes the advice
 * self-correcting: a model that can see "typical day: 8.7h, today: 2.1h"
 * won't suggest stopping.
 *
 * Everything here is a MEASUREMENT, never an aspiration — what someone
 * wants their day to look like lives in user_standards (src/actions/
 * standards.ts) precisely because it can't be derived from behavior.
 */

const WINDOW_DAYS = 28;

export interface DeepWorkBaseline {
  /** Median hours on days they actually worked. Median, not mean — one
      14-hour crunch day shouldn't redefine "normal". */
  medianHoursPerActiveDay: number;
  longestDayHours: number;
  activeDays: number;
  /** Active days per week, over the window. */
  activeDaysPerWeek: number;
  /** Hours logged so far today — the number that makes "should I keep
      going?" answerable against the median above. */
  hoursToday: number;
}

export interface HabitBaseline {
  activeHabits: number;
  /** 0-1: of all (habit × day) opportunities in the window, how many were
      completed. */
  completionRate: number;
  bestCurrentStreak: number;
}

export interface TaskBaseline {
  completedPerWeek: number;
}

export interface UserBaseline {
  windowDays: number;
  /** True when there's too little history to say anything honest. The
      prompt then tells the model to admit it doesn't know yet rather than
      inventing a baseline from two data points. */
  insufficientData: boolean;
  deepWork: DeepWorkBaseline | null;
  habits: HabitBaseline | null;
  tasks: TaskBaseline | null;
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function round(n: number, places = 1): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

export async function getUserBaseline(
  supabase: SupabaseClient,
  userId: string,
  enabledModules: ModuleKey[],
): Promise<UserBaseline> {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - (WINDOW_DAYS - 1));
  const windowStartKey = dayKey(windowStart);
  const todayKey = dayKey(now);

  const [deepWork, habits, tasks] = await Promise.all([
    enabledModules.includes("deep_work")
      ? buildDeepWork(supabase, userId, windowStartKey, todayKey)
      : null,
    enabledModules.includes("habits")
      ? buildHabits(supabase, userId, windowStartKey, todayKey)
      : null,
    enabledModules.includes("tasks")
      ? buildTasks(supabase, userId, windowStartKey)
      : null,
  ]);

  // "Enough to generalize from" — fewer than 3 logged days of deep work
  // and no habit history means any "typical day" claim would be noise.
  const insufficientData =
    (deepWork?.activeDays ?? 0) < 3 && (habits?.activeHabits ?? 0) === 0;

  return { windowDays: WINDOW_DAYS, insufficientData, deepWork, habits, tasks };
}

async function buildDeepWork(
  supabase: SupabaseClient,
  userId: string,
  windowStartKey: string,
  todayKey: string,
): Promise<DeepWorkBaseline | null> {
  const { data, error } = await supabase
    .from("deepwork_sessions")
    .select("start_time, duration_in_seconds")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .gte("start_time", `${windowStartKey}T00:00:00`);
  if (error || !data) return null;

  const secondsByDay = new Map<string, number>();
  for (const row of data as { start_time: string; duration_in_seconds: number }[]) {
    const key = dayKey(new Date(row.start_time));
    secondsByDay.set(key, (secondsByDay.get(key) ?? 0) + (row.duration_in_seconds ?? 0));
  }

  const hoursPerActiveDay = Array.from(secondsByDay.values())
    .map((s) => s / 3600)
    .filter((h) => h > 0);
  if (hoursPerActiveDay.length === 0) return null;

  return {
    medianHoursPerActiveDay: round(median(hoursPerActiveDay)),
    longestDayHours: round(Math.max(...hoursPerActiveDay)),
    activeDays: hoursPerActiveDay.length,
    activeDaysPerWeek: round((hoursPerActiveDay.length / WINDOW_DAYS) * 7),
    hoursToday: round((secondsByDay.get(todayKey) ?? 0) / 3600),
  };
}

async function buildHabits(
  supabase: SupabaseClient,
  userId: string,
  windowStartKey: string,
  todayKey: string,
): Promise<HabitBaseline | null> {
  const { data, error } = await supabase
    .from("habits")
    .select("completed_dates, current_streak, started_at")
    .eq("user_id", userId)
    .eq("is_deleted", false);
  if (error || !data) return null;

  const rows = data as {
    completed_dates: string[] | null;
    current_streak: number | null;
    started_at: string;
  }[];
  if (rows.length === 0) return null;

  // Denominator counts only days a habit had actually started — otherwise
  // a habit created yesterday drags the rate down with 27 days it was
  // never supposed to be done on.
  let opportunities = 0;
  let completions = 0;
  let bestCurrentStreak = 0;

  for (const h of rows) {
    bestCurrentStreak = Math.max(bestCurrentStreak, h.current_streak ?? 0);
    const startKey = h.started_at.slice(0, 10);
    const effectiveStart = startKey > windowStartKey ? startKey : windowStartKey;
    if (effectiveStart > todayKey) continue;

    const start = new Date(`${effectiveStart}T00:00:00`);
    const end = new Date(`${todayKey}T00:00:00`);
    const days =
      Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    opportunities += Math.max(0, days);

    for (const d of h.completed_dates ?? []) {
      if (d >= effectiveStart && d <= todayKey) completions++;
    }
  }

  return {
    activeHabits: rows.length,
    completionRate: opportunities > 0 ? completions / opportunities : 0,
    bestCurrentStreak,
  };
}

async function buildTasks(
  supabase: SupabaseClient,
  userId: string,
  windowStartKey: string,
): Promise<TaskBaseline | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("updated_at")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .eq("is_completed", true)
    // updated_at is the closest thing to a completion timestamp this
    // schema has — same approximation activity.ts and reports.ts make.
    .gte("updated_at", `${windowStartKey}T00:00:00`);
  if (error || !data) return null;
  return { completedPerWeek: round((data.length / WINDOW_DAYS) * 7) };
}

/**
 * Renders the baseline as a compact prompt block (~100 tokens). Kept
 * deliberately terse and number-forward: the model doesn't need prose, it
 * needs figures it can compare today against.
 */
export function formatBaselinePrompt(baseline: UserBaseline): string {
  if (baseline.insufficientData) {
    return "\n\nTHEIR BASELINE\n\nNot enough history yet to know what a normal day looks like for this person. Do NOT guess or assume an average — if what they're doing sounds like a lot or a little, ask instead of judging. Say plainly that you're still learning their rhythm.";
  }

  const lines: string[] = [];

  if (baseline.deepWork) {
    const d = baseline.deepWork;
    lines.push(
      `- Deep work: a typical working day for them is ${d.medianHoursPerActiveDay}h (median over the last ${baseline.windowDays} days). Longest day: ${d.longestDayHours}h. They work about ${d.activeDaysPerWeek} days a week.`,
    );
    lines.push(`- Logged so far TODAY: ${d.hoursToday}h.`);
  }
  if (baseline.habits) {
    lines.push(
      `- Habits: ${baseline.habits.activeHabits} active, completing about ${Math.round(baseline.habits.completionRate * 100)}% of them. Best current streak: ${baseline.habits.bestCurrentStreak} days.`,
    );
  }
  if (baseline.tasks) {
    lines.push(`- Tasks: ~${baseline.tasks.completedPerWeek} completed per week.`);
  }

  if (lines.length === 0) return "";

  return `\n\nTHEIR BASELINE (measured, last ${baseline.windowDays} days)\n\n${lines.join("\n")}`;
}
