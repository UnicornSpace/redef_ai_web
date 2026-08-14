import { Flame } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getMyActivityHeatmap } from "@/actions/activity";
import { listSessions } from "@/actions/deepwork";
import { listActiveGoals } from "@/actions/goals";
import { listHabits } from "@/actions/habits";
import { listTasks } from "@/actions/tasks";
import { ActivityHeatmap } from "@/components/activity/activity-heatmap";
import { PageHeader } from "@/components/app-shell/page-header";
import { ActiveGoalsClient } from "@/components/goals/active-goals-client";
import { HomeTasksWidget } from "@/components/tasks/home-tasks-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/server";
import { cn } from "@/lib/utils";

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/**
 * Compute the current streak on a set of ISO date strings — days back
 * from today (or yesterday if today isn't done yet) until the chain breaks.
 * Mirrors the habits page logic; kept local so this stays self-contained.
 */
function streakFor(dates: string[], today: Date): number {
  const set = new Set(dates);
  let cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  if (!set.has(dateKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!set.has(dateKey(cursor))) return 0;
  }
  let streak = 0;
  while (set.has(dateKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Matches the real card's shape so the skeleton-to-content swap is seamless. */
function DashboardCardSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>
      <Skeleton className="h-7 w-12" />
    </div>
  );
}

function GoalsSkeleton() {
  return <Skeleton className="h-24 w-full rounded-2xl" />;
}

function TasksWidgetSkeleton() {
  return <Skeleton className="h-44 w-full rounded-2xl" />;
}

const WORK_HOURS_DAYS = 14;

async function WorkHoursCard() {
  const sessions = await listSessions(300);
  const today = new Date();
  const days = Array.from({ length: WORK_HOURS_DAYS }, (_, i) =>
    addDays(today, -(WORK_HOURS_DAYS - 1 - i)),
  );
  const secondsByDay = days.map((day) => {
    const key = dateKey(day);
    return sessions
      .filter((s) => dateKey(new Date(s.start_time)) === key)
      .reduce((sum, s) => sum + s.duration_in_seconds, 0);
  });
  const maxSeconds = Math.max(1, ...secondsByDay);
  const todaySeconds = secondsByDay[secondsByDay.length - 1] ?? 0;

  return (
    <Link
      href="/app/deep-work"
      className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5 transition-colors hover:border-rf-green-deep/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
          Deep work — last {WORK_HOURS_DAYS} days
        </span>
        <span className="tabular-nums text-sm font-semibold text-ink">
          {todaySeconds > 0
            ? `${(todaySeconds / 3600).toFixed(1)}h today`
            : "0h today"}
        </span>
      </div>
      <div className="flex gap-1">
        {secondsByDay.map((seconds, i) => {
          const intensity = seconds / maxSeconds;
          return (
            <div
              key={days[i].toISOString()}
              className={cn(
                "h-8 flex-1 rounded-[4px]",
                seconds === 0 && "bg-line",
                seconds > 0 && intensity < 0.34 && "bg-rf-green-deep/30",
                seconds > 0 && intensity >= 0.34 && intensity < 0.67 && "bg-rf-green-deep/60",
                seconds > 0 && intensity >= 0.67 && "bg-rf-green-deep",
              )}
            />
          );
        })}
      </div>
    </Link>
  );
}

async function HabitStreakCard() {
  const habits = await listHabits();
  const today = new Date();
  const habitsWithStreak = habits
    .map((h) => ({ ...h, streak: streakFor(h.completed_dates ?? [], today) }))
    .sort((a, b) => b.streak - a.streak);
  const topHabit = habitsWithStreak[0];

  return (
    <Link
      href="/app/habits"
      className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5 transition-colors hover:border-rf-green-deep/40"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-g-green-pale text-rf-coral">
          <Flame size={20} />
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
            {topHabit ? "Top streak" : "Habits"}
          </span>
          <span className="text-sm text-body-muted">
            {topHabit ? topHabit.name : "Start a habit to build a streak"}
          </span>
        </div>
      </div>
      <span className="tabular-nums text-2xl font-extrabold text-ink">
        {topHabit ? `${topHabit.streak}d` : "—"}
      </span>
    </Link>
  );
}

async function ActiveGoalsData() {
  const [goals, habits, tasks] = await Promise.all([
    listActiveGoals(),
    listHabits(),
    listTasks(),
  ]);
  return (
    <ActiveGoalsClient
      goals={goals}
      habits={habits}
      tasks={tasks.filter((t) => !t.is_completed)}
    />
  );
}

async function TasksWidgetData() {
  const tasks = await listTasks();
  return <HomeTasksWidget initialTasks={tasks} />;
}

async function ActivityYearCard() {
  const { points, from, to } = await getMyActivityHeatmap();
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
          Your year, all activity
        </span>
        <span className="tabular-nums text-xs text-body-muted">
          {points.length} active days
        </span>
      </div>
      <ActivityHeatmap
        points={points}
        from={from}
        to={to}
        emptyMessage="Track a habit or log a focus session to start filling in your year."
      />
    </div>
  );
}

function ActivityYearSkeleton() {
  return <Skeleton className="h-52 w-full rounded-2xl" />;
}

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.user_metadata?.email as string | undefined;
  const name = email?.split("@")[0];

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title={name ? `Hey ${name}` : "Hey"}
        // description="Just the things that move the needle today."
        className="py-0 my-4 "
      />
      <div className="flex flex-col gap-3 px-4 pb-10 md:px-8">
        <Suspense fallback={<ActivityYearSkeleton />}>
          <ActivityYearCard />
        </Suspense>
        <Suspense fallback={<GoalsSkeleton />}>
          <ActiveGoalsData />
        </Suspense>
        <Suspense fallback={<DashboardCardSkeleton />}>
          <WorkHoursCard />
        </Suspense>
        <Suspense fallback={<DashboardCardSkeleton />}>
          <HabitStreakCard />
        </Suspense>
        <Suspense fallback={<TasksWidgetSkeleton />}>
          <TasksWidgetData />
        </Suspense>
      </div>
    </div>
  );
}
