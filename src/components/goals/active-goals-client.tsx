"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useRegisterFab } from "@/components/app-shell/mobile-fab-context";
import { Button } from "@/components/ui/button";
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";
import type { GoalWithProgress, Habit, Task } from "@/lib/types/productivity";

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysLeft(endDate: string): number {
  const end = new Date(`${endDate}T00:00:00`);
  const today = new Date(`${dateKey(new Date())}T00:00:00`);
  return Math.max(0, Math.round((end.getTime() - today.getTime()) / 86400000));
}

function GoalCard({ goal }: { goal: GoalWithProgress }): React.ReactElement {
  const left = daysLeft(goal.end_date);
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink">{goal.title}</span>
        <span className="shrink-0 text-xs text-body-muted">
          {left === 0 ? "Last day" : `${left}d left`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-rf-green-deep transition-[width]"
          style={{ width: `${goal.progressPct}%` }}
        />
      </div>
      <span className="text-xs text-body-muted">{goal.progressPct}% there</span>
    </div>
  );
}

export function ActiveGoalsClient({
  goals,
  habits,
  tasks,
}: {
  goals: GoalWithProgress[];
  habits: Habit[];
  tasks: Task[];
}): React.ReactElement {
  const [open, setOpen] = useState(false);

  useRegisterFab({ label: "Set a goal", icon: Plus, onClick: () => setOpen(true) }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
          Active goals
        </span>
        <Button
          className="hidden md:inline-flex"
          onClick={() => setOpen(true)}
          size="sm"
          variant="outline"
        >
          <Plus />
          Set a goal
        </Button>
      </div>
      {goals.length === 0 ? (
        <button
          className="text-left text-sm text-body-muted hover:text-rf-green-deep md:hidden"
          onClick={() => setOpen(true)}
          type="button"
        >
          Set a goal →
        </button>
      ) : (
        goals.map((goal) => <GoalCard goal={goal} key={goal.id} />)
      )}
      <CreateGoalDialog
        habits={habits}
        onOpenChange={setOpen}
        open={open}
        tasks={tasks}
      />
    </div>
  );
}
