"use client";

import { Check, Flame, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteGoal } from "@/actions/goals";
import { useRegisterFab } from "@/components/app-shell/mobile-fab-context";
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogPanel,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import type { GoalWithProgress, Habit, Task } from "@/lib/types/productivity";
import { cn } from "@/lib/utils";

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

function formatDisplayDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function GoalCard({
  goal,
  onOpen,
}: {
  goal: GoalWithProgress;
  onOpen: () => void;
}): React.ReactElement {
  const left = daysLeft(goal.end_date);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4 text-left transition-colors hover:border-rf-green-deep/40"
    >
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
    </button>
  );
}

function GoalDetailDialog({
  goal,
  onOpenChange,
  onDeleted,
}: {
  goal: GoalWithProgress | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!goal) return;
    const id = goal.id;
    onOpenChange(false);
    onDeleted(id);
    startTransition(async () => {
      const res = await deleteGoal(id);
      if (res.error) toast.error(res.error);
    });
  }

  return (
    <ResponsiveDialog open={goal !== null} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{goal?.title ?? "Goal"}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        {goal ? (
          <ResponsiveDialogPanel className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-body-muted">
                <span>
                  {formatDisplayDate(goal.start_date)} –{" "}
                  {formatDisplayDate(goal.end_date)}
                </span>
                <span>{goal.progressPct}% there</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-rf-green-deep transition-[width]"
                  style={{ width: `${goal.progressPct}%` }}
                />
              </div>
            </div>

            {goal.hoursTarget != null ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
                  Deep work
                </span>
                <span className="tabular-nums text-sm font-semibold text-ink">
                  {(goal.hoursLogged ?? 0).toFixed(1)} / {goal.hoursTarget.toFixed(1)}h
                </span>
              </div>
            ) : null}

            {goal.habits.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-body-muted">
                  Habits
                </h4>
                <div className="flex flex-col gap-1">
                  {goal.habits.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2"
                    >
                      <span className="truncate text-sm text-ink">{h.name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums text-xs text-body-muted">
                          {h.daysDone}/{h.daysElapsed} days
                        </span>
                        {h.completedToday ? (
                          <Flame size={14} className="text-rf-coral" />
                        ) : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {goal.tasks.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-body-muted">
                  Tasks
                </h4>
                <div className="flex flex-col gap-1">
                  {goal.tasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 rounded-xl border border-line px-3 py-2"
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full",
                          t.is_completed
                            ? "bg-rf-green-deep text-white"
                            : "border border-line",
                        )}
                      >
                        {t.is_completed ? <Check size={11} /> : null}
                      </span>
                      <span
                        className={cn(
                          "truncate text-sm text-ink",
                          t.is_completed && "text-body-muted line-through",
                        )}
                      >
                        {t.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {goal.habits.length === 0 &&
            goal.tasks.length === 0 &&
            goal.hoursTarget == null ? (
              <p className="text-sm text-body-muted">
                This goal isn't linked to any habits, tasks, or a deep-work
                target.
              </p>
            ) : null}
          </ResponsiveDialogPanel>
        ) : null}
        <ResponsiveDialogFooter>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 />
            Delete goal
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function ActiveGoalsClient({
  goals: initialGoals,
  habits,
  tasks,
}: {
  goals: GoalWithProgress[];
  habits: Habit[];
  tasks: Task[];
}): React.ReactElement {
  const [goals, setGoals] = useState(initialGoals);
  const [open, setOpen] = useState(false);
  const [openGoalId, setOpenGoalId] = useState<string | null>(null);
  const openGoal = goals.find((g) => g.id === openGoalId) ?? null;

  useRegisterFab({ label: "Set a goal", icon: Plus, onClick: () => setOpen(true) }, []);

  function handleDeleted(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

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
        goals.map((goal) => (
          <GoalCard goal={goal} key={goal.id} onOpen={() => setOpenGoalId(goal.id)} />
        ))
      )}
      <CreateGoalDialog
        habits={habits}
        onOpenChange={setOpen}
        open={open}
        tasks={tasks}
      />
      <GoalDetailDialog
        goal={openGoal}
        onOpenChange={(open) => !open && setOpenGoalId(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
