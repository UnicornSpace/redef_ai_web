"use client";

import confetti from "canvas-confetti";
import { play as playSound } from "cuelume";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getHabitCompletionForDate,
  getHabitCompletionsForRange,
  type HabitCompletionDetail,
  type HabitRangeCompletions,
} from "@/actions/habits";
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
 * Mobile: a horizontally-scrollable date strip up top (30 past days +
 * today, tap to focus that day, no visible scrollbar), then the same
 * checklist showing THAT day's completion state. Toggling any habit
 * on a past date writes back to that date via toggleHabitDate.
 *
 * Type-aware interactions:
 * - Boolean: click toggles done for the selected date.
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

function isHabitDoneOn(habit: HabitListItem, dateKeyStr: string): boolean {
  return (habit.completed_dates ?? []).includes(dateKeyStr);
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
// How far back the mobile date-picker strip scrolls. 30 days handles
// the "backfill last week" use case comfortably; the user can still
// interact with any past date via the calendar/heatmap in Cards mode.
const DATE_STRIP_PAST_DAYS = 30;

/**
 * Streak calculation shared with the habit cards — count backwards from
 * today (or yesterday if today isn't done yet) while consecutive days
 * are in completed_dates. Reimplemented locally rather than imported to
 * avoid a cyclic dep with habits-client, which owns the same helper.
 */
function computeStreak(completed: Set<string>, today: Date): number {
  const startOfDay = (d: Date): Date => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  let cursor = startOfDay(today);
  if (!completed.has(dateKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!completed.has(dateKey(cursor))) return 0;
  }
  let streak = 0;
  while (completed.has(dateKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Real per-date numeric/checklist detail for a habit. `listHabits` only
 * bulk-loads TODAY's state (todayNumericValue/todayCompletedItemIds) — for
 * any other date this reads the range map populated by
 * getHabitCompletionsForRange (fetched by FocusView for whatever week is
 * currently visible in the matrix).
 */
function habitCompletionDetailFor(
  habit: HabitListItem,
  dateKeyStr: string,
  todayKey: string,
  rangeCompletions: HabitRangeCompletions,
): HabitCompletionDetail {
  if (dateKeyStr === todayKey) {
    return {
      completedItemIds: habit.todayCompletedItemIds ?? [],
      numericValue: habit.todayNumericValue ?? null,
    };
  }
  return (
    rangeCompletions[habit.id]?.[dateKeyStr] ?? {
      completedItemIds: [],
      numericValue: null,
    }
  );
}

/**
 * Ratio of a habit's progress on a given date, on a 0..1 scale. Boolean
 * habits are always 0/1 (there's no partial state for a plain checkbox).
 * Number/checklist habits are proportional for ANY date now, using
 * `rangeCompletions` for non-today dates and the today-only fields for
 * today (byte-identical to the old today path, zero extra latency).
 */
function habitProgressRatio(
  habit: HabitListItem,
  dateKeyStr: string,
  todayKey: string,
  rangeCompletions: HabitRangeCompletions,
): number {
  if (habit.type === "boolean" || habit.type === "smart_checklist") {
    return isHabitDoneOn(habit, dateKeyStr) ? 1 : 0;
  }
  const detail = habitCompletionDetailFor(
    habit,
    dateKeyStr,
    todayKey,
    rangeCompletions,
  );
  if (habit.type === "number") {
    const goal = habit.goal_number;
    if (!goal || goal <= 0) return 0;
    const value = detail.numericValue ?? 0;
    if (habit.goal_comparator === "less_than") {
      return value < goal ? 1 : 0;
    }
    return Math.min(1, value / goal);
  }
  if (habit.type === "checklist") {
    const items = habit.checklistItems ?? [];
    const required = items.filter((i) => !i.is_optional);
    if (required.length === 0) return 0;
    const doneIds = new Set(detail.completedItemIds);
    const doneRequired = required.filter((i) => doneIds.has(i.id)).length;
    return doneRequired / required.length;
  }
  return 0;
}

/**
 * The "filling can" circle from the mobile mock — a rounded container
 * with a dashed border that fills bottom-up in proportion to that day's
 * completion ratio. Selected day gets a solid green ring so the current
 * focus is obvious.
 */
function DayFillCircle({
  date,
  ratio,
  isToday,
  isSelected,
  isFuture,
  onClick,
}: {
  date: Date;
  ratio: number;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  onClick?: () => void;
}) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFuture}
      aria-pressed={isSelected}
      className={cn(
        "flex shrink-0 flex-col items-center gap-1 rounded-lg p-1 transition-colors",
        !isFuture && "hover:bg-white/40 active:scale-[0.97]",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-medium uppercase tracking-wide text-body-muted",
          isSelected && "text-ink",
        )}
      >
        {SHORT_WEEKDAYS[date.getDay()]}
      </span>
      <div
        className={cn(
          "relative flex size-11 items-center justify-center overflow-hidden rounded-full border transition-colors",
          isSelected
            ? "border-solid border-rf-green-deep border-2"
            : isFuture
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
    </button>
  );
}

/**
 * Map a 0..1 progress ratio to one of five snap buckets, then pick the
 * matching Tailwind background class. Buckets keep the row from
 * shimmering on every 1% change.
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
  displayKey,
  todayKey,
  rangeCompletions,
  isExpanded,
  streak,
  onToggleBoolean,
  onOpenNumberDialog,
  onToggleExpanded,
  onToggleChecklistItem,
}: {
  habit: HabitListItem;
  displayKey: string;
  todayKey: string;
  rangeCompletions: HabitRangeCompletions;
  isExpanded: boolean;
  streak: number;
  onToggleBoolean: (habit: HabitListItem) => void;
  onOpenNumberDialog: (habit: HabitListItem) => void;
  onToggleExpanded: (habitId: string) => void;
  onToggleChecklistItem: (habitId: string, itemId: string, dateKey: string) => void;
}) {
  const ratio = habitProgressRatio(habit, displayKey, todayKey, rangeCompletions);
  const isDone = ratio >= 1;
  const items = habit.checklistItems ?? [];
  const detail = habitCompletionDetailFor(
    habit,
    displayKey,
    todayKey,
    rangeCompletions,
  );
  const doneItemIds = new Set(detail.completedItemIds);

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
      const value = detail.numericValue ?? 0;
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
        {streak > 0 ? (
          <span
            className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-rf-coral"
            title={`${streak}-day streak`}
          >
            <Flame size={11} />
            <span className="tabular-nums">{streak}</span>
          </span>
        ) : null}
        {habit.category ? (
          <span className="hidden shrink-0 rounded-full bg-line px-2 py-0.5 text-[10px] font-semibold text-body-muted sm:inline">
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
                  onClick={() =>
                    onToggleChecklistItem(habit.id, item.id, displayKey)
                  }
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

function weekRangeLabel(days: Date[]): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(days[0])} – ${fmt(days[6])}`;
}

/**
 * Habit × day weekly grid (desktop right pane). Rows are habits sorted
 * by name; columns are 7 days, paged a week at a time via the chevrons.
 * Cells are real buttons — clicking one focuses that date, which drives
 * the left "to do" list via `selectedKey` in the parent. Fill is
 * proportional for number/checklist habits (via `rangeCompletions`), and
 * cells before a habit's start date or after its end date are dimmed
 * rather than shown as a false "missed".
 */
function HabitWeekMatrix({
  habits,
  days,
  weekOffset,
  todayKey,
  selectedKey,
  rangeCompletions,
  isRangeLoading,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
}: {
  habits: HabitListItem[];
  days: Date[];
  weekOffset: number;
  todayKey: string;
  selectedKey: string;
  rangeCompletions: HabitRangeCompletions;
  isRangeLoading: boolean;
  onSelectDate: (key: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetWeek: () => void;
}) {
  const header = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-body-muted">
          {weekOffset === 0 ? "This week at a glance" : weekRangeLabel(days)}
        </h3>
        <span className="text-xs text-body-muted tabular-nums">
          {isRangeLoading ? "Loading…" : `${habits.length} habits`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {weekOffset !== 0 ? (
          <button
            type="button"
            onClick={onResetWeek}
            className="mr-1 text-[11px] font-semibold text-rf-green-deep hover:underline"
          >
            Today
          </button>
        ) : null}
        <button
          type="button"
          onClick={onPrevWeek}
          aria-label="Previous week"
          className="flex size-6 items-center justify-center rounded-md text-body-muted transition-colors hover:bg-line/60 hover:text-ink"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={onNextWeek}
          aria-label="Next week"
          className="flex size-6 items-center justify-center rounded-md text-body-muted transition-colors hover:bg-line/60 hover:text-ink"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );

  if (habits.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
        {header}
        <div className="rounded-xl border border-dashed border-line bg-paper/40 px-4 py-8 text-center text-sm text-body-muted">
          Add a habit to start filling in your week.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
      {header}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left" />
              {days.map((day) => {
                const key = dateKey(day);
                const isTodayCol = key === todayKey;
                return (
                  <th key={key} className="px-1 pb-1 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectDate(key)}
                      className={cn(
                        "w-full rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors hover:bg-line/60",
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
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const startedAt = habit.started_at.slice(0, 10);
              const endAt = habit.end_date
                ? habit.end_date.slice(0, 10)
                : "9999-12-31";
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
                    const isFuture = key > todayKey;
                    const isInactive = key < startedAt || key > endAt;
                    const ratio =
                      isFuture || isInactive
                        ? 0
                        : habitProgressRatio(
                            habit,
                            key,
                            todayKey,
                            rangeCompletions,
                          );
                    const isSelectedCol = key === selectedKey;
                    return (
                      <td key={key} className="px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectDate(key)}
                          disabled={isFuture}
                          aria-label={`${habit.name}, ${key}`}
                          aria-pressed={isSelectedCol}
                          className={cn(
                            "relative mx-auto block size-6 overflow-hidden rounded-[4px] transition-colors",
                            isSelectedCol && "ring-2 ring-rf-green-deep ring-offset-1",
                            isFuture && "cursor-default bg-line/40",
                            !isFuture &&
                              isInactive &&
                              "cursor-default bg-line opacity-20",
                            !isFuture &&
                              !isInactive &&
                              ratio <= 0 &&
                              "bg-line hover:bg-body-muted/40",
                            !isFuture &&
                              !isInactive &&
                              ratio > 0 &&
                              ratio < 1 &&
                              "bg-line",
                            !isFuture &&
                              !isInactive &&
                              ratio >= 1 &&
                              "bg-rf-green-deep hover:bg-rf-green-deep/80",
                          )}
                        >
                          {!isFuture && !isInactive && ratio > 0 && ratio < 1 ? (
                            <span
                              aria-hidden
                              className="absolute inset-x-0 bottom-0 bg-rf-green-deep/70"
                              style={{ height: `${Math.round(ratio * 100)}%` }}
                            />
                          ) : null}
                        </button>
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

function NumberLogDialog({
  habit,
  date,
  todayKey,
  onClose,
  onLog,
}: {
  habit: HabitListItem | null;
  /** Which date this dialog is logging against — today or a past day
      picked from the strip. */
  date: string;
  todayKey: string;
  onClose: () => void;
  onLog: (habitId: string, value: number) => void | Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!habit) return;
    if (date === todayKey) {
      setValue(
        habit.todayNumericValue != null ? String(habit.todayNumericValue) : "",
      );
      return;
    }
    // Past date — today's field doesn't apply, so fetch that day's
    // logged value (if any) to pre-seed the input instead of showing
    // today's number under a different day's label.
    let cancelled = false;
    setValue("");
    setLoading(true);
    getHabitCompletionForDate(habit.id, date)
      .then((res) => {
        if (cancelled) return;
        setValue(res.numericValue != null ? String(res.numericValue) : "");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [habit, date, todayKey]);

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
            {date !== todayKey ? (
              <p className="text-xs text-body-muted">
                Logging for{" "}
                <span className="font-semibold text-ink">
                  {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </p>
            ) : null}
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
                disabled={loading}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={loading ? "Loading…" : "0"}
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

function fireConfetti() {
  const colors = ["#0F5C36", "#3EA76D", "#8FCFA5", "#F97C6B", "#EFAB3F"];
  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.15 },
    colors,
  });
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
  onToggleHabitOnDate,
  onToggleChecklistItem,
  onLogNumber,
  rangeCompletions,
  onRangeCompletionsLoaded,
  onSelectedDateChange,
}: {
  habits: HabitListItem[];
  /** Toggle today. Used for the boolean/checklist type-defaults on the
      Today row where we ALSO want the sound + confetti pipeline. */
  onToggleHabit: (habit: HabitListItem) => void;
  /** Toggle a specific past date — for the date-strip's "focus on
      another day, tick it off there" path. No confetti (celebration only
      makes sense for the live day). */
  onToggleHabitOnDate: (habit: HabitListItem, dateKey: string) => void;
  onToggleChecklistItem: (habitId: string, itemId: string, dateKey: string) => void;
  onLogNumber: (habitId: string, date: string, value: number) => void;
  /** Owned by HabitsClient (not local state here) so a number logged
      against a non-today date from the desktop matrix can be patched
      optimistically the same way today's fields already are. */
  rangeCompletions: HabitRangeCompletions;
  onRangeCompletionsLoaded: (patch: HabitRangeCompletions) => void;
  /** Reports the desktop matrix's selected date up so the Add-habit
      dialog can default its start date to whatever day is focused. */
  onSelectedDateChange?: (dateKey: string) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);

  // Which date the checklist is showing. Defaults to today; the date
  // strip on mobile lets the user page back through the last 30 days
  // and see (and toggle) that day's completion state.
  const [selectedKey, setSelectedKey] = useState<string>(todayKey);

  const [expandedChecklistId, setExpandedChecklistId] = useState<string | null>(
    null,
  );
  const [numberDialogHabit, setNumberDialogHabit] =
    useState<HabitListItem | null>(null);
  // Captured at open time so the submit handler logs against the date the
  // user was actually looking at, even if selectedKey changes underneath
  // (e.g. the strip re-renders) while the dialog is open.
  const [numberDialogDate, setNumberDialogDate] = useState<string>(todayKey);

  const focusHabits = useMemo(
    () => habits.filter((h) => h.type !== "smart_checklist"),
    [habits],
  );

  // How many weeks the desktop matrix has paged away from the current
  // week. Paging shifts selectedKey by the same ±7 days in lockstep — a
  // date shifted by a whole number of weeks keeps the same weekday, so
  // selectedKey always lands back inside the newly-visible window with no
  // separate "snap to a valid day" step needed.
  const [weekOffset, setWeekOffset] = useState(0);
  const matrixDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => addDays(today, i - 3 + weekOffset * 7)),
    [today, weekOffset],
  );

  function stepMatrixWeek(delta: number) {
    setWeekOffset((w) => w + delta);
    setSelectedKey((k) => dateKey(addDays(new Date(`${k}T00:00:00`), delta * 7)));
  }
  function resetMatrixWeek() {
    setWeekOffset(0);
    setSelectedKey(todayKey);
  }

  // The matrix's default ±3-day window already has 6 non-today cells, so
  // this has to fetch on mount too, not just after paging — only TODAY's
  // numeric/checklist detail is bulk-loaded by listHabits. Reported up to
  // HabitsClient (rather than kept as local state) so a number logged
  // against a non-today date can be optimistically patched the same way
  // today's fields already are.
  const [isRangeLoading, setIsRangeLoading] = useState(false);
  const habitIdsKey = useMemo(
    () =>
      focusHabits
        .map((h) => h.id)
        .sort()
        .join(","),
    [focusHabits],
  );
  const rangeStartKey = dateKey(matrixDays[0]);
  const rangeEndKey = dateKey(matrixDays[6]);
  useEffect(() => {
    if (!habitIdsKey) return;
    const habitIds = habitIdsKey.split(",");
    let cancelled = false;
    setIsRangeLoading(true);
    getHabitCompletionsForRange(habitIds, rangeStartKey, rangeEndKey)
      .then((patch) => {
        if (!cancelled) onRangeCompletionsLoaded(patch);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load that week's history");
      })
      .finally(() => {
        if (!cancelled) setIsRangeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [habitIdsKey, rangeStartKey, rangeEndKey, onRangeCompletionsLoaded]);

  useEffect(() => {
    onSelectedDateChange?.(selectedKey);
  }, [selectedKey, onSelectedDateChange]);

  // For each date the picker offers (30 past + today), compute the
  // aggregate completion ratio for that day so the filling can shows
  // the right level. Only counts habits that were active on that date.
  const stripDays = useMemo(() => {
    return Array.from({ length: DATE_STRIP_PAST_DAYS + 1 }, (_, i) =>
      addDays(today, -(DATE_STRIP_PAST_DAYS - i)),
    );
  }, [today]);
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

  // Scroll the strip to the end (today) on mount so the newest days are
  // in view instead of the strip starting 30 days back.
  const stripRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    // Position past-most day on the left, today rightmost — user swipes
    // LEFT (their finger drags right) to reveal older dates, per the
    // "scroll to my left only" spec.
    el.scrollLeft = el.scrollWidth;
  }, []);

  // Streaks by habit id — computed once per habits change, then read by
  // every row. Uses today (not selectedKey) so the streak represents the
  // *actual* current run, not "what your streak would have been on this
  // past date".
  const streakByHabit = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of focusHabits) {
      map.set(h.id, computeStreak(new Set(h.completed_dates ?? []), today));
    }
    return map;
  }, [focusHabits, today]);

  // Split into done / remaining based on the SELECTED date's progress.
  // Switching dates re-splits — that's the point.
  const { done, remaining } = useMemo(() => {
    const done: HabitListItem[] = [];
    const remaining: HabitListItem[] = [];
    for (const h of focusHabits) {
      if (habitProgressRatio(h, selectedKey, todayKey, rangeCompletions) >= 1) {
        done.push(h);
      } else {
        remaining.push(h);
      }
    }
    const bySort = (a: HabitListItem, b: HabitListItem) => {
      const p = priorityRank(a.priority) - priorityRank(b.priority);
      if (p !== 0) return p;
      return a.name.localeCompare(b.name);
    };
    done.sort(bySort);
    remaining.sort(bySort);
    return { done, remaining };
  }, [focusHabits, selectedKey, todayKey, rangeCompletions]);

  const doneCount = done.length;
  const totalCount = focusHabits.length;

  // Celebrate only on the LIVE day, and only on the transition from
  // partial → complete. Viewing a past day at 100% shouldn't reshoot
  // confetti.
  const prevAllDoneRef = useRef<boolean>(false);
  useEffect(() => {
    if (selectedKey !== todayKey) {
      prevAllDoneRef.current = false;
      return;
    }
    const allDoneNow = totalCount > 0 && doneCount === totalCount;
    if (allDoneNow && !prevAllDoneRef.current) {
      fireConfetti();
      toast.success("Tadaa! All habits done today 🎉");
    }
    prevAllDoneRef.current = allDoneNow;
  }, [doneCount, totalCount, selectedKey, todayKey]);

  function handleToggleBoolean(habit: HabitListItem) {
    const wasDone = isHabitDoneOn(habit, selectedKey);
    playSound(wasDone ? "release" : "success");
    if (selectedKey === todayKey) {
      onToggleHabit(habit);
    } else {
      onToggleHabitOnDate(habit, selectedKey);
    }
  }

  function handleOpenNumberDialog(habit: HabitListItem) {
    playSound("press");
    setNumberDialogDate(selectedKey);
    setNumberDialogHabit(habit);
  }

  function handleLogNumberSubmit(habitId: string, value: number) {
    playSound("success");
    onLogNumber(habitId, numberDialogDate, value);
  }

  function handleToggleExpanded(habitId: string) {
    playSound("press");
    setExpandedChecklistId((current) => (current === habitId ? null : habitId));
  }

  function handleToggleChecklistItemInner(habitId: string, itemId: string) {
    const habit = habits.find((h) => h.id === habitId);
    const doneNow = habit
      ? habitCompletionDetailFor(
          habit,
          selectedKey,
          todayKey,
          rangeCompletions,
        ).completedItemIds.includes(itemId)
      : false;
    playSound(doneNow ? "release" : "success");
    onToggleChecklistItem(habitId, itemId, selectedKey);
  }

  const renderRow = (habit: HabitListItem) => (
    <ChecklistRow
      key={habit.id}
      habit={habit}
      displayKey={selectedKey}
      todayKey={todayKey}
      rangeCompletions={rangeCompletions}
      isExpanded={expandedChecklistId === habit.id}
      streak={streakByHabit.get(habit.id) ?? 0}
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
            Done{selectedKey === todayKey ? " today" : ""} · {doneCount}/{totalCount}
          </span>
          {done.map(renderRow)}
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-body-muted">
          {remaining.length > 0
            ? `Still to do · ${remaining.length}`
            : selectedKey === todayKey
              ? "All done — nothing left today"
              : "Nothing left on this day"}
        </span>
        {remaining.map(renderRow)}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Mobile-only horizontally-scrollable date strip. Past days
            live on the LEFT (user swipes right / drags left to reach
            older dates); today anchors the right edge. Scrollbar hidden
            via arbitrary variants — cross-browser via
            `scrollbar-none` polyfill classes below. */}
        <div className="lg:hidden ">--
          <div
            ref={stripRef}
            className={cn(
              "flex snap-x snap-mandatory  items-start gap-2 overflow-x-auto pb-1",
              // Kill scrollbars in all engines. `[-ms-overflow-style:none]`
              // + `[scrollbar-width:none]` covers Firefox/IE; the
              // ::-webkit selector covers Chromium/WebKit.
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {dayRatios.map(({ day, ratio }) => {
              const key = dateKey(day);
              const isTodayDay = key === todayKey;
              const isSelected = key === selectedKey;
              const isFuture = day.getTime() > today.getTime();
              return (
                <div key={key} className="snap-end">
                  <DayFillCircle
                    date={day}
                    ratio={ratio}
                    isToday={isTodayDay}
                    isSelected={isSelected}
                    isFuture={isFuture}
                    onClick={() => setSelectedKey(key)}
                  />
                </div>
              );
            })}
          </div>
          {selectedKey !== todayKey ? (
            <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-body-muted">
              <span>
                Viewing{" "}
                <span className="font-semibold text-ink">
                  {new Date(`${selectedKey}T00:00:00`).toLocaleDateString(
                    undefined,
                    { weekday: "short", month: "short", day: "numeric" },
                  )}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedKey(todayKey)}
                className="text-rf-green-deep font-semibold hover:underline"
              >
                Back to today
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>{list}</div>
          <div className="hidden lg:block">
            <HabitWeekMatrix
              habits={focusHabits}
              days={matrixDays}
              weekOffset={weekOffset}
              todayKey={todayKey}
              selectedKey={selectedKey}
              rangeCompletions={rangeCompletions}
              isRangeLoading={isRangeLoading}
              onSelectDate={setSelectedKey}
              onPrevWeek={() => stepMatrixWeek(-1)}
              onNextWeek={() => stepMatrixWeek(1)}
              onResetWeek={resetMatrixWeek}
            />
          </div>
        </div>
      </div>

      <NumberLogDialog
        habit={numberDialogHabit}
        date={numberDialogDate}
        todayKey={todayKey}
        onClose={() => setNumberDialogHabit(null)}
        onLog={handleLogNumberSubmit}
      />
    </>
  );
}
