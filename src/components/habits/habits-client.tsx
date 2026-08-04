"use client";

import { Copy, Flame, MoreVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createHabit,
  deleteHabit,
  toggleCollaboratorDate,
  toggleHabitDate,
} from "@/actions/habits";
import { useRegisterFab } from "@/components/app-shell/mobile-fab-context";
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
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Habit, HabitListItem } from "@/lib/types/productivity";
import { cn } from "@/lib/utils";

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

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

const WEEKS_BY_MODE: Record<ViewMode, number> = { weekly: 1, monthly: 6 };
const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function buildGridDays(today: Date, weeks: number): Date[] {
  const end = startOfDay(today);
  const gridEnd = addDays(end, 6 - mondayIndex(end));
  const gridStart = addDays(gridEnd, -(weeks * 7 - 1));
  const days: Date[] = [];
  for (let i = 0; i < weeks * 7; i++) days.push(addDays(gridStart, i));
  return days;
}

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
  const gridDays = useMemo(
    () => buildGridDays(today, WEEKS_BY_MODE[viewMode]),
    [today, viewMode],
  );
  const completed = useMemo(
    () => new Set(habit.completed_dates ?? []),
    [habit.completed_dates],
  );
  const startedAt = useMemo(
    () => startOfDay(new Date(habit.started_at)),
    [habit.started_at],
  );
  const todayStart = startOfDay(today);

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="text-center text-[10px] font-medium text-body-muted"
          >
            {label}
          </span>
        ))}
        {gridDays.map((day) => {
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
              className={cn(
                "aspect-square w-full rounded-[4px] border-2 border-transparent transition-[background-color,border-color,scale] active:scale-[0.96]",
                disabled && "opacity-20",
                !disabled && !isDone && "bg-line hover:bg-body-muted/40",
                isDone && "bg-rf-green-deep hover:bg-rf-green-deep/80",
                isToday && "border-rf-coral",
              )}
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

function HabitCard({
  habit,
  viewMode,
  onDeleted,
}: {
  habit: HabitListItem;
  viewMode: ViewMode;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [completedDates, setCompletedDates] = useState<string[]>(
    habit.completed_dates ?? [],
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [inviteRecipient, setInviteRecipient] = useState("");
  const [, startTransition] = useTransition();
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const completedSet = useMemo(() => new Set(completedDates), [completedDates]);
  const streak = useMemo(
    () => computeStreak(completedSet, today),
    [completedSet, today],
  );
  const isDoneToday = completedSet.has(todayKey);
  const collaborators = habit.collaborators;

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

  // suppress unused-var warning while email invites are stubbed
  void router;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-ink">{habit.name}</h3>
            {habit.category ? (
              <span className="rounded-full bg-g-green-pale px-2 py-0.5 text-xs font-semibold text-rf-green-deep">
                {habit.category}
              </span>
            ) : null}
            {habit.isCollaboration ? (
              <span className="rounded-full bg-g-violet-soft/40 px-2 py-0.5 text-xs font-semibold text-rf-violet">
                Shared with you
              </span>
            ) : null}
          </div>
          {habit.description ? (
            <p className="text-sm text-body-muted">{habit.description}</p>
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
                <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                  Invite a friend
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={isDoneToday ? "secondary" : "default"}
          size="sm"
          onClick={() => handleToggleDate(todayKey)}
        >
          {isDoneToday ? "Marked today ✓" : "Mark today"}
        </Button>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-rf-coral">
          <Flame size={16} />
          <span className="tabular-nums">{streak}</span> day
          {streak === 1 ? "" : "s"} streak
        </span>
      </div>

      <HabitHeatmap
        habit={{ ...habit, completed_dates: completedDates }}
        today={today}
        viewMode={viewMode}
        onToggleDate={handleToggleDate}
      />

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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{habit.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6">
            {habit.description ? (
              <p className="text-sm text-body-muted">{habit.description}</p>
            ) : null}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-line p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-body-muted">
                  Streak
                </p>
                <p className="tabular-nums text-lg font-extrabold text-ink">
                  {streak}
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
            <HabitHeatmap
              habit={{ ...habit, completed_dates: completedDates }}
              today={today}
              viewMode="monthly"
              onToggleDate={handleToggleDate}
            />
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
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startedAt, setStartedAt] = useState(() => dateKey(new Date()));
  const [endDate, setEndDate] = useState("");
  const [, startTransition] = useTransition();

  function resetForm() {
    setName("");
    setDescription("");
    setCategory("");
    setStartedAt(dateKey(new Date()));
    setEndDate("");
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const optimistic: HabitListItem = {
      id: uid(),
      user_id: null,
      name: trimmed,
      description: description.trim() || null,
      category: category.trim() || null,
      started_at: startedAt,
      end_date: endDate || null,
      completed_dates: [],
      owner_display_name: null,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isCollaboration: false,
      collaborators: [],
    };
    setHabits((prev) => [...prev, optimistic]);
    setOpen(false);
    resetForm();

    startTransition(async () => {
      const res = await createHabit({
        name: trimmed,
        description: optimistic.description,
        category: optimistic.category,
        startedAt,
        endDate: optimistic.end_date,
      });
      if (res.error) {
        setHabits((prev) => prev.filter((h) => h.id !== optimistic.id));
        toast.error(res.error);
      }
    });
  }

  function handleDeleted(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  useRegisterFab(
    { label: "Add habit", icon: Plus, onClick: () => setOpen(true) },
    [],
  );

  return (
    <div className="flex flex-col gap-5 px-4 pb-16 md:px-8 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
        >
          <TabsList>
            <TabsTab value="weekly">Weekly</TabsTab>
            <TabsTab value="monthly">Monthly</TabsTab>
          </TabsList>
        </Tabs>
        <ResponsiveDialog open={open} onOpenChange={setOpen}>
          <ResponsiveDialogTrigger render={<Button className="hidden md:inline-flex" />}>
            <Plus />
            Add habit
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Add a habit</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <div className="flex flex-col gap-4 px-6">
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
            </div>
            <ResponsiveDialogFooter>
              <Button onClick={handleCreate} disabled={!name.trim()}>
                Add habit
              </Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>

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
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              viewMode={viewMode}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
