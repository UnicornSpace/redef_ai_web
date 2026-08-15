"use client";

import { Check, Copy, Flame, MoreVertical, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addChecklistItem,
  createHabit,
  deleteChecklistItem,
  deleteHabit,
  logNumericValue,
  removeHabitParent,
  setHabitParent,
  toggleChecklistItem,
  toggleCollaboratorDate,
  toggleHabitDate,
  updateHabit,
} from "@/actions/habits";
import { useRegisterFab } from "@/components/app-shell/mobile-fab-context";
import { FocusView } from "@/components/habits/focus-view";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogPanel,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  GoalComparator,
  Habit,
  HabitChecklistItem,
  HabitListItem,
  HabitPriority,
  HabitType,
} from "@/lib/types/productivity";
import { cn } from "@/lib/utils";

function formatDisplayDate(dateStr: string): string {
  return new Date(`${dateStr.slice(0, 10)}T00:00:00`).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

// Monday = 0 ... Sunday = 6
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function computeStreak(completed: Set<string>, today: Date): number {
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

type ViewMode = "weekly" | "monthly";
// Top-level page layout — orthogonal to the per-card weekly/monthly
// toggle above. "focus" is the new default checklist-first view; "cards"
// keeps the masonry grid we had before, since some habits (with
// heatmaps, checklists, number progress bars) benefit from the fuller
// per-habit surface. Weekly/monthly only meaningfully applies to the
// cards layout — Focus shows its own today-centered 7-day strip.
type LayoutMode = "focus" | "cards";

const WEEKS_BY_MODE: Record<ViewMode, number> = { weekly: 1, monthly: 6 };
// Two-letter weekday labels (Mon = 0). Only used for the monthly grid;
// the weekly view is now today-centered, so its labels are derived per-
// render (see WeeklyDaysStrip) rather than pulled from this fixed list.
const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const SHORT_WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const HABIT_TYPE_OPTIONS: {
  value: HabitType;
  label: string;
  description: string;
}[] = [
  {
    value: "boolean",
    label: "Yes / No",
    description: "One yes/no check per day",
  },
  {
    value: "number",
    label: "Number",
    description: "Track a number against a goal",
  },
  {
    value: "checklist",
    label: "Checklist",
    description: "A routine broken into steps",
  },
  {
    value: "smart_checklist",
    label: "Smart checklist",
    description: "A goal made of other habits",
  },
];

// Smart checklist stays fully functional for any habit that already has
// one (rendering, linking, unlinking) — it's just hidden from the "create
// a new habit" picker for now.
const CREATABLE_HABIT_TYPES = HABIT_TYPE_OPTIONS.filter(
  (opt) => opt.value !== "smart_checklist",
);

const GOAL_COMPARATOR_OPTIONS: { value: GoalComparator; label: string }[] = [
  { value: "at_least", label: "At least" },
  { value: "less_than", label: "Less than" },
  { value: "exactly", label: "Exactly" },
];

function goalComparatorLabel(comparator: GoalComparator): string {
  return GOAL_COMPARATOR_OPTIONS.find((o) => o.value === comparator)?.label ?? "At least";
}

function goalBlurb(habit: Habit): string | null {
  if (habit.type !== "number" || habit.goal_number == null || !habit.goal_comparator) {
    return null;
  }
  const parts = [
    goalComparatorLabel(habit.goal_comparator),
    String(habit.goal_number),
    habit.goal_unit ?? "",
  ].filter(Boolean);
  return parts.join(" ");
}

const PRIORITY_OPTIONS: {
  value: HabitPriority | null;
  label: string;
  activeClass: string;
}[] = [
  { value: null, label: "None", activeClass: "border-body-muted bg-line/60 text-ink" },
  { value: "low", label: "Low", activeClass: "border-body-muted bg-body-muted/20 text-ink" },
  {
    value: "medium",
    label: "Medium",
    activeClass: "border-rf-amber bg-rf-amber/20 text-rf-amber",
  },
  {
    value: "high",
    label: "High",
    activeClass: "border-rf-coral bg-rf-coral/20 text-rf-coral",
  },
];

/**
 * Shared four-way segmented picker for the priority field, used in both
 * the create-habit dialog and the edit-habit dialog. Kept as one
 * component so their visual/labels stay identical.
 */
function PriorityPicker({
  value,
  onChange,
}: {
  value: HabitPriority | null;
  onChange: (v: HabitPriority | null) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {PRIORITY_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full border px-2 py-1 text-xs font-semibold transition-colors",
              isActive
                ? opt.activeClass
                : "border-line bg-white text-body-muted hover:border-body-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function buildGridDays(today: Date, weeks: number): Date[] {
  const end = startOfDay(today);
  const gridEnd = addDays(end, 6 - mondayIndex(end));
  const gridStart = addDays(gridEnd, -(weeks * 7 - 1));
  const days: Date[] = [];
  for (let i = 0; i < weeks * 7; i++) days.push(addDays(gridStart, i));
  return days;
}

/**
 * The weekly view is a 7-day strip CENTERED on today: 3 days before, today
 * in the middle, 3 days after. Past days are toggleable, today is
 * toggleable + ringed, future days are shown as inert placeholders so the
 * week always looks like a full row of 7 boxes (not a ragged Mon-to-today
 * partial). The monthly view keeps the Mon-Sun calendar grid it always
 * had — those aggregate totals need a real calendar layout.
 */
function HabitHeatmap({
  habit,
  today,
  viewMode,
  onToggleDate,
}: {
  habit: Habit;
  today: Date;
  viewMode: ViewMode;
  onToggleDate: (date: string) => void;
}) {
  const completed = useMemo(
    () => new Set(habit.completed_dates ?? []),
    [habit.completed_dates],
  );
  const startedAt = useMemo(
    () => startOfDay(new Date(habit.started_at)),
    [habit.started_at],
  );
  const todayStart = startOfDay(today);

  const days = useMemo(() => {
    if (viewMode === "weekly") {
      // Today at index 3 → indexes 0..2 are the 3 days before, 4..6 the 3
      // days after.
      return Array.from({ length: 7 }, (_, i) => addDays(todayStart, i - 3));
    }
    return buildGridDays(today, WEEKS_BY_MODE[viewMode]);
  }, [today, todayStart, viewMode]);

  const cellClass = (opts: {
    isDone: boolean;
    isToday: boolean;
    disabled: boolean;
    isFuture: boolean;
  }) =>
    cn(
      "aspect-square w-9 rounded-[4px] border-1 border-transparent transition-[background-color,border-color,scale] active:scale-[0.96]",
      opts.disabled && !opts.isFuture && "opacity-20",
      // Future days: keep visible as an empty box (not the 20% ghost that
      // "before start" gets) so the week doesn't look truncated. The
      // hover:bg is dropped since they're not interactive.
      opts.isFuture && "bg-line/40 cursor-default",
      !opts.disabled && !opts.isDone && "bg-line hover:bg-body-muted/40",
      opts.isDone && "bg-rf-green-deep hover:bg-rf-green-deep/80",
      opts.isToday && "border-rf-coral",
    );

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 max-w-80 gap-1">
        {viewMode === "weekly"
          ? days.map((day) => (
              <span
                key={`lbl-${dateKey(day)}`}
                className="text-center text-[10px] font-medium text-body-muted"
              >
                {SHORT_WEEKDAYS[day.getDay()]}
              </span>
            ))
          : WEEKDAY_LABELS.map((label) => (
              <span
                key={label}
                className="text-center text-[10px] font-medium text-body-muted"
              >
                {label}
              </span>
            ))}
        {days.map((day) => {
          const key = dateKey(day);
          const isDone = completed.has(key);
          const isToday = key === dateKey(today);
          const isFuture = day.getTime() > todayStart.getTime();
          const isBeforeStart = day.getTime() < startedAt.getTime();
          const disabled = isFuture || isBeforeStart;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onToggleDate(key)}
              title={key}
              aria-label={`${isDone ? "Unmark" : "Mark"} ${key}${isToday ? " (today)" : ""}`}
              className={cellClass({ isDone, isToday, disabled, isFuture })}
            />
          );
        })}
      </div>
    </div>
  );
}

function CompareRow({
  label,
  streak,
  total,
  highlight,
}: {
  label: string;
  streak: number;
  total: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5",
        highlight ? "bg-g-green-pale" : "border border-line",
      )}
    >
      <span className="truncate text-sm font-medium text-ink">{label}</span>
      <span className="flex shrink-0 items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 font-semibold text-rf-coral">
          <Flame size={14} />
          <span className="tabular-nums">{streak}</span>
        </span>
        <span className="tabular-nums text-body-muted">{total} days</span>
      </span>
    </div>
  );
}

/**
 * A checkbox-style row for one checklist step, checked for a specific day
 * (in practice always "today" — see ChecklistSteps callers). Shared between
 * a checklist habit's own card and a smart-checklist child's inline
 * expansion, so both use the exact same interaction.
 */
function ChecklistSteps({
  items,
  completedItemIds,
  onToggle,
}: {
  items: HabitChecklistItem[];
  completedItemIds: string[];
  onToggle: (itemId: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => {
        const done = completedItemIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              done
                ? "border-rf-green-deep/40 bg-g-green-pale"
                : "border-line bg-white hover:bg-muted/30",
            )}
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
        );
      })}
    </div>
  );
}

/**
 * One row inside a "smart checklist" parent's card, representing a linked
 * child habit. Boolean children toggle today's completion directly; a
 * checklist child instead expands inline to show its own steps, since a
 * single checkbox can't represent "3 of 5 steps done".
 */
function SmartChecklistChildRow({
  child,
  todayKey,
  onToggleBoolean,
  onToggleChildItem,
  onUnlink,
}: {
  child: HabitListItem;
  todayKey: string;
  onToggleBoolean: (habitId: string) => void;
  onToggleChildItem: (habitId: string, itemId: string) => void;
  onUnlink: (habitId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDone = (child.completed_dates ?? []).includes(todayKey);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            child.type === "boolean"
              ? onToggleBoolean(child.id)
              : setExpanded((v) => !v)
          }
          aria-label={`${isDone ? "Unmark" : "Mark"} ${child.name}`}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border",
            isDone
              ? "border-rf-green-deep bg-rf-green-deep text-white"
              : "border-line bg-white",
          )}
        >
          {isDone ? <Check size={12} /> : null}
        </button>
        <span
          className={cn(
            "flex-1 text-sm",
            isDone ? "text-body-muted line-through" : "text-ink",
          )}
        >
          {child.name}
        </span>
        {child.type === "checklist" ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-body-muted">
            steps
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onUnlink(child.id)}
          aria-label={`Remove ${child.name} from this group`}
          className="text-body-muted hover:text-rf-coral"
        >
          <X size={14} />
        </button>
      </div>
      {expanded && child.type === "checklist" ? (
        <div className="pl-7">
          <ChecklistSteps
            items={child.checklistItems ?? []}
            completedItemIds={child.todayCompletedItemIds ?? []}
            onToggle={(itemId) => onToggleChildItem(child.id, itemId)}
          />
        </div>
      ) : null}
    </div>
  );
}

function HabitCard({
  habit,
  ownedHabits,
  viewMode,
  onDeleted,
  onUpdated,
}: {
  habit: HabitListItem;
  /** Other top-level owned habits — used to populate the "link an existing
      habit" list when this card is a smart_checklist parent. */
  ownedHabits: HabitListItem[];
  viewMode: ViewMode;
  onDeleted: (id: string) => void;
  /** Patch to merge into the parent's copy of this habit — used by
      handleSaveEdit + handleAddStep + handleDeleteStep so the card's local
      state stays in sync with the list-level state. */
  onUpdated: (id: string, patch: Partial<HabitListItem>) => void;
}) {
  const router = useRouter();
  const [completedDates, setCompletedDates] = useState<string[]>(
    habit.completed_dates ?? [],
  );
  const [completedItemIds, setCompletedItemIds] = useState<string[]>(
    habit.todayCompletedItemIds ?? [],
  );
  const [numericValue, setNumericValue] = useState<string>(
    habit.todayNumericValue != null ? String(habit.todayNumericValue) : "",
  );
  // Latched value + brief "just logged" flash for the Log button so the
  // user sees an immediate acknowledgement — otherwise the click felt
  // silent and they thought nothing happened.
  const [loggedValue, setLoggedValue] = useState<number | null>(
    habit.todayNumericValue ?? null,
  );
  const [justLogged, setJustLogged] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [subHabitOpen, setSubHabitOpen] = useState(false);
  const [newStepName, setNewStepName] = useState("");
  const [newSubHabitName, setNewSubHabitName] = useState("");
  const [inviteRecipient, setInviteRecipient] = useState("");
  // Edit-habit form fields — initialized from `habit` at dialog open time
  // (see openEditDialog below) so they always reflect the live values, not
  // whatever the form happened to hold last time.
  const [editName, setEditName] = useState(habit.name);
  const [editDescription, setEditDescription] = useState(habit.description ?? "");
  const [editCategory, setEditCategory] = useState(habit.category ?? "");
  const [editEndDate, setEditEndDate] = useState(habit.end_date ?? "");
  const [editGoalComparator, setEditGoalComparator] = useState<GoalComparator>(
    habit.goal_comparator ?? "at_least",
  );
  const [editGoalNumber, setEditGoalNumber] = useState(
    habit.goal_number != null ? String(habit.goal_number) : "",
  );
  const [editGoalUnit, setEditGoalUnit] = useState(habit.goal_unit ?? "");
  const [editPriority, setEditPriority] = useState<HabitPriority | null>(
    habit.priority,
  );
  const [, startTransition] = useTransition();
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const completedSet = useMemo(() => new Set(completedDates), [completedDates]);
  const streak = useMemo(
    () => computeStreak(completedSet, today),
    [completedSet, today],
  );
  const collaborators = habit.collaborators;
  const children = habit.children ?? [];
  const childrenDoneToday = children.filter((c) =>
    (c.completed_dates ?? []).includes(todayKey),
  ).length;

  // Today's progress as a 0..1 ratio. Drives the card's background tint
  // so a glance at the grid reads "how am I doing today" — empty for
  // untouched, saturated green when done.
  //
  // Boolean cards are excluded because they already have a strong
  // done/not-done affordance: the today cell in the strip lights up
  // green. Adding a second signal on the same card just for that would
  // read as noise. Smart_checklist cards are excluded for the same
  // reason (each child row already communicates its own state).
  const progress = (() => {
    if (habit.type === "checklist") {
      const items = habit.checklistItems ?? [];
      const required = items.filter((i) => !i.is_optional);
      if (required.length === 0) return 0;
      const doneRequired = completedItemIds.filter((id) =>
        required.some((i) => i.id === id),
      ).length;
      return Math.min(1, doneRequired / required.length);
    }
    if (habit.type === "number") {
      if (!habit.goal_number || habit.goal_number <= 0) return 0;
      const value = loggedValue ?? 0;
      if (habit.goal_comparator === "less_than") {
        // Under the cap = "done" (100% tint). At or over = 0%. Between
        // makes no meaningful gradient for a "stay below" goal.
        return value < habit.goal_number ? 1 : 0;
      }
      return Math.min(1, value / habit.goal_number);
    }
    return 0;
  })();
  // Map ratio → one of 5 tint buckets so cards visually snap rather than
  // shifting subtly on every log — a card at 40% vs 45% shouldn't look
  // different, but a card at 0/40/70/100 should be obviously distinct.
  const tintBucket =
    progress <= 0
      ? 0
      : progress < 0.34
        ? 1
        : progress < 0.67
          ? 2
          : progress < 1
            ? 3
            : 4;
  const tintClass = [
    "bg-paper",
    "bg-g-green-pale/30",
    "bg-g-green-pale/60",
    "bg-g-green-pale",
    "bg-g-green-pale border-rf-green-deep/40",
  ][tintBucket];

  const linkableHabits = ownedHabits.filter(
    (h) =>
      h.id !== habit.id &&
      h.type !== "smart_checklist" &&
      !h.parent_habit_id &&
      !children.some((c) => c.id === h.id),
  );

  function handleToggleDate(date: string) {
    setCompletedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
    startTransition(async () => {
      const res = habit.isCollaboration
        ? await toggleCollaboratorDate(habit.id, date)
        : await toggleHabitDate(habit.id, date);
      if (res.error) {
        setCompletedDates((prev) =>
          prev.includes(date)
            ? prev.filter((d) => d !== date)
            : [...prev, date],
        );
        toast.error(res.error);
      }
    });
  }

  function handleToggleItem(itemId: string) {
    const wasCompleted = completedItemIds.includes(itemId);
    const previousDates = completedDates;
    const nextItemIds = wasCompleted
      ? completedItemIds.filter((id) => id !== itemId)
      : [...completedItemIds, itemId];
    setCompletedItemIds(nextItemIds);

    startTransition(async () => {
      const res = await toggleChecklistItem(habit.id, todayKey, itemId);
      if (res.error) {
        setCompletedItemIds(completedItemIds);
        toast.error(res.error);
        return;
      }
      if (res.dayComplete !== undefined) {
        const hasToday = previousDates.includes(todayKey);
        if (res.dayComplete && !hasToday) {
          setCompletedDates((prev) => [...prev, todayKey]);
        } else if (!res.dayComplete && hasToday) {
          setCompletedDates((prev) => prev.filter((d) => d !== todayKey));
        }
      }
    });
  }

  function handleAddStep() {
    const trimmed = newStepName.trim();
    if (!trimmed) return;
    setNewStepName("");
    startTransition(async () => {
      const res = await addChecklistItem(habit.id, trimmed);
      if (res.error || !res.id) {
        toast.error(res.error ?? "Couldn't add step");
        return;
      }
      const now = new Date().toISOString();
      const newItem = {
        id: res.id,
        habit_id: habit.id,
        name: trimmed,
        description: null,
        order_index: res.orderIndex ?? (habit.checklistItems?.length ?? 0) + 1,
        is_optional: false,
        estimated_time_minutes: null,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      };
      onUpdated(habit.id, {
        checklistItems: [...(habit.checklistItems ?? []), newItem],
      });
    });
  }

  function handleDeleteStep(itemId: string) {
    const previous = habit.checklistItems ?? [];
    onUpdated(habit.id, {
      checklistItems: previous.filter((i) => i.id !== itemId),
    });
    startTransition(async () => {
      const res = await deleteChecklistItem(itemId);
      if (res.error) {
        // Roll back — put the item back exactly where it was.
        onUpdated(habit.id, { checklistItems: previous });
        toast.error(res.error);
      }
    });
  }

  function openEditDialog() {
    // Reset the form to the live habit values every time the dialog opens
    // — otherwise stale local edits from a previous open bleed through.
    setEditName(habit.name);
    setEditDescription(habit.description ?? "");
    setEditCategory(habit.category ?? "");
    setEditEndDate(habit.end_date ?? "");
    setEditGoalComparator(habit.goal_comparator ?? "at_least");
    setEditGoalNumber(habit.goal_number != null ? String(habit.goal_number) : "");
    setEditGoalUnit(habit.goal_unit ?? "");
    setEditPriority(habit.priority);
    setEditOpen(true);
  }

  function handleSaveEdit() {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Habit name is required");
      return;
    }
    const parsedGoal = editGoalNumber.trim() === "" ? NaN : Number(editGoalNumber);
    if (habit.type === "number" && (editGoalNumber.trim() === "" || Number.isNaN(parsedGoal))) {
      toast.error("Set a goal number");
      return;
    }

    const patch: Partial<HabitListItem> = {
      name: trimmed,
      description: editDescription.trim() || null,
      category: editCategory.trim() || null,
      end_date: editEndDate || null,
      priority: editPriority,
    };
    if (habit.type === "number") {
      patch.goal_number = parsedGoal;
      patch.goal_comparator = editGoalComparator;
      patch.goal_unit = editGoalUnit.trim() || null;
    }
    onUpdated(habit.id, patch);
    setEditOpen(false);

    startTransition(async () => {
      const res = await updateHabit(habit.id, {
        name: trimmed,
        description: editDescription.trim() || null,
        category: editCategory.trim() || null,
        endDate: editEndDate || null,
        priority: editPriority,
        ...(habit.type === "number"
          ? {
              goalComparator: editGoalComparator,
              goalNumber: parsedGoal,
              goalUnit: editGoalUnit.trim() || null,
            }
          : {}),
      });
      if (res.error) toast.error(res.error);
    });
  }

  function handleLogNumber() {
    const parsed = Number(numericValue);
    if (numericValue.trim() === "" || Number.isNaN(parsed)) {
      toast.error("Enter a number");
      return;
    }
    const previousDates = completedDates;
    const previousLogged = loggedValue;
    // Optimistically reflect the value in the progress bar and flash the
    // button — server error rolls both back.
    setLoggedValue(parsed);
    setJustLogged(true);
    window.setTimeout(() => setJustLogged(false), 1400);
    startTransition(async () => {
      const res = await logNumericValue(habit.id, todayKey, parsed);
      if (res.error) {
        setLoggedValue(previousLogged);
        setJustLogged(false);
        toast.error(res.error);
        return;
      }
      if (res.dayComplete !== undefined) {
        const hasToday = previousDates.includes(todayKey);
        if (res.dayComplete && !hasToday) {
          setCompletedDates((prev) => [...prev, todayKey]);
        } else if (!res.dayComplete && hasToday) {
          setCompletedDates((prev) => prev.filter((d) => d !== todayKey));
        }
      }
    });
  }

  function handleToggleChildBoolean(childId: string) {
    startTransition(async () => {
      const res = await toggleHabitDate(childId, todayKey);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleToggleChildItem(childHabitId: string, itemId: string) {
    startTransition(async () => {
      const res = await toggleChecklistItem(childHabitId, todayKey, itemId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleUnlinkChild(childId: string) {
    startTransition(async () => {
      const res = await removeHabitParent(childId);
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function handleLinkExisting(existingId: string) {
    startTransition(async () => {
      const res = await setHabitParent(existingId, habit.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setSubHabitOpen(false);
      router.refresh();
    });
  }

  function handleCreateSubHabit() {
    const trimmed = newSubHabitName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await createHabit({
        name: trimmed,
        startedAt: todayKey,
        type: "boolean",
      });
      if (res.error || !res.id) {
        toast.error(res.error ?? "Couldn't create sub-habit");
        return;
      }
      const linkRes = await setHabitParent(res.id, habit.id);
      if (linkRes.error) {
        toast.error(linkRes.error);
        return;
      }
      setNewSubHabitName("");
      setSubHabitOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    onDeleted(habit.id);
    startTransition(async () => {
      const res = await deleteHabit(habit.id);
      if (res.error) toast.error(res.error);
    });
  }

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/app/habits/join/${habit.id}`
      : `/app/habits/join/${habit.id}`;

  function handleCopyInviteLink() {
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied");
  }

  function handleSendInvite() {
    // Email delivery (via SES) is a follow-up. For now we just acknowledge
    // that the invite was captured and prompt the user to share the link.
    if (!inviteRecipient.trim()) return;
    toast.success(
      `We'll email ${inviteRecipient.trim()} once we wire up delivery — meanwhile share the link below.`,
    );
    setInviteRecipient("");
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-line p-4 transition-colors",
        tintClass,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-ink">{habit.name}</h3>
            {habit.category ? (
              <span className="rounded-full bg-g-green-pale px-2 py-0.5 text-xs font-semibold text-rf-green-deep">
                {habit.category}
              </span>
            ) : null}
            {habit.type === "checklist" ? (
              <span className="rounded-full bg-g-violet-soft/40 px-2 py-0.5 text-xs font-semibold text-rf-violet">
                Checklist
              </span>
            ) : null}
            {habit.type === "smart_checklist" ? (
              <span className="rounded-full bg-g-violet-soft/40 px-2 py-0.5 text-xs font-semibold text-rf-violet">
                Smart checklist
              </span>
            ) : null}
            {habit.type === "number" ? (
              <span className="rounded-full bg-g-violet-soft/40 px-2 py-0.5 text-xs font-semibold text-rf-violet">
                Number
              </span>
            ) : null}
            {habit.isCollaboration ? (
              <span className="rounded-full bg-g-violet-soft/40 px-2 py-0.5 text-xs font-semibold text-rf-violet">
                Shared with you
              </span>
            ) : null}
          </div>
          {goalBlurb(habit) ? (
            <span className="text-xs text-body-muted">{goalBlurb(habit)}</span>
          ) : null}
          {collaborators.length > 0 ? (
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              className="mt-1 flex items-center gap-2"
            >
              <AvatarGroup
                people={collaborators.map((c) => ({
                  id: c.user_id ?? c.id,
                  label: c.display_name ?? "Someone",
                }))}
              />
              <span className="text-xs font-medium text-body-muted hover:text-ink">
                {collaborators.length} tracking with you · Compare
              </span>
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {habit.type !== "smart_checklist" ? (
            <span
              className={cn(
                "animate-skeleton inline-flex items-center gap-1 text-sm font-semibold",
                streak > 0 ? "text-rf-coral" : "text-body-muted",
              )}
            >
              <Flame size={16} />
              <span className="tabular-nums">{streak}</span>
            </span>
          ) : (
            <span className="tabular-nums text-sm font-semibold text-body-muted">
              {childrenDoneToday}/{children.length} today
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Options for ${habit.name}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "shrink-0 text-body-muted",
              )}
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
                View details
              </DropdownMenuItem>
              {!habit.isCollaboration ? (
                <>
                  <DropdownMenuItem onClick={openEditDialog}>
                    Edit habit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                    Invite a friend
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>{" "}
        </div>
      </div>

      {habit.type === "checklist" ? (
        <div className="flex flex-col gap-2">
          <ChecklistSteps
            items={habit.checklistItems ?? []}
            completedItemIds={completedItemIds}
            onToggle={handleToggleItem}
          />
        </div>
      ) : null}

      {habit.type === "number" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              nativeInput
              value={numericValue}
              onChange={(e) => setNumericValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogNumber();
              }}
              placeholder="0"
              className="h-9 text-sm"
            />
            {habit.goal_unit ? (
              <span className="shrink-0 text-sm text-body-muted">
                {habit.goal_unit}
              </span>
            ) : null}
            <Button
              size="sm"
              onClick={handleLogNumber}
              className={cn(
                "transition-colors",
                justLogged && "bg-rf-green-deep text-white hover:bg-rf-green-deep",
              )}
            >
              {justLogged ? (
                <>
                  <Check className="size-3.5" /> Logged
                </>
              ) : (
                "Log"
              )}
            </Button>
          </div>
          {/* Progress bar toward the goal — only meaningful for
              "at least" / "exactly" comparators (visible progress toward a
              target). For "less than", a bar toward the ceiling doesn't
              map cleanly, so we render just the number instead. */}
          {habit.goal_number != null && habit.goal_number > 0 ? (
            habit.goal_comparator === "less_than" ? (
              <div className="flex items-center justify-between text-xs text-body-muted tabular-nums">
                <span>
                  {loggedValue ?? 0}
                  {habit.goal_unit ? ` ${habit.goal_unit}` : ""}
                </span>
                <span>
                  cap {habit.goal_number}
                  {habit.goal_unit ? ` ${habit.goal_unit}` : ""}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-rf-green-deep transition-[width] duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          ((loggedValue ?? 0) / habit.goal_number) * 100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-body-muted tabular-nums">
                  <span>
                    {loggedValue ?? 0} / {habit.goal_number}
                    {habit.goal_unit ? ` ${habit.goal_unit}` : ""}
                  </span>
                  <span>
                    {Math.round(
                      Math.min(
                        100,
                        ((loggedValue ?? 0) / habit.goal_number) * 100,
                      ),
                    )}
                    %
                  </span>
                </div>
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {habit.type === "smart_checklist" ? (
        <div className="flex flex-col gap-2">
          {children.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-2 text-sm text-body-muted">
              No sub-habits yet — add one below.
            </p>
          ) : (
            children.map((child) => (
              <SmartChecklistChildRow
                key={child.id}
                child={child}
                todayKey={todayKey}
                onToggleBoolean={handleToggleChildBoolean}
                onToggleChildItem={handleToggleChildItem}
                onUnlink={handleUnlinkChild}
              />
            ))
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubHabitOpen(true)}
          >
            <Plus className="size-3.5" />
            Add sub-habit
          </Button>
        </div>
      ) : (
        <HabitHeatmap
          habit={{ ...habit, completed_dates: completedDates }}
          today={today}
          viewMode={viewMode}
          onToggleDate={handleToggleDate}
        />
      )}

      <Dialog open={subHabitOpen} onOpenChange={setSubHabitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a sub-habit to "{habit.name}"</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-body-muted">
                Create a new one
              </span>
              <div className="flex gap-2">
                <Input
                  value={newSubHabitName}
                  onChange={(e) => setNewSubHabitName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateSubHabit();
                  }}
                  placeholder="e.g. Meditation"
                />
                <Button
                  onClick={handleCreateSubHabit}
                  disabled={!newSubHabitName.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
            {linkableHabits.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Or link an existing habit
                </span>
                <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
                  {linkableHabits.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span className="text-sm text-ink">{h.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLinkExisting(h.id)}
                      >
                        Link
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a friend to “{habit.name}”</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6">
            <p className="text-sm text-body-muted">
              Send them your invite link — once they accept, you'll both track "
              {habit.name}" side by side and can compare streaks.
            </p>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="text-sm" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyInviteLink}
                aria-label="Copy invite link"
              >
                <Copy />
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-body-muted">
                Or send it by email
              </span>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={inviteRecipient}
                  onChange={(e) => setInviteRecipient(e.target.value)}
                  placeholder="friend@example.com"
                />
                <Button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={!inviteRecipient.trim()}
                >
                  Send
                </Button>
              </div>
              <span className="text-xs text-body-muted">
                Email delivery is coming soon — for now, share the link
                directly.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compare “{habit.name}”</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 px-6 pb-6">
            <CompareRow
              label="You"
              streak={streak}
              total={completedDates.length}
              highlight
            />
            {collaborators.map((c) => {
              const dates = c.completed_dates ?? [];
              const cStreak = computeStreak(new Set(dates), today);
              return (
                <CompareRow
                  key={c.id}
                  label={c.display_name ?? "Someone"}
                  streak={cStreak}
                  total={dates.length}
                />
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit "{habit.name}"</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6 pb-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-body-muted">Name</span>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Habit name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-body-muted">
                Description
              </span>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-body-muted">
                Category
              </span>
              <Input
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-body-muted">
                End date (optional)
              </span>
              <Input
                type="date"
                nativeInput
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-body-muted">
                Priority
              </span>
              <PriorityPicker
                value={editPriority}
                onChange={setEditPriority}
              />
            </div>

            {habit.type === "number" ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Goal
                </span>
                <div className="flex gap-2">
                  <Select
                    value={editGoalComparator}
                    onValueChange={(v) =>
                      setEditGoalComparator(v as GoalComparator)
                    }
                  >
                    <SelectTrigger className="w-32 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_COMPARATOR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    nativeInput
                    value={editGoalNumber}
                    onChange={(e) => setEditGoalNumber(e.target.value)}
                    placeholder="30"
                    className="w-20 shrink-0"
                  />
                  <Input
                    value={editGoalUnit}
                    onChange={(e) => setEditGoalUnit(e.target.value)}
                    placeholder="pushups a day"
                  />
                </div>
              </div>
            ) : null}

            {habit.type === "checklist" ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-body-muted">
                  Steps
                </span>
                {(habit.checklistItems ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-3 py-2 text-xs text-body-muted">
                    No steps yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {(habit.checklistItems ?? []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5"
                      >
                        <span className="flex-1 text-sm text-ink">
                          {item.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="text-body-muted hover:text-rf-coral"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newStepName}
                    onChange={(e) => setNewStepName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddStep();
                      }
                    }}
                    placeholder="Add a step and press Enter"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddStep}
                    disabled={!newStepName.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{habit.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6">
            {habit.description ? (
              <p className="text-sm line text-body-muted">
                {habit.description}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-line p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-body-muted">
                  Streak
                </p>
                <p className="tabular-nums text-lg font-extrabold text-ink">
                  {habit.type === "smart_checklist" ? "—" : streak}
                </p>
              </div>
              <div className="rounded-xl border border-line p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-body-muted">
                  Total days
                </p>
                <p className="tabular-nums text-lg font-extrabold text-ink">
                  {completedDates.length}
                </p>
              </div>
              <div className="rounded-xl border border-line p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-body-muted">
                  Started
                </p>
                <p className="text-sm font-semibold text-ink">
                  {formatDisplayDate(habit.started_at)}
                </p>
              </div>
              <div className="rounded-xl border border-line p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-body-muted">
                  Ends
                </p>
                <p className="text-sm font-semibold text-ink">
                  {habit.end_date
                    ? formatDisplayDate(habit.end_date)
                    : "No end date"}
                </p>
              </div>
            </div>
            {habit.type !== "smart_checklist" ? (
              <HabitHeatmap
                habit={{ ...habit, completed_dates: completedDates }}
                today={today}
                viewMode="monthly"
                onToggleDate={handleToggleDate}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function HabitsClient({
  initialHabits,
}: {
  initialHabits: HabitListItem[];
}) {
  const [habits, setHabits] = useState<HabitListItem[]>(initialHabits);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("focus");
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<HabitType>("boolean");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startedAt, setStartedAt] = useState(() => dateKey(new Date()));
  const [endDate, setEndDate] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [goalComparator, setGoalComparator] = useState<GoalComparator>("at_least");
  const [goalNumber, setGoalNumber] = useState("");
  const [goalUnit, setGoalUnit] = useState("");
  const [priority, setPriority] = useState<HabitPriority | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function resetForm() {
    setType("boolean");
    setName("");
    setDescription("");
    setCategory("");
    setStartedAt(dateKey(new Date()));
    setEndDate("");
    setChecklistItems([]);
    setNewItemName("");
    setGoalComparator("at_least");
    setGoalNumber("");
    setGoalUnit("");
    setPriority(null);
  }

  function handleAddChecklistItem() {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    setChecklistItems((prev) => [...prev, trimmed]);
    setNewItemName("");
  }

  function handleRemoveChecklistItem(index: number) {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (type === "checklist" && checklistItems.length === 0) {
      toast.error("Add at least one step");
      return;
    }
    const parsedGoal = Number(goalNumber);
    if (type === "number" && (goalNumber.trim() === "" || Number.isNaN(parsedGoal))) {
      toast.error("Set a goal number");
      return;
    }

    setOpen(false);
    const submittedType = type;
    const submittedItems = checklistItems;
    const submittedComparator = goalComparator;
    const submittedUnit = goalUnit;
    const submittedDescription = description.trim() || null;
    const submittedCategory = category.trim() || null;
    const submittedStartedAt = startedAt;
    const submittedEndDate = endDate || null;
    const submittedPriority = priority;
    resetForm();

    startTransition(async () => {
      const res = await createHabit({
        name: trimmed,
        description: submittedDescription,
        category: submittedCategory,
        startedAt: submittedStartedAt,
        endDate: submittedEndDate,
        type: submittedType,
        checklistItems: submittedItems.map((n) => ({ name: n })),
        goalComparator: submittedComparator,
        goalNumber: submittedType === "number" ? parsedGoal : undefined,
        goalUnit: submittedUnit || null,
        priority: submittedPriority,
      });
      if (res.error || !res.id) {
        toast.error(res.error ?? "Couldn't create habit");
        return;
      }

      // Build the full HabitListItem shape from what we submitted + the
      // server-issued ids. This lets the new habit appear immediately, and
      // (crucially) makes its checklist steps toggle-able right away
      // because their ids match what's in the DB — vs. the previous
      // `router.refresh()` which never actually re-hydrated this
      // client-only `habits` state because useState's initializer only
      // runs once. That was the "no response, have to refresh" bug.
      const now = new Date().toISOString();
      const optimistic: HabitListItem = {
        id: res.id,
        user_id: null,
        name: trimmed,
        description: submittedDescription,
        category: submittedCategory,
        started_at: submittedStartedAt,
        end_date: submittedEndDate,
        completed_dates: [],
        owner_display_name: null,
        is_deleted: false,
        created_at: now,
        updated_at: now,
        type: submittedType,
        parent_habit_id: null,
        target_per_week: 7,
        user_goal_period: "daily",
        custom_frequency: null,
        user_goal_category: null,
        color_tag: null,
        estimated_time_minutes: null,
        current_streak: 0,
        best_streak: 0,
        completion_count: 0,
        last_completed_at: null,
        goal_number:
          submittedType === "number" ? parsedGoal : null,
        goal_unit:
          submittedType === "number" ? submittedUnit || null : null,
        goal_comparator:
          submittedType === "number" ? submittedComparator : null,
        priority: submittedPriority,
        isCollaboration: false,
        collaborators: [],
        checklistItems:
          submittedType === "checklist" && res.checklistItemIds
            ? submittedItems.map((itemName, i) => ({
                id: res.checklistItemIds![i],
                habit_id: res.id!,
                name: itemName,
                description: null,
                order_index: i + 1,
                is_optional: false,
                estimated_time_minutes: null,
                is_deleted: false,
                created_at: now,
                updated_at: now,
              }))
            : [],
        todayCompletedItemIds: [],
        todayNumericValue: null,
        children: [],
      };
      setHabits((prev) => [...prev, optimistic]);
      toast.success("Habit added");
    });
  }

  function handleDeleted(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  function handleUpdated(id: string, patch: Partial<HabitListItem>) {
    // Merge the patch into the matching row. `as HabitListItem` is safe here
    // because we're only ever spreading a partial into an existing row of
    // the same shape — the discriminant field (`isCollaboration`) is never
    // in `patch` (nothing calls onUpdated with it).
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? ({ ...h, ...patch } as HabitListItem) : h)),
    );
  }

  /**
   * Focus-view handlers. Each one mirrors the equivalent one on the
   * HabitCard — same server call, same optimistic-then-reconcile shape
   * — but wired to bubble the mutation back through onUpdated so both
   * the Focus and Cards views see the same fresh state instantly
   * (state lives in `habits`; router.refresh() would be a wasted RTT).
   */
  function todayDateKey(): string {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function handleToggleHabitFromFocus(habit: HabitListItem) {
    handleToggleHabitOnDateFromFocus(habit, todayDateKey());
  }

  function handleToggleHabitOnDateFromFocus(
    habit: HabitListItem,
    dateKey: string,
  ) {
    const currentDates = habit.completed_dates ?? [];
    const nextDates = currentDates.includes(dateKey)
      ? currentDates.filter((x) => x !== dateKey)
      : [...currentDates, dateKey];
    handleUpdated(habit.id, { completed_dates: nextDates });

    startTransition(async () => {
      const res = habit.isCollaboration
        ? await toggleCollaboratorDate(habit.id, dateKey)
        : await toggleHabitDate(habit.id, dateKey);
      if (res.error) {
        handleUpdated(habit.id, { completed_dates: currentDates });
        toast.error(res.error);
      }
    });
  }

  function handleToggleChecklistItemFromFocus(
    habitId: string,
    itemId: string,
  ) {
    const todayKey = todayDateKey();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const currentItems = habit.todayCompletedItemIds ?? [];
    const currentDates = habit.completed_dates ?? [];
    const nextItems = currentItems.includes(itemId)
      ? currentItems.filter((x) => x !== itemId)
      : [...currentItems, itemId];
    handleUpdated(habitId, { todayCompletedItemIds: nextItems });

    startTransition(async () => {
      const res = await toggleChecklistItem(habitId, todayKey, itemId);
      if (res.error) {
        handleUpdated(habitId, { todayCompletedItemIds: currentItems });
        toast.error(res.error);
        return;
      }
      // Server tells us whether required-items threshold is now met,
      // which flips `completed_dates` for today. Reconcile that here so
      // FocusView's "done today" split immediately reflects it.
      if (res.dayComplete !== undefined) {
        const hasToday = currentDates.includes(todayKey);
        if (res.dayComplete && !hasToday) {
          handleUpdated(habitId, {
            completed_dates: [...currentDates, todayKey],
          });
        } else if (!res.dayComplete && hasToday) {
          handleUpdated(habitId, {
            completed_dates: currentDates.filter((d) => d !== todayKey),
          });
        }
      }
    });
  }

  function handleLogNumberFromFocus(
    habitId: string,
    dateKey: string,
    value: number,
  ) {
    const todayKey = todayDateKey();
    const isToday = dateKey === todayKey;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const previousValue = habit.todayNumericValue ?? null;
    const previousDates = habit.completed_dates ?? [];
    // todayNumericValue only ever represents "today" in the client state
    // shape — logging a past date doesn't touch it, since there's no
    // per-past-date field to update it into.
    if (isToday) handleUpdated(habitId, { todayNumericValue: value });

    startTransition(async () => {
      const res = await logNumericValue(habitId, dateKey, value);
      if (res.error) {
        if (isToday) handleUpdated(habitId, { todayNumericValue: previousValue });
        toast.error(res.error);
        return;
      }
      if (res.dayComplete !== undefined) {
        const hasDate = previousDates.includes(dateKey);
        if (res.dayComplete && !hasDate) {
          handleUpdated(habitId, {
            completed_dates: [...previousDates, dateKey],
          });
        } else if (!res.dayComplete && hasDate) {
          handleUpdated(habitId, {
            completed_dates: previousDates.filter((d) => d !== dateKey),
          });
        }
      }
    });
  }

  useRegisterFab(
    { label: "Add habit", icon: Plus, onClick: () => setOpen(true) },
    [],
  );

  return (
    <div className="flex w-full flex-col">
      {/* Inline page header — replaces the server PageHeader so the
          Focus/Cards toggle can sit RIGHT NEXT to the "Habits" title on
          mobile instead of stealing its own row below (~40px reclaimed on
          every phone screen). Title alignment/typography match the
          server PageHeader so no other page looks off. */}
      <div className="flex items-center justify-between gap-3 px-4 pt-8 pb-2 md:px-8">
        <h1 className="text-balance text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
          Habits
        </h1>
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            type="button"
            onClick={() => setLayoutMode("focus")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              layoutMode === "focus"
                ? "border-rf-green-deep bg-g-green-pale text-rf-green-deep"
                : "border-line bg-white text-body-muted",
            )}
          >
            Focus
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode("cards")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              layoutMode === "cards"
                ? "border-rf-green-deep bg-g-green-pale text-rf-green-deep"
                : "border-line bg-white text-body-muted",
            )}
          >
            Cards
          </button>
        </div>
      </div>

    <div className="flex flex-col gap-4 px-4 pb-16 md:px-8 mt-4">
      {/* Desktop / tablet — full row with both toggles + Add habit
          button. Hidden on mobile (< md) where Focus/Cards moved into
          the header above and the Add button is replaced by the FAB. */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={layoutMode}
            onValueChange={(value) => setLayoutMode(value as LayoutMode)}
          >
            <TabsList>
              <TabsTab value="focus">Focus</TabsTab>
              <TabsTab value="cards">Cards</TabsTab>
            </TabsList>
          </Tabs>
          {layoutMode === "cards" ? (
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode)}
            >
              <TabsList>
                <TabsTab value="weekly">Weekly</TabsTab>
                <TabsTab value="monthly">Monthly</TabsTab>
              </TabsList>
            </Tabs>
          ) : null}
        </div>
        <ResponsiveDialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
        >
          <ResponsiveDialogTrigger
            render={<Button className="hidden md:inline-flex" />}
          >
            <Plus />
            Add habit
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Add a habit</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <ResponsiveDialogPanel className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                {CREATABLE_HABIT_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-xl border-2 px-2.5 py-2 text-left transition-colors",
                      type === opt.value
                        ? "border-rf-green-deep bg-g-green-pale"
                        : "border-line bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-bold",
                        type === opt.value ? "text-rf-green-deep" : "text-ink",
                      )}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[10px] leading-tight text-body-muted">
                      {opt.description}
                    </span>
                  </button>
                ))}
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Habit name (e.g. Namaz, Water, Gym)"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
              />
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (optional)"
              />
              {type === "checklist" ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-body-muted">
                    Steps
                  </span>
                  {checklistItems.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {checklistItems.map((item, i) => (
                        <div
                          key={`${item}-${i}`}
                          className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5"
                        >
                          <span className="flex-1 text-sm text-ink">
                            {item}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(i)}
                            aria-label={`Remove ${item}`}
                            className="text-body-muted hover:text-rf-coral"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      placeholder="Add a step and press Enter"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddChecklistItem}
                      disabled={!newItemName.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : null}
              {type === "number" ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-body-muted">
                    Goal
                  </span>
                  <div className="flex gap-2">
                    <Select
                      value={goalComparator}
                      onValueChange={(v) => setGoalComparator(v as GoalComparator)}
                    >
                      <SelectTrigger className="w-32 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_COMPARATOR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      nativeInput
                      value={goalNumber}
                      onChange={(e) => setGoalNumber(e.target.value)}
                      placeholder="30"
                      className="w-20 shrink-0"
                    />
                    <Input
                      value={goalUnit}
                      onChange={(e) => setGoalUnit(e.target.value)}
                      placeholder="pushups a day"
                    />
                  </div>
                </div>
              ) : null}
              {type === "smart_checklist" ? (
                <p className="rounded-lg bg-g-violet-soft/30 px-3 py-2 text-xs text-body-muted">
                  You'll add sub-habits (new or existing) from this habit's
                  card once it's created.
                </p>
              ) : null}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Priority
                </span>
                <PriorityPicker
                  value={priority}
                  onChange={setPriority}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <span className="text-xs font-medium text-body-muted">
                    Start date
                  </span>
                  <Input
                    type="date"
                    nativeInput
                    value={startedAt}
                    onChange={(e) => setStartedAt(e.target.value)}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <span className="text-xs font-medium text-body-muted">
                    End date (optional)
                  </span>
                  <Input
                    type="date"
                    nativeInput
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </ResponsiveDialogPanel>
            <ResponsiveDialogFooter>
              <Button onClick={handleCreate} disabled={!name.trim()}>
                Add habit
              </Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>

      {/* Mobile-only Weekly/Monthly chips — only visible when Cards
          layout is active. Focus/Cards toggle itself now lives inline
          with the "Habits" title in the header row above. */}
      {layoutMode === "cards" ? (
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setViewMode("weekly")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              viewMode === "weekly"
                ? "border-body-muted bg-line/40 text-ink"
                : "border-line bg-white text-body-muted",
            )}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              viewMode === "monthly"
                ? "border-body-muted bg-line/40 text-ink"
                : "border-line bg-white text-body-muted",
            )}
          >
            Monthly
          </button>
        </div>
      ) : null}

      {habits.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Flame />
            </EmptyMedia>
            <EmptyTitle>No habits yet</EmptyTitle>
            <EmptyDescription>
              Add a habit to start building your streak.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : layoutMode === "focus" ? (
        <FocusView
          habits={habits}
          onToggleHabit={handleToggleHabitFromFocus}
          onToggleHabitOnDate={handleToggleHabitOnDateFromFocus}
          onToggleChecklistItem={handleToggleChecklistItemFromFocus}
          onLogNumber={handleLogNumberFromFocus}
        />
      ) : (
        // CSS multi-column masonry — plain grid left tall/short cards next
        // to each other with dead space at the bottom of the short one
        // (e.g. a smart_checklist card with 6 children next to a boolean
        // card with a 1-row heatmap). Column layout flows each card as
        // tightly as its content needs, Pinterest-style. Each card is
        // wrapped in a plain div carrying `break-inside-avoid` so a card
        // never splits mid-render across columns, and `mb-4` gives the
        // vertical rhythm the column parent can't (`gap-y` doesn't
        // reliably apply in multi-column). `max-w-sm` on the card itself
        // is dropped since column width now controls sizing.
        <div className="gap-4 sm:columns-2 lg:columns-3">
          {habits.map((habit) => (
            <div key={habit.id} className="mb-4 break-inside-avoid">
              <HabitCard
                habit={habit}
                ownedHabits={habits.filter((h) => !h.isCollaboration)}
                viewMode={viewMode}
                onDeleted={handleDeleted}
                onUpdated={handleUpdated}
              />
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
