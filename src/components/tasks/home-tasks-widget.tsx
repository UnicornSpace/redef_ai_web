"use client";

import Link from "next/link";
import type React from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleTaskCompleted } from "@/actions/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import type { Task } from "@/lib/types/productivity";
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

type Range = "today" | "week";

export function HomeTasksWidget({
  initialTasks,
}: {
  initialTasks: Task[];
}): React.ReactElement {
  const [tasks, setTasks] = useState(initialTasks);
  const [range, setRange] = useState<Range>("today");
  const [, startTransition] = useTransition();

  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const weekEndKey = useMemo(() => dateKey(addDays(today, 6)), [today]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => !!t.due_date)
      .filter((t) => {
        const due = t.due_date as string;
        return range === "today"
          ? due === todayKey
          : due >= todayKey && due <= weekEndKey;
      })
      .sort((a, b) => (a.due_date as string).localeCompare(b.due_date as string))
      .slice(0, 5);
  }, [tasks, range, todayKey, weekEndKey]);

  function handleToggle(task: Task) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, is_completed: !t.is_completed } : t,
      ),
    );
    startTransition(async () => {
      const res = await toggleTaskCompleted(task.id, !task.is_completed);
      if (res.error) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, is_completed: task.is_completed } : t,
          ),
        );
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
          Tasks
        </span>
        <Tabs onValueChange={(v) => setRange(v as Range)} value={range}>
          <TabsList>
            <TabsTab value="today">Today</TabsTab>
            <TabsTab value="week">This week</TabsTab>
          </TabsList>
        </Tabs>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-body-muted">
          {range === "today" ? "Nothing due today." : "Nothing due this week."}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map((task) => (
            <label className="flex items-center gap-2 py-1" key={task.id}>
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={() => handleToggle(task)}
              />
              <span
                className={cn(
                  "flex-1 text-sm text-ink",
                  task.is_completed && "text-body-muted line-through",
                )}
              >
                {task.name}
              </span>
            </label>
          ))}
        </div>
      )}
      <Link
        className="text-xs font-semibold text-rf-green-deep hover:underline"
        href="/app/tasks"
      >
        View all →
      </Link>
    </div>
  );
}
