"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMyStandards } from "@/actions/standards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserBaseline } from "@/lib/baseline";
import {
  COACHING_STANCES,
  type CoachingStance,
  type UserStandards,
} from "@/lib/types/standards";
import { cn } from "@/lib/utils";

export function StandardsClient({
  initialStandards,
  baseline,
}: {
  initialStandards: UserStandards | null;
  baseline: UserBaseline;
}) {
  const [targetHours, setTargetHours] = useState(
    initialStandards?.target_deep_work_hours != null
      ? String(initialStandards.target_deep_work_hours)
      : "",
  );
  const [targetDays, setTargetDays] = useState(
    initialStandards?.target_workdays_per_week != null
      ? String(initialStandards.target_workdays_per_week)
      : "",
  );
  const [stance, setStance] = useState<CoachingStance | null>(
    initialStandards?.coaching_stance ?? null,
  );
  const [protectedTime, setProtectedTime] = useState(
    initialStandards?.protected_time ?? "",
  );
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const hours = targetHours.trim() === "" ? null : Number(targetHours);
    const days = targetDays.trim() === "" ? null : Number(targetDays);
    if (hours != null && (!Number.isFinite(hours) || hours <= 0 || hours > 24)) {
      toast.error("Target hours must be between 0 and 24");
      return;
    }
    if (days != null && (!Number.isInteger(days) || days < 1 || days > 7)) {
      toast.error("Workdays per week must be a whole number between 1 and 7");
      return;
    }

    startTransition(async () => {
      const res = await updateMyStandards({
        targetDeepWorkHours: hours,
        targetWorkdaysPerWeek: days,
        coachingStance: stance,
        protectedTime: protectedTime.trim() || null,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Saved");
    });
  }

  return (
    <div className="flex max-w-lg flex-col gap-6 px-4 pb-16 md:px-8">
      {/* Showing the measured baseline next to the target is the point of
          this page — a target is only meaningful against where you
          actually are, and seeing both makes it obvious what the
          assistant is working from. */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-body-muted">
          What Redef currently measures
        </h2>
        {baseline.insufficientData ? (
          <p className="text-sm text-body-muted">
            Not enough history yet. Log a few days of deep work or habits and
            Redef will start recognizing your rhythm — until then it won&apos;t
            guess.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {baseline.deepWork ? (
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-body-muted">
                  Typical working day
                </span>
                <span className="tabular-nums text-sm font-semibold text-ink">
                  {baseline.deepWork.medianHoursPerActiveDay}h
                  <span className="ml-1.5 font-normal text-body-muted">
                    · {baseline.deepWork.activeDaysPerWeek} days/week
                  </span>
                </span>
              </div>
            ) : null}
            {baseline.habits ? (
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-body-muted">Habit completion</span>
                <span className="tabular-nums text-sm font-semibold text-ink">
                  {Math.round(baseline.habits.completionRate * 100)}%
                </span>
              </div>
            ) : null}
            {baseline.tasks ? (
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-body-muted">Tasks per week</span>
                <span className="tabular-nums text-sm font-semibold text-ink">
                  {baseline.tasks.completedPerWeek}
                </span>
              </div>
            ) : null}
            <p className="mt-1 text-xs text-body-muted">
              Measured over the last {baseline.windowDays} days. This is what
              you do — the settings below are what you&apos;re aiming for.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-body-muted">
          Your target
        </h2>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-body-muted">
            Deep work hours on a working day
          </span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={24}
            step={0.5}
            value={targetHours}
            onChange={(e) => setTargetHours(e.target.value)}
            placeholder="e.g. 9"
            className="w-32"
          />
          <span className="text-xs text-body-muted">
            Leave blank and Redef measures your days against your own median
            instead.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-body-muted">
            Working days per week
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={7}
            value={targetDays}
            onChange={(e) => setTargetDays(e.target.value)}
            placeholder="e.g. 6"
            className="w-32"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-body-muted">
            Protected time
          </span>
          <Textarea
            value={protectedTime}
            onChange={(e) => setProtectedTime(e.target.value)}
            placeholder="e.g. No work after 8pm. Sundays off."
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold uppercase tracking-wide text-body-muted">
            How should Redef coach you?
          </h2>
          <p className="text-xs text-body-muted">
            Two people with identical hours can want opposite advice. This is
            the setting that decides whether Redef pushes you or tells you to
            stop.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {COACHING_STANCES.map((option) => {
            const active = stance === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStance(active ? null : option.value)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-rf-green-deep bg-g-green-pale"
                    : "border-line bg-white hover:bg-paper",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-semibold",
                    active ? "text-rf-green-deep" : "text-ink",
                  )}
                >
                  {option.label}
                </span>
                <span className="text-xs text-body-muted">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={handleSave} loading={isPending} className="w-fit">
        Save
      </Button>
    </div>
  );
}
