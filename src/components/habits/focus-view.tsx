"use client";

import confetti from "canvas-confetti";
import { play as playSound } from "cuelume";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  HabitListItem,
  HabitPriority,
} from "@/lib/types/productivity";
import { cn } from "@/lib/utils";

/**
 * "Focus" layout for /app/habits — a plain checklist people can rip
 * through, without the visual weight of the full masonry card grid.
 *
 * Desktop: two-column split — today's checklist on the left (completed
 * items float to the top so the "still to do" set is instantly scannable
 * at the bottom), habit × day matrix on the right for a weekly bird's
 * eye view.
 *
 * Mobile: a 7-day "filling can" strip up top where each date circle
 * fills bottom-up in proportion to that day's habit-completion ratio,
 * then the same checklist below.
 *
 * Type-aware interactions:
 * - Boolean: click toggles done for today.
 * - Number: click opens a small input dialog to log the value.
 * - Checklist: click expands sub-items inline; checking every required
 *   item auto-completes the parent (server-side rollup).
 * Row background tints proportional to completion so the row itself
 * carries the progress signal, not just the checkbox.
 */

// Sort priority: uncompleted first (grouped by priority high→low→null),
// then completed at the bottom. Matches the way people actually work — you
// want to see what's LEFT, not what's done.
const PRIORITY_RANK: Record<Exclude<HabitPriority, null>, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function priorityRank(p: HabitPriority | null): number {
  return p ? PRIORITY_RANK[p] : 3;
}

function PriorityDot({ priority }: { priority: HabitPriority | null }) {
  if (!priority) return null;
  const color =
    priority === "high"
      ? "bg-rf-coral"
      : priority === "medium"
        ? "bg-rf-amber"
        : "bg-body-muted/50";
  return (
    <span
      aria-label={`${priority} priority`}
      className={cn("size-1.5 shrink-0 rounded-full", color)}
    />
  );
}

function isHabitDoneToday(habit: HabitListItem, todayKey: string): boolean {
  return (habit.completed_dates ?? []).includes(todayKey);
}

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

const SHORT_WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Ratio of today's progress for a single habit, on a 0..1 scale. Same
 * semantics used by the row tint AND by the mobile filling-can circle
 * (aggregated across all habits). Kept as a plain function (no state)
 * so it's easy to reason about and reuse.
 */
function habitProgressRatio(habit: HabitListItem, todayKey: string): number {
  if (habit.type === "boolean" || habit.type === "smart_checklist") {
    return isHabitDoneToday(habit, todayKey) ? 1 : 0;
  }
  if (habit.type === "number") {
    const goal = habit.goal_number;
    if (!goal || goal <= 0) return 0;
    const value = habit.todayNumericValue ?? 0;
    if (habit.goal_comparator === "less_than") {
      return value < goal ? 1 : 0;
    }
    return Math.min(1, value / goal);
  }
  if (habit.type === "checklist") {
    const items = habit.checklistItems ?? [];
    const required = items.filter((i) => !i.is_optional);
    if (required.length === 0) return 0;
    const doneIds = new Set(habit.todayCompletedItemIds ?? []);
    const doneRequired = required.filter((i) => doneIds.has(i.id)).length;
    return doneRequired / required.length;
  }
  return 0;
}

/**
 * The "filling can" circle from the mobile mock — a rounded container
 * with a dashed border that fills bottom-up in proportion to that day's
 * completion ratio. Renders empty for future days, dashed-only for past
 * days with zero activity.
 */
function DayFillCircle({
  date,
  ratio,
  isToday,
  isFuture,
}: {
  date: Date;
  ratio: number;
  isToday: boolean;
  isFuture: boolean;
}) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={cn(
          "text-[10px] font-medium uppercase tracking-wide text-body-muted",
          isToday && "text-ink",
        )}
      >
        {SHORT_WEEKDAYS[date.getDay()]}
      </span>
      <div
        className={cn(
          "relative flex size-11 items-center justify-center overflow-hidden rounded-full border transition-colors",
          isFuture
            ? "border-dashed border-line"
            : isToday
              ? "border-solid border-rf-green-deep"
              : "border-dashed border-body-muted/40",
        )}
      >
        {!isFuture && pct > 0 ? (
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 bg-rf-green-deep/70 transition-[top] duration-300"
            style={{ top: `${100 - pct}%` }}
          />
        ) : null}
        <span
          className={cn(
            "relative z-10 text-xs font-bold tabular-nums",
            !isFuture && pct >= 50 ? "text-white" : "text-ink",
          )}
        >
          {date.getDate()}
        </span>
      </div>
    </div>
  );
}

/**
 * Map a 0..1 progress ratio to one of five snap buckets, then pick the
 * matching Tailwind background class. Buckets keep the row from
 * shimmering on every 1% change — a card at 40% vs 45% shouldn't look
 * different, but 0/40/70/100 should be obviously distinct.
 */
function progressTintClass(ratio: number): string {
  if (ratio >= 1) return "border-rf-green-deep/40 bg-g-green-pale";
  if (ratio >= 0.67) return "border-rf-green-deep/30 bg-g-green-pale/70";
  if (ratio >= 0.34) return "border-rf-green-deep/20 bg-g-green-pale/40";
  if (ratio > 0) return "border-rf-green-deep/10 bg-g-green-pale/20";
  return "border-line bg-paper";
}

/** One row in the checklist. Handles the click routing per habit type. */
function ChecklistRow({
  habit,
  todayKey,
  isExpanded,
  onToggleBoolean,
  onOpenNumberDialog,
  onToggleExpanded,
  onToggleChecklistItem,
}: {
  habit: HabitListItem;
  todayKey: string;
  isExpanded: boolean;
  onToggleBoolean: (habit: HabitListItem) => void;
  onOpenNumberDialog: (habit: HabitListItem) => void;
  onToggleExpanded: (habitId: string) => void;
  onToggleChecklistItem: (habitId: string, itemId: string) => void;
}) {
  const ratio = habitProgressRatio(habit, todayKey);
  const isDone = ratio >= 1;
  const items = habit.checklistItems ?? [];
  const doneItemIds = new Set(habit.todayCompletedItemIds ?? []);

  function handleClick() {
    if (habit.type === "boolean" || habit.type === "smart_checklist") {
      onToggleBoolean(habit);
      return;
    }
    if (habit.type === "number") {
      onOpenNumberDialog(habit);
      return;
    }
    if (habit.type === "checklist") {
      // If there are no items yet, fall through to boolean toggle so the
      // habit isn't stuck as un-checkable. Otherwise expand to reveal
      // the sub-items — clicking those triggers the server rollup that
      // marks the day done automatically.
      if (items.length === 0) {
        onToggleBoolean(habit);
      } else {
        onToggleExpanded(habit.id);
      }
      return;
    }
  }

  const rightMeta = (() => {
    if (habit.type === "number" && habit.goal_number) {
      const value = habit.todayNumericValue ?? 0;
      const unit = habit.goal_unit ? ` ${habit.goal_unit}` : "";
      return (
        <span className="shrink-0 text-[11px] tabular-nums text-body-muted">
          {value}/{habit.goal_number}
          {unit}
        </span>
      );
    }
    if (habit.type === "checklist" && items.length > 0) {
      const required = items.filter((i) => !i.is_optional);
      const doneRequired = required.filter((i) => doneItemIds.has(i.id)).length;
      return (
        <span className="shrink-0 text-[11px] tabular-nums text-body-muted">
          {doneRequired}/{required.length}
        </span>
      );
    }
    return null;
  })();

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-xl border transition-colors",
        progressTintClass(ratio),
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={habit.type === "checklist" ? isExpanded : undefined}
        className="flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border",
            isDone
              ? "border-rf-green-deep bg-rf-green-deep text-white"
              : "border-line bg-white",
          )}
        >
          {isDone ? <Check size={12} /> : null}
        </span>
        <PriorityDot priority={habit.priority} />
        <span
          className={cn(
            "flex-1 truncate text-sm",
            isDone ? "text-body-muted line-through" : "text-ink",
          )}
        >
          {habit.name}
        </span>
        {rightMeta}
        {habit.category ? (
          <span className="shrink-0 rounded-full bg-line px-2 py-0.5 text-[10px] font-semibold text-body-muted">
            {habit.category}
          </span>
        ) : null}
        {habit.type === "checklist" && items.length > 0 ? (
          <ChevronDown
            size={14}
            className={cn(
              "shrink-0 text-body-muted transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        ) : null}
      </button>

      {habit.type === "checklist" && isExpanded && items.length > 0 ? (
        <ul className="flex flex-col gap-1 border-t border-line/50 px-3 py-2">
          {items.map((item) => {
            const done = doneItemIds.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onToggleChecklistItem(habit.id, item.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm transition-colors hover:bg-white/60"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      done
                        ? "border-rf-green-deep bg-rf-green-deep text-white"
                        : "border-line bg-white",
                    )}
                  >
                    {done ? <Check size={10} /> : null}
                  </span>
                  <span
                    className={cn(
                      "flex-1",
                      done ? "text-body-muted line-through" : "text-ink",
                    )}
                  >
                    {item.name}
                  </span>
                  {item.is_optional ? (
                    <span className="shrink-0 text-[10px] text-body-muted">
                      optional
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Habit × day weekly grid (desktop right pane). Rows are habits sorted
 * by name; columns are the 7 days centered on today (3 before + today +
 * 3 after). Future cells are inert placeholders so the grid always
 * renders as a full rectangle.
 */
function HabitWeekMatrix({
  habits,
  today,
}: {
  habits: HabitListItem[];
  today: Date;
}) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, i - 3)),
    [today],
  );
  const todayKey = dateKey(today);

  if (habits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper/40 px-4 py-8 text-center text-sm text-body-muted">
        Add a habit to start filling in your week.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-body-muted">
          This week at a glance
        </h3>
        <span className="text-xs text-body-muted tabular-nums">
          {habits.length} habits
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left" />
              {days.map((day) => {
                const key = dateKey(day);
                const isTodayCol = key === todayKey;
                return (
                  <th
                    key={key}
                    className={cn(
                      "px-1 pb-1 text-center text-[10px] font-semibold uppercase tracking-wide",
                      isTodayCol ? "text-ink" : "text-body-muted",
                    )}
                  >
                    {SHORT_WEEKDAYS[day.getDay()]}
                    <br />
                    <span
                      className={cn(
                        "text-xs font-bold",
                        isTodayCol ? "text-rf-green-deep" : "text-ink",
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const completed = new Set(habit.completed_dates ?? []);
              return (
                <tr key={habit.id} className="border-t border-line">
                  <td className="max-w-40 truncate py-2 pr-3 text-sm text-ink">
                    <span className="inline-flex items-center gap-1.5">
                      <PriorityDot priority={habit.priority} />
                      <span className="truncate">{habit.name}</span>
                    </span>
                  </td>
                  {days.map((day) => {
                    const key = dateKey(day);
                    const isDone = completed.has(key);
                    const isFuture = day.getTime() > today.getTime();
                    return (
                      <td key={key} className="px-1 py-1.5">
                        <div
                          className={cn(
                            "mx-auto size-6 rounded-[4px]",
                            isFuture
                              ? "bg-line/40"
                              : isDone
                                ? "bg-rf-green-deep"
                                : "bg-line",
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Small dialog for logging today's number on a number-type habit.
 * Deliberately minimal: goal blurb + single input + Log — the full
 * detail (progress bar, comparator, unit picker) still lives on the
 * Cards view. Log button auto-submits on Enter.
 */
function NumberLogDialog({
  habit,
  onClose,
  onLog,
}: {
  habit: HabitListItem | null;
  onClose: () => void;
  onLog: (habitId: string, value: number) => void | Promise<void>;
}) {
  const [value, setValue] = useState("");

  // Re-seed input from the habit's current value each time the dialog
  // opens for a different habit. Otherwise stale text from a prior
  // habit's log flashes for a frame.
  useEffect(() => {
    if (habit) {
      setValue(
        habit.todayNumericValue != null ? String(habit.todayNumericValue) : "",
      );
    }
  }, [habit]);

  const parsed = value.trim() === "" ? NaN : Number(value);
  const invalid = value.trim() === "" || Number.isNaN(parsed);

  function submit() {
    if (invalid || !habit) return;
    onLog(habit.id, parsed);
    onClose();
  }

  return (
    <Dialog open={habit !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habit ? habit.name : ""}</DialogTitle>
        </DialogHeader>
        {habit ? (
          <div className="flex flex-col gap-4 px-6 pb-2">
            {habit.goal_number ? (
              <p className="text-xs text-body-muted">
                Goal:{" "}
                {habit.goal_comparator === "less_than"
                  ? "less than"
                  : habit.goal_comparator === "exactly"
                    ? "exactly"
                    : "at least"}{" "}
                <span className="font-semibold text-ink">
                  {habit.goal_number}
                </span>
                {habit.goal_unit ? ` ${habit.goal_unit}` : ""}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                nativeInput
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="0"
                className="text-sm"
              />
              {habit.goal_unit ? (
                <span className="shrink-0 text-sm text-body-muted">
                  {habit.goal_unit}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button onClick={submit} disabled={invalid}>
            Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Fire off a celebratory confetti burst from the top-center of the
 * viewport. Wrapped so the caller doesn't need to think about
 * particle counts, colors, or origin math — one call, one burst.
 */
function fireConfetti() {
  const colors = ["#0F5C36", "#3EA76D", "#8FCFA5", "#F97C6B", "#EFAB3F"];
  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.15 },
    colors,
  });
  // Second, slightly delayed burst gives the wave a fuller feel than a
  // single burst on its own — the same trick most polished confetti
  // animations use.
  window.setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      startVelocity: 35,
      origin: { x: 0.3, y: 0.2 },
      colors,
    });
    confetti({
      particleCount: 80,
      spread: 60,
      startVelocity: 35,
      origin: { x: 0.7, y: 0.2 },
      colors,
    });
  }, 200);
}

export function FocusView({
  habits,
  onToggleHabit,
  onToggleChecklistItem,
  onLogNumber,
}: {
  habits: HabitListItem[];
  /** Fired for boolean and (empty-checklist) habits — the parent flips
      today on completed_dates. */
  onToggleHabit: (habit: HabitListItem) => void;
  /** Fired when a sub-item is toggled inside an expanded checklist row.
      The parent calls toggleChecklistItem and updates local state. */
  onToggleChecklistItem: (habitId: string, itemId: string) => void;
  /** Fired when the user submits a value from the number-log dialog. */
  onLogNumber: (habitId: string, value: number) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);

  // Which checklist habit (if any) is currently expanded. Single-item
  // model — clicking a different checklist collapses the previous one.
  const [expandedChecklistId, setExpandedChecklistId] = useState<string | null>(
    null,
  );
  // Which number habit's log dialog is open. Null = closed.
  const [numberDialogHabit, setNumberDialogHabit] =
    useState<HabitListItem | null>(null);

  // Exclude smart_checklist parents from the flat list — they're
  // containers, not habits you "check off". Their children (rendered by
  // listHabits as nested `.children`) don't appear at the top level of
  // this list anyway, so a smart_checklist row in Focus view would show
  // an inert checkbox that confuses more than it helps.
  const focusHabits = useMemo(
    () => habits.filter((h) => h.type !== "smart_checklist"),
    [habits],
  );

  // Split into done-today / still-to-do based on the per-type progress
  // ratio, not just completed_dates — that keeps a number habit at 15/30
  // in the "still to do" pile even though its `completed_dates` might
  // not include today yet.
  const { done, remaining } = useMemo(() => {
    const done: HabitListItem[] = [];
    const remaining: HabitListItem[] = [];
    for (const h of focusHabits) {
      if (habitProgressRatio(h, todayKey) >= 1) done.push(h);
      else remaining.push(h);
    }
    const bySort = (a: HabitListItem, b: HabitListItem) => {
      const p = priorityRank(a.priority) - priorityRank(b.priority);
      if (p !== 0) return p;
      return a.name.localeCompare(b.name);
    };
    done.sort(bySort);
    remaining.sort(bySort);
    return { done, remaining };
  }, [focusHabits, todayKey]);

  const doneCount = done.length;
  const totalCount = focusHabits.length;

  // "All habits done" milestone celebration — fire only when the count
  // TRANSITIONS from < total to = total, not on every re-render where
  // it happens to already be complete (e.g. re-entering the page after
  // finishing earlier). A ref of the previous ratio is enough state.
  const prevAllDoneRef = useRef<boolean>(
    totalCount > 0 && doneCount === totalCount,
  );
  useEffect(() => {
    const allDoneNow = totalCount > 0 && doneCount === totalCount;
    if (allDoneNow && !prevAllDoneRef.current) {
      fireConfetti();
      // Sonner toast — its data-type="success" also fires the cuelume
      // success chime automatically via CuelumeBind's mutation observer,
      // so we get the sound "for free" without a separate play() call.
      toast.success("Tadaa! All habits done today 🎉");
    }
    prevAllDoneRef.current = allDoneNow;
  }, [doneCount, totalCount]);

  // Sound-aware wrapper for the boolean/smart_checklist toggle. Number
  // and checklist have their own paths (dialog / sub-item toggle) that
  // play their own sounds where appropriate.
  function handleToggleBoolean(habit: HabitListItem) {
    const wasDone = isHabitDoneToday(habit, todayKey);
    playSound(wasDone ? "release" : "success");
    onToggleHabit(habit);
  }

  function handleOpenNumberDialog(habit: HabitListItem) {
    playSound("press");
    setNumberDialogHabit(habit);
  }

  function handleLogNumberSubmit(habitId: string, value: number) {
    playSound("success");
    onLogNumber(habitId, value);
  }

  function handleToggleExpanded(habitId: string) {
    playSound("press");
    setExpandedChecklistId((current) => (current === habitId ? null : habitId));
  }

  function handleToggleChecklistItemInner(habitId: string, itemId: string) {
    // Look up whether the item is currently done to pick the right cue —
    // matches the boolean check/uncheck audio pairing.
    const habit = habits.find((h) => h.id === habitId);
    const doneNow = habit
      ? (habit.todayCompletedItemIds ?? []).includes(itemId)
      : false;
    playSound(doneNow ? "release" : "success");
    onToggleChecklistItem(habitId, itemId);
  }

  const stripDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, i - 3)),
    [today],
  );
  const dayRatios = useMemo(() => {
    return stripDays.map((day) => {
      const key = dateKey(day);
      let active = 0;
      let doneCount = 0;
      for (const h of focusHabits) {
        const startedAt = h.started_at.slice(0, 10);
        const endAt = h.end_date ? h.end_date.slice(0, 10) : "9999-12-31";
        if (key < startedAt || key > endAt) continue;
        active++;
        if ((h.completed_dates ?? []).includes(key)) doneCount++;
      }
      return { day, ratio: active === 0 ? 0 : doneCount / active };
    });
  }, [stripDays, focusHabits]);

  const renderRow = (habit: HabitListItem) => (
    <ChecklistRow
      key={habit.id}
      habit={habit}
      todayKey={todayKey}
      isExpanded={expandedChecklistId === habit.id}
      onToggleBoolean={handleToggleBoolean}
      onOpenNumberDialog={handleOpenNumberDialog}
      onToggleExpanded={handleToggleExpanded}
      onToggleChecklistItem={handleToggleChecklistItemInner}
    />
  );

  const list = (
    <div className="flex flex-col gap-3">
      {done.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-rf-green-deep">
            Done today · {doneCount}/{totalCount}
          </span>
          {done.map(renderRow)}
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-body-muted">
          {remaining.length > 0
            ? `Still to do · ${remaining.length}`
            : "All done — nothing left today"}
        </span>
        {remaining.map(renderRow)}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Mobile-only "filling can" 7-day strip. Hidden on lg+ where the
            same signal is shown differently by the right-pane matrix. */}
        <div className="flex items-start justify-between gap-1 lg:hidden">
          {dayRatios.map(({ day, ratio }) => {
            const key = dateKey(day);
            const isToday = key === todayKey;
            const isFuture = day.getTime() > today.getTime();
            return (
              <DayFillCircle
                key={key}
                date={day}
                ratio={ratio}
                isToday={isToday}
                isFuture={isFuture}
              />
            );
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>{list}</div>
          <div className="hidden lg:block">
            <HabitWeekMatrix habits={focusHabits} today={today} />
          </div>
        </div>
      </div>

      <NumberLogDialog
        habit={numberDialogHabit}
        onClose={() => setNumberDialogHabit(null)}
        onLog={handleLogNumberSubmit}
      />
    </>
  );
}
