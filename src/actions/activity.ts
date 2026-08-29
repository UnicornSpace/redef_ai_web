"use server";

import { createAdminClient } from "@/lib/admin";
import {
  computeDeepWorkAchievements,
  computeHabitStreakAchievements,
  computeReferralAchievements,
  computeTaskAchievements,
  type Achievement,
} from "@/lib/achievements";
import { referralCodeForUserId } from "@/lib/referral";
import { createClient } from "@/lib/server";

export interface ActivityHeatmapPoint {
  /** ISO date "YYYY-MM-DD". */
  day: string;
  /** Weighted "how active was this day" score — see per-action doc for the
      exact weights so downstream color legends stay meaningful. */
  value: number;
}

/**
 * Current calendar year: Jan 1 of `today.getFullYear()` through today.
 * A rolling 12-month window makes nivo render TWO calendars (last year's
 * tail + this year's head), which reads as two separate charts. Anchoring
 * to Jan 1 keeps everything in one calendar block, at the cost of the
 * chart looking sparse for the first month or two of the year — a
 * deliberate tradeoff per product direction.
 */
function windowBounds(): { from: string; to: string } {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return { from: `${y}-01-01`, to: `${y}-${m}-${d}` };
}

function isDateInWindow(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function bumpDay(map: Map<string, number>, key: string, amount = 1): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

/**
 * Aggregate "activity per day" for the CURRENTLY signed-in user across
 * every input channel — habit completions, deep-work sessions, and
 * completed tasks. Powers the top-of-page year heatmap on /app.
 *
 * Weights are intentionally simple: 1 point per habit completion, 1 point
 * per deep-work session, 0.5 per completed task. The colour ramp is
 * relative to the max cell value nivo computes, so exact absolute values
 * matter less than their proportion — a heavy deep-work day still shows
 * as heavy even if that user rarely completes tasks.
 */
export async function getMyActivityHeatmap(): Promise<{
  points: ActivityHeatmapPoint[];
  from: string;
  to: string;
}> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  const { from, to } = windowBounds();
  if (!userId) return { points: [], from, to };

  const counts = new Map<string, number>();

  const [habitsRes, sessionsRes, tasksRes] = await Promise.all([
    supabase
      .from("habits")
      .select("completed_dates")
      .eq("user_id", userId)
      .eq("is_deleted", false),
    supabase
      .from("deepwork_sessions")
      .select("start_time")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .gte("start_time", `${from}T00:00:00`)
      .lte("start_time", `${to}T23:59:59.999`),
    supabase
      .from("tasks")
      .select("updated_at")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .eq("is_completed", true)
      .gte("updated_at", `${from}T00:00:00`)
      .lte("updated_at", `${to}T23:59:59.999`),
  ]);

  for (const row of habitsRes.data ?? []) {
    for (const d of (row.completed_dates as string[] | null) ?? []) {
      if (isDateInWindow(d, from, to)) bumpDay(counts, d, 1);
    }
  }
  for (const row of sessionsRes.data ?? []) {
    const day = String(row.start_time).slice(0, 10);
    if (isDateInWindow(day, from, to)) bumpDay(counts, day, 1);
  }
  for (const row of tasksRes.data ?? []) {
    // Tasks don't have a dedicated completion_at column — we approximate
    // with updated_at + is_completed=true, which is close enough for a
    // heatmap that groups by day. If we ever add completed_at, swap here.
    const day = String(row.updated_at).slice(0, 10);
    if (isDateInWindow(day, from, to)) bumpDay(counts, day, 0.5);
  }

  const points = Array.from(counts.entries()).map(([day, value]) => ({
    day,
    value: Math.round(value * 10) / 10,
  }));
  return { points, from, to };
}

/**
 * Public version — same 12-month window but scoped to a target
 * `username`, and ONLY counts habit completions (no deep-work, no tasks).
 * Returns null if the target user has `public_activity_visible = false`,
 * so the calling page can decide whether to render the widget at all.
 *
 * Uses the admin client because RLS scopes normal reads to the caller's
 * own rows — same pattern as getPublicHabit / getPublicProfile.
 */
export async function getPublicActivityHeatmap(username: string): Promise<{
  points: ActivityHeatmapPoint[];
  from: string;
  to: string;
} | null> {
  const admin = createAdminClient();
  const normalized = username.trim().toLowerCase();

  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, public_activity_visible")
    .eq("username", normalized)
    .maybeSingle();
  if (!profile) return null;
  if (profile.public_activity_visible === false) return null;

  const { from, to } = windowBounds();

  const { data: habits } = await admin
    .from("habits")
    .select("completed_dates")
    .eq("user_id", profile.user_id)
    .eq("is_deleted", false);

  const counts = new Map<string, number>();
  for (const row of habits ?? []) {
    for (const d of (row.completed_dates as string[] | null) ?? []) {
      if (isDateInWindow(d, from, to)) bumpDay(counts, d, 1);
    }
  }
  const points = Array.from(counts.entries()).map(([day, value]) => ({
    day,
    value,
  }));
  return { points, from, to };
}

/**
 * Activity-based achievements for the public profile page — referrals,
 * completed tasks, best habit streak, and total deep-work hours. Gated on
 * the same `public_activity_visible` opt-out as getPublicActivityHeatmap
 * (these reveal more than tenure does, so they get the same privacy
 * treatment); returns [] rather than throwing when the flag is off, so the
 * page just doesn't render this section instead of erroring.
 */
export async function getPublicActivityAchievements(
  username: string,
): Promise<Achievement[]> {
  const admin = createAdminClient();
  const normalized = username.trim().toLowerCase();

  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, public_activity_visible")
    .eq("username", normalized)
    .maybeSingle();
  if (!profile) return [];
  if (profile.public_activity_visible === false) return [];
  const userId = profile.user_id;

  const [referralsRes, tasksRes, habitsRes, deepWorkRes] = await Promise.all([
    admin
      .from("user_preferences")
      .select("user_id", { count: "exact", head: true })
      .eq("referred_by", referralCodeForUserId(userId)),
    admin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .eq("is_completed", true),
    admin
      .from("habits")
      .select("best_streak")
      .eq("user_id", userId)
      .eq("is_deleted", false),
    admin
      .from("deepwork_sessions")
      .select("duration_in_seconds")
      .eq("user_id", userId)
      .eq("is_deleted", false),
  ]);

  const referralCount = referralsRes.count ?? 0;
  const completedTaskCount = tasksRes.count ?? 0;
  const bestStreak = (habitsRes.data ?? []).reduce(
    (max, h) => Math.max(max, (h.best_streak as number | null) ?? 0),
    0,
  );
  const totalDeepWorkHours =
    (deepWorkRes.data ?? []).reduce(
      (sum, s) => sum + ((s.duration_in_seconds as number | null) ?? 0),
      0,
    ) / 3600;

  return [
    ...computeReferralAchievements(referralCount),
    ...computeTaskAchievements(completedTaskCount),
    ...computeHabitStreakAchievements(bestStreak),
    ...computeDeepWorkAchievements(totalDeepWorkHours),
  ];
}
