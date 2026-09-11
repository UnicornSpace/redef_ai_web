"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getMyProfile } from "@/actions/profile";
import { createAdminClient } from "@/lib/admin";
import { sendWeeklyReportEmail } from "@/lib/email/weekly-report";
import { DEFAULT_ENABLED_MODULES, type ModuleKey } from "@/lib/modules";
import { createClient } from "@/lib/server";
import type {
  ReportMetric,
  WeeklyReportData,
  WeeklyReportSnapshot,
} from "@/lib/types/reports";

/**
 * Two ways this report gets produced:
 *
 * 1. Live, on demand — getWeeklyReport() below, called whenever someone
 *    opens /app/reports. "Last 7 days as of right now" vs "the 7 before
 *    that" vs a trailing 4-week average. No cron involved.
 * 2. Snapshotted, on a schedule — runWeeklyReportCronForAllUsers(), called
 *    once a week by /api/cron/weekly-reports (see vercel.json). This is
 *    the version that gets emailed and stored, so the in-app popup and the
 *    inbox always agree on the same numbers, and so there's a permanent
 *    record even if the underlying transactions/habits get edited later.
 *
 * Both share the same window math and the same per-module aggregation —
 * the only difference is which client (session vs admin) and which
 * "as of" date they compute against.
 */

type Supa = SupabaseClient;

function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

interface Windows {
  todayKey: string;
  last7Start: string; // inclusive
  prev7Start: string; // inclusive
  prev7End: string; // inclusive, = day before last7Start
  monthStart: string; // inclusive, 28-day trailing window start
}

/**
 * `asOfKey` is the last day of the 7-day window (inclusive). The live path
 * passes today; the cron path passes the Sunday it's running on — which
 * makes last7Start..asOfKey exactly Monday..Sunday, i.e. a real calendar
 * week, without needing separate calendar-aligned math.
 */
function computeWindows(asOfKey: string): Windows {
  const asOf = new Date(`${asOfKey}T00:00:00Z`);
  return {
    todayKey: asOfKey,
    last7Start: dateKey(addDays(asOf, -6)),
    prev7Start: dateKey(addDays(asOf, -13)),
    prev7End: dateKey(addDays(asOf, -7)),
    monthStart: dateKey(addDays(asOf, -27)),
  };
}

/** Whole days from aKey to bKey (both YYYY-MM-DD, UTC-anchored). */
function daysBetween(aKey: string, bKey: string): number {
  const a = Date.parse(`${aKey}T00:00:00Z`);
  const b = Date.parse(`${bKey}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Seven zeroed day-buckets; index 0 is the oldest day of the window. */
function emptyWeek(): number[] {
  return [0, 0, 0, 0, 0, 0, 0];
}

/**
 * Adds `value` to the right day-bucket if `dayKey` falls inside the 7-day
 * window starting at `startKey`. Out-of-window dates are ignored, so
 * callers can feed it every row without pre-filtering.
 */
function addToWeek(
  week: number[],
  startKey: string,
  dayKey: string,
  value: number,
): void {
  const i = daysBetween(startKey, dayKey);
  if (i >= 0 && i < 7) week[i] += value;
}

function formatWindowLabel(w: Windows): string {
  const start = new Date(`${w.last7Start}T00:00:00Z`);
  const end = new Date(`${w.todayKey}T00:00:00Z`);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

async function computeReportForUser(
  supabase: Supa,
  userId: string,
  enabledModules: ModuleKey[],
  asOfKey: string,
): Promise<WeeklyReportData> {
  const w = computeWindows(asOfKey);

  const [habits, tasks, deepWork, personalFinance] = await Promise.all([
    enabledModules.includes("habits")
      ? buildHabitsMetric(supabase, userId, w)
      : null,
    enabledModules.includes("tasks")
      ? buildTasksMetric(supabase, userId, w)
      : null,
    enabledModules.includes("deep_work")
      ? buildDeepWorkMetric(supabase, userId, w)
      : null,
    enabledModules.includes("personal_finance")
      ? buildFinanceMetric(supabase, userId, w)
      : null,
  ]);

  return {
    windowLabel: formatWindowLabel(w),
    weekStart: w.last7Start,
    weekEnd: w.todayKey,
    enabledModules,
    habits,
    tasks,
    deepWork,
    personalFinance,
  };
}

/** Live report for the current signed-in user — no cron involved. */
export async function getWeeklyReport(): Promise<WeeklyReportData | null> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return null;

  const profile = await getMyProfile();
  const enabledModules = profile?.enabled_modules ?? DEFAULT_ENABLED_MODULES;
  return computeReportForUser(
    supabase,
    userId,
    enabledModules,
    dateKey(new Date()),
  );
}

// ---------------------------------------------------------------------------
// Per-module aggregation — shared by the live and snapshot paths.
// ---------------------------------------------------------------------------

async function buildHabitsMetric(
  supabase: Supa,
  userId: string,
  w: Windows,
): Promise<
  (ReportMetric & { activeHabits: number; bestStreak: number }) | null
> {
  const { data, error } = await supabase
    .from("habits")
    .select("completed_dates, current_streak, started_at, is_deleted")
    .eq("user_id", userId)
    .eq("is_deleted", false);
  if (error || !data) return null;

  let current = 0;
  let previous = 0;
  let monthTotal = 0;
  let bestStreak = 0;
  let activeHabits = 0;
  const curSeries = emptyWeek();
  const prevSeries = emptyWeek();

  for (const h of data as {
    completed_dates: string[] | null;
    current_streak: number | null;
    started_at: string;
  }[]) {
    if (h.started_at.slice(0, 10) <= w.todayKey) activeHabits++;
    bestStreak = Math.max(bestStreak, h.current_streak ?? 0);
    for (const d of h.completed_dates ?? []) {
      if (d >= w.last7Start && d <= w.todayKey) current++;
      if (d >= w.prev7Start && d <= w.prev7End) previous++;
      if (d >= w.monthStart && d <= w.todayKey) monthTotal++;
      addToWeek(curSeries, w.last7Start, d, 1);
      addToWeek(prevSeries, w.prev7Start, d, 1);
    }
  }

  return {
    current,
    previous,
    monthAvgPerWeek: monthTotal / 4,
    series: { current: curSeries, previous: prevSeries },
    activeHabits,
    bestStreak,
  };
}

async function buildTasksMetric(
  supabase: Supa,
  userId: string,
  w: Windows,
): Promise<ReportMetric | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("is_completed, updated_at")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .eq("is_completed", true)
    // updated_at is the closest we have to a completion timestamp — same
    // approximation activity.ts already relies on for the heatmap; swap
    // both if a real completed_at column ever gets added.
    .gte("updated_at", `${w.monthStart}T00:00:00`);
  if (error || !data) return null;

  let current = 0;
  let previous = 0;
  let monthTotal = 0;
  const curSeries = emptyWeek();
  const prevSeries = emptyWeek();
  for (const t of data as { updated_at: string }[]) {
    const d = t.updated_at.slice(0, 10);
    if (d >= w.last7Start && d <= w.todayKey) current++;
    if (d >= w.prev7Start && d <= w.prev7End) previous++;
    monthTotal++;
    addToWeek(curSeries, w.last7Start, d, 1);
    addToWeek(prevSeries, w.prev7Start, d, 1);
  }
  return {
    current,
    previous,
    monthAvgPerWeek: monthTotal / 4,
    series: { current: curSeries, previous: prevSeries },
  };
}

async function buildDeepWorkMetric(
  supabase: Supa,
  userId: string,
  w: Windows,
): Promise<(ReportMetric & { unit: "hours" }) | null> {
  const { data, error } = await supabase
    .from("deepwork_sessions")
    .select("start_time, duration_in_seconds")
    .eq("user_id", userId)
    .gte("start_time", `${w.monthStart}T00:00:00`);
  if (error || !data) return null;

  let currentSec = 0;
  let previousSec = 0;
  let monthSec = 0;
  const curSeries = emptyWeek();
  const prevSeries = emptyWeek();
  for (const s of data as {
    start_time: string;
    duration_in_seconds: number;
  }[]) {
    const d = s.start_time.slice(0, 10);
    const secs = s.duration_in_seconds ?? 0;
    if (d >= w.last7Start && d <= w.todayKey) currentSec += secs;
    if (d >= w.prev7Start && d <= w.prev7End) previousSec += secs;
    monthSec += secs;
    // Series is in hours, matching current/previous below.
    addToWeek(curSeries, w.last7Start, d, secs / 3600);
    addToWeek(prevSeries, w.prev7Start, d, secs / 3600);
  }
  return {
    current: currentSec / 3600,
    previous: previousSec / 3600,
    monthAvgPerWeek: monthSec / 3600 / 4,
    series: { current: curSeries, previous: prevSeries },
    unit: "hours",
  };
}

async function buildFinanceMetric(
  supabase: Supa,
  userId: string,
  w: Windows,
): Promise<{
  spent: ReportMetric;
  income: ReportMetric;
  net: ReportMetric;
} | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, occurred_on")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .gte("occurred_on", w.monthStart);
  if (error || !data) return null;

  const zero = () => ({
    current: 0,
    previous: 0,
    monthTotal: 0,
    curSeries: emptyWeek(),
    prevSeries: emptyWeek(),
  });
  const spent = zero();
  const income = zero();

  for (const t of data as {
    type: "expense" | "income";
    amount: number;
    occurred_on: string;
  }[]) {
    const bucket = t.type === "income" ? income : spent;
    const d = t.occurred_on;
    if (d >= w.last7Start && d <= w.todayKey) bucket.current += t.amount;
    if (d >= w.prev7Start && d <= w.prev7End) bucket.previous += t.amount;
    if (d >= w.monthStart && d <= w.todayKey) bucket.monthTotal += t.amount;
    addToWeek(bucket.curSeries, w.last7Start, d, t.amount);
    addToWeek(bucket.prevSeries, w.prev7Start, d, t.amount);
  }

  const toMetric = (b: ReturnType<typeof zero>): ReportMetric => ({
    current: b.current,
    previous: b.previous,
    monthAvgPerWeek: b.monthTotal / 4,
    series: { current: b.curSeries, previous: b.prevSeries },
  });

  // Net is income minus spend day-by-day, so its chart can legitimately
  // dip below zero on a heavy-spend day — that's the interesting shape.
  const netSeries = (key: "curSeries" | "prevSeries") =>
    income[key].map((v, i) => v - spent[key][i]);

  return {
    spent: toMetric(spent),
    income: toMetric(income),
    net: {
      current: income.current - spent.current,
      previous: income.previous - spent.previous,
      monthAvgPerWeek: (income.monthTotal - spent.monthTotal) / 4,
      series: {
        current: netSeries("curSeries"),
        previous: netSeries("prevSeries"),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Snapshots — read side (used by /app/reports and the in-app popup)
// ---------------------------------------------------------------------------

function rowToSnapshot(row: {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  data: WeeklyReportData;
  emailed_at: string | null;
  seen_at: string | null;
  created_at: string;
}): WeeklyReportSnapshot {
  return {
    id: row.id,
    userId: row.user_id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    data: row.data,
    emailedAt: row.emailed_at,
    seenAt: row.seen_at,
    createdAt: row.created_at,
  };
}

/** Most recent snapshot for the signed-in user, or null if the cron hasn't
    generated one for them yet (e.g. they signed up mid-week). */
export async function getLatestWeeklyReportSnapshot(): Promise<WeeklyReportSnapshot | null> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("weekly_report_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSnapshot(data);
}

/** Cheap existence check for the in-app popup — is there a snapshot the
    user hasn't dismissed yet. */
export async function hasUnseenWeeklyReport(): Promise<boolean> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return false;

  const { count, error } = await supabase
    .from("weekly_report_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("seen_at", null);
  if (error) return false;
  return (count ?? 0) > 0;
}

/** Marks every snapshot the user hasn't seen yet as seen — called once
    they dismiss or click through the in-app popup. */
export async function markWeeklyReportsSeen(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return { error: "Not signed in" };

  const { error } = await supabase
    .from("weekly_report_snapshots")
    .update({ seen_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("seen_at", null);
  if (error) return { error: error.message };
  return {};
}

// ---------------------------------------------------------------------------
// Cron entry point — generates + stores + emails every onboarded user's
// report for the week ending on `asOfKey` (defaults to today). Called by
// POST /api/cron/weekly-reports, which is the only thing that should ever
// invoke this — it needs the service-role key and touches every user.
// ---------------------------------------------------------------------------

export async function runWeeklyReportCronForAllUsers(
  asOfKey?: string,
): Promise<{
  processed: number;
  emailed: number;
  errors: { userId: string; message: string }[];
}> {
  const admin = createAdminClient();
  const reference = asOfKey ?? dateKey(new Date());

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, enabled_modules")
    .not("onboarded_at", "is", null);
  if (profilesError || !profiles) {
    return {
      processed: 0,
      emailed: 0,
      errors: [
        { userId: "*", message: profilesError?.message ?? "No profiles" },
      ],
    };
  }

  // One paginated call for every user's email, rather than an admin
  // lookup per user — fine up to ~1000 users; page through past that.
  const { data: usersPage, error: usersError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
  if (usersError) {
    return {
      processed: 0,
      emailed: 0,
      errors: [{ userId: "*", message: usersError.message }],
    };
  }
  const emailByUserId = new Map<string, string | undefined>(
    usersPage.users.map((u) => [u.id, u.email]),
  );

  let processed = 0;
  let emailed = 0;
  const errors: { userId: string; message: string }[] = [];

  for (const p of profiles as {
    user_id: string;
    enabled_modules: string[] | null;
  }[]) {
    try {
      const enabledModules = (p.enabled_modules ??
        DEFAULT_ENABLED_MODULES) as ModuleKey[];
      const data = await computeReportForUser(
        admin,
        p.user_id,
        enabledModules,
        reference,
      );

      const { error: upsertError } = await admin
        .from("weekly_report_snapshots")
        .upsert(
          {
            user_id: p.user_id,
            week_start: data.weekStart,
            week_end: data.weekEnd,
            data,
          },
          { onConflict: "user_id,week_start" },
        );
      if (upsertError) {
        errors.push({ userId: p.user_id, message: upsertError.message });
        continue;
      }
      processed++;

      const email = emailByUserId.get(p.user_id);
      if (email) {
        const sendResult = await sendWeeklyReportEmail({ to: email, data });
        if (sendResult.error) {
          errors.push({
            userId: p.user_id,
            message: `email: ${sendResult.error}`,
          });
        } else {
          emailed++;
          await admin
            .from("weekly_report_snapshots")
            .update({ emailed_at: new Date().toISOString() })
            .eq("user_id", p.user_id)
            .eq("week_start", data.weekStart);
        }
      }
    } catch (err) {
      errors.push({
        userId: p.user_id,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { processed, emailed, errors };
}
