import { Flame, Timer } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { listSessions } from "@/actions/deepwork";
import { listHabits } from "@/actions/habits";
import { PageHeader } from "@/components/app-shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/server";

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

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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

function MinimalSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pb-10 md:px-8">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

async function DashboardMinimal() {
  const [habits, sessions] = await Promise.all([
    listHabits(),
    listSessions(60),
  ]);

  const today = new Date();
  const todayKey = dateKey(today);

  const todaySeconds = sessions
    .filter((s) => dateKey(new Date(s.start_time)) === todayKey)
    .reduce((sum, s) => sum + s.duration_in_seconds, 0);

  const habitsWithStreak = habits
    .map((h) => ({ ...h, streak: streakFor(h.completed_dates ?? [], today) }))
    .sort((a, b) => b.streak - a.streak);
  const topHabit = habitsWithStreak[0];

  return (
    <div className="flex flex-col gap-3 px-4 pb-10 md:px-8">
      <Link
        href="/app/deep-work"
        className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5 transition-colors hover:border-rf-green-deep/40"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-g-green-pale text-rf-green-deep">
            <Timer size={20} />
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
              Deep work today
            </span>
            <span className="text-sm text-body-muted">
              Tap to log a focus session
            </span>
          </div>
        </div>
        <span className="tabular-nums text-2xl font-extrabold text-ink">
          {todaySeconds === 0 ? "0m" : formatDuration(todaySeconds)}
        </span>
      </Link>

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
    </div>
  );
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
        description="Just the two things that move the needle today."
      />
      <Suspense fallback={<MinimalSkeleton />}>
        <DashboardMinimal />
      </Suspense>
    </div>
  );
}
