import { Suspense } from "react";
import { listSessions } from "@/actions/deepwork";
import { listTransactions } from "@/actions/finance";
import { listHabits } from "@/actions/habits";
import { listTasks } from "@/actions/tasks";
import { PageHeader } from "@/components/app-shell/page-header";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEvent, DaySummary } from "@/lib/types/calendar";
import { colorForLabel } from "@/lib/types/calendar";

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Every date key from startKey to endKey, inclusive (both "YYYY-MM-DD"). */
function dateRange(startKey: string, endKey: string): string[] {
  const cursor = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  const keys: string[] = [];
  while (cursor.getTime() <= end.getTime()) {
    keys.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-16 md:px-8">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={`cal-cell-${i}`} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function CalendarData() {
  const [tasks, habits, sessions, transactions] = await Promise.all([
    listTasks(),
    listHabits(),
    listSessions(500),
    listTransactions(),
  ]);

  const events: CalendarEvent[] = tasks
    .filter((t) => t.due_date)
    .map((t) => ({
      id: t.id,
      title: t.name,
      date: t.due_date as string,
      color: colorForLabel(t.category),
      completed: t.is_completed,
      href: "/app/tasks",
    }));

  const daySummaries: Record<string, DaySummary> = {};
  function bucket(date: string): DaySummary {
    const existing = daySummaries[date];
    if (existing) return existing;
    const created: DaySummary = {
      tasks: [],
      habits: [],
      financeNet: 0,
      financeCount: 0,
      workSeconds: 0,
    };
    daySummaries[date] = created;
    return created;
  }

  for (const t of tasks) {
    if (t.due_date) {
      bucket(t.due_date).tasks.push({
        id: t.id,
        name: t.name,
        completed: t.is_completed,
      });
    }
  }
  const today = dateKey(new Date());
  for (const h of habits) {
    // A habit is "assigned" for every day in its active range, not just the
    // days it was actually completed — an open-ended habit's range is
    // clamped to today since future days haven't happened yet.
    const startedAt = h.started_at.slice(0, 10);
    const endAt = h.end_date ? h.end_date.slice(0, 10) : today;
    if (startedAt > endAt) continue;
    const completed = new Set(h.completed_dates ?? []);
    for (const d of dateRange(startedAt, endAt)) {
      bucket(d).habits.push({ id: h.id, name: h.name, done: completed.has(d) });
    }
  }
  for (const tx of transactions) {
    const b = bucket(tx.occurred_on);
    b.financeNet += tx.type === "income" ? tx.amount : -tx.amount;
    b.financeCount += 1;
  }
  for (const s of sessions) {
    const key = dateKey(new Date(s.start_time));
    bucket(key).workSeconds += s.duration_in_seconds;
  }

  return <CalendarClient events={events} daySummaries={daySummaries} />;
}

export default function CalendarPage() {
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Calendar"
        // description="See what's due, day by day — click any day for a summary, or switch to Timeline for a scrolling list."
      />
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarData />
      </Suspense>
    </div>
  );
}
