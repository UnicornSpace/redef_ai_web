"use client";

import type React from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createGoal } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogPanel,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import type { GoalPeriodType, Habit, Task } from "@/lib/types/productivity";

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

function endDateForPreset(startDate: string, periodType: GoalPeriodType): string {
  if (periodType === "weekly") return addDays(startDate, 6);
  if (periodType === "21_day") return addDays(startDate, 20);
  if (periodType === "monthly") return addDays(startDate, 29);
  return startDate;
}

const PERIOD_LABELS: Record<GoalPeriodType, string> = {
  weekly: "Weekly",
  "21_day": "21-day",
  monthly: "Monthly",
  custom: "Custom",
};

export function CreateGoalDialog({
  open,
  onOpenChange,
  habits,
  tasks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
  tasks: Task[];
}): React.ReactElement {
  const today = dateKey(new Date());
  const [title, setTitle] = useState("");
  const [periodType, setPeriodType] = useState<GoalPeriodType>("weekly");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => endDateForPreset(today, "weekly"));
  const [dailyHours, setDailyHours] = useState("");
  const [habitIds, setHabitIds] = useState<string[]>([]);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle("");
    setPeriodType("weekly");
    setStartDate(today);
    setEndDate(endDateForPreset(today, "weekly"));
    setDailyHours("");
    setHabitIds([]);
    setTaskIds([]);
  }

  function handlePeriodChange(value: GoalPeriodType) {
    setPeriodType(value);
    if (value !== "custom") setEndDate(endDateForPreset(startDate, value));
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (periodType !== "custom") setEndDate(endDateForPreset(value, periodType));
  }

  function toggleHabit(id: string) {
    setHabitIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  }

  function toggleTask(id: string) {
    setTaskIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await createGoal({
        title: trimmed,
        periodType,
        startDate,
        endDate,
        dailyHoursTarget: dailyHours.trim() ? Number(dailyHours) : null,
        habitIds,
        taskIds,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Goal set");
      onOpenChange(false);
      resetForm();
    });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Set a goal</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogPanel>
          <div className="flex flex-col gap-4">
            <Input
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal title (e.g. Ship the redesign)"
              value={title}
            />
            <Tabs
              onValueChange={(v) => handlePeriodChange(v as GoalPeriodType)}
              value={periodType}
            >
              <TabsList>
                {(Object.keys(PERIOD_LABELS) as GoalPeriodType[]).map((key) => (
                  <TabsTab key={key} value={key}>
                    {PERIOD_LABELS[key]}
                  </TabsTab>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Start date
                </span>
                <Input
                  nativeInput
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  type="date"
                  value={startDate}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  End date
                </span>
                <Input
                  disabled={periodType !== "custom"}
                  nativeInput
                  onChange={(e) => setEndDate(e.target.value)}
                  type="date"
                  value={endDate}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-body-muted">
                Daily deep-work hours target (optional)
              </span>
              <Input
                inputMode="decimal"
                min={0}
                onChange={(e) => setDailyHours(e.target.value)}
                placeholder="e.g. 3"
                step="0.5"
                type="number"
                value={dailyHours}
              />
            </div>
            {habits.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Habits to include (optional)
                </span>
                <div className="flex flex-col gap-1">
                  {habits.map((h) => (
                    <label
                      className="flex items-center gap-2 py-0.5"
                      key={h.id}
                    >
                      <Checkbox
                        checked={habitIds.includes(h.id)}
                        onCheckedChange={() => toggleHabit(h.id)}
                      />
                      <span className="text-sm text-ink">{h.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            {tasks.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Tasks to include (optional)
                </span>
                <div className="flex flex-col gap-1">
                  {tasks.map((t) => (
                    <label
                      className="flex items-center gap-2 py-0.5"
                      key={t.id}
                    >
                      <Checkbox
                        checked={taskIds.includes(t.id)}
                        onCheckedChange={() => toggleTask(t.id)}
                      />
                      <span className="text-sm text-ink">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ResponsiveDialogPanel>
        <ResponsiveDialogFooter>
          <Button disabled={isPending || !title.trim()} onClick={handleCreate}>
            Set goal
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
