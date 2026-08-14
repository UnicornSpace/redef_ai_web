"use client";

import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import {
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlertIcon,
  ListTodo,
  MoreVertical,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { connectGoogleCalendar } from "@/actions/google-calendar";
import { toggleHabitDate } from "@/actions/habits";
import { toggleTaskCompleted } from "@/actions/tasks";
import { LucideCalendarFold } from "@/components/icons/lucide-calendar-fold";
import { TdesignComponentSteps1 } from "@/components/icons/tdesign-component-steps-1";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogPanel,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import type {
  CalendarEvent,
  CalendarEventColor,
  DaySummary,
} from "@/lib/types/calendar";
import { cn } from "@/lib/utils";

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const DOT_COLOR: Record<CalendarEventColor, string> = {
  amber: "var(--rf-amber)",
  blue: "var(--rf-sky)",
  coral: "var(--rf-coral)",
  green: "var(--rf-green-deep)",
  violet: "var(--rf-violet)",
};

function EventDot({ color }: { color: CalendarEventColor }) {
  return (
    <span
      className="size-1.5 shrink-0 rounded-full hidden md:inline-block"
      style={{ background: DOT_COLOR[color] }}
    />
  );
}

function EventPill({ event }: { event: CalendarEvent }) {
  return (
    <div
      // href={"#"}
      //  href={event.href ?? "#"}
      // onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex items-center gap-1 truncate rounded  px-1 py-0.5 text-[10px] text-ink hover:border-rf-green-deep/40",
        event.completed && "text-body-muted line-through",
      )}
    >
      <EventDot color={event.color} />
      <span className="truncate">{event.title}</span>
    </div>
  );
}

type ViewMode = "month" | "week" | "agenda";

const MAX_PILLS_PER_DAY = 3;

/**
 * Compact at-a-glance strip that sits at the bottom of each calendar cell,
 * rendering just the streams that actually have data for that day —
 * anything with a zero count is silent, so empty days genuinely LOOK
 * empty (not falsely padded with "0/0" placeholders).
 *
 * Intentionally NOT a set of rounded pills — that ate too much space in
 * a cell already carrying up to 3 event pills. Plain colored numerals at
 * 10-11px squeeze into ~50px total horizontal and read cleanly.
 *
 * Google events are already surfaced as event pills higher up in the
 * cell, so no separate indicator here for them (that'd be double-counting).
 */
function DayCellSummary({
  summary,
}: {
  summary: DaySummary | undefined;
}) {
  if (!summary) return null;
  const habitsTotal = summary.habits.length;
  const habitsDone = summary.habits.filter((h) => h.done).length;
  const hasHabits = habitsTotal > 0;
  const hasWork = summary.workSeconds > 0;
  const hasFinance = summary.financeCount > 0;
  if (!hasHabits && !hasWork && !hasFinance) return null;

  const hours = summary.workSeconds / 3600;
  const hoursLabel =
    hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;

  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-[10px] font-semibold tabular-nums leading-none">
      {hasHabits ? (
        <span
          className={cn(
            habitsDone === habitsTotal
              ? "text-rf-green-deep"
              : "text-body-muted",
          )}
        >
          {habitsDone}/{habitsTotal}
        </span>
      ) : null}
      {hasWork ? (
        <span className="text-rf-green-deep">{hoursLabel}</span>
      ) : null}
      {hasFinance ? (
        // Hidden on mobile to conserve tap-target width. On md+ the cell
        // has room for it alongside habits + focus without wrapping.
        <span
          className={cn(
            "hidden md:inline",
            summary.financeNet >= 0 ? "text-rf-green-deep" : "text-rf-coral",
          )}
        >
          {summary.financeNet >= 0 ? "+" : "−"}
          {Math.abs(Math.round(summary.financeNet))}
        </span>
      ) : null}
    </div>
  );
}

function MonthView({
  monthDate,
  events,
  daySummaries,
  onSelectDay,
}: {
  monthDate: Date;
  events: CalendarEvent[];
  daySummaries: Record<string, DaySummary>;
  onSelectDay: (date: string) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = e.date;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  return (
    <div className="grid grid-cols-7 gap-1 mt-4">
      {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((label) => (
        <span
          key={label}
          className="text-center text-xs font-bold text-primary"
        >
          {label}
        </span>
      ))}
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayEvents = eventsByDay.get(key) ?? [];
        const visible = dayEvents.slice(0, MAX_PILLS_PER_DAY);
        const overflow = dayEvents.length - visible.length;
        const inMonth = isSameMonth(day, monthDate);
        return (
          <div
            key={key}
            role="button"
            aria-label={`${format(day, "EEEE, MMMM d")} details`}
            tabIndex={0}
            onClick={() => onSelectDay(key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectDay(key);
              }
            }}
            className={cn(
              "flex min-h-20 md:min-h-24  cursor-pointer flex-col gap-1 rounded-xl border border-line p-1.5 transition-colors hover:border-rf-green-deep/40",
              inMonth ? "bg-paper" : "bg-transparent opacity-40",
              isToday(day) && "border-rf-green-deep",
            )}
          >
            <span
              className={cn(
                "text-xs ml-1 mt-1 font-semibold text-body-muted",
                isToday(day) && "text-rf-green-deep",
              )}
            >
              {format(day, "d")}
            </span>
            <div className="flex flex-col gap-0">
              {visible.map((event) => (
                <EventPill key={event.id} event={event} />
              ))}
              {overflow > 0 ? (
                <Popover>
                  <PopoverTrigger
                    onClick={(e) => e.stopPropagation()}
                    className="text-left text-[11px] font-semibold text-body-muted hover:text-ink"
                  >
                    +{overflow} more
                  </PopoverTrigger>
                  <PopoverContent className="flex w-56 flex-col gap-1.5">
                    <span className="text-xs font-semibold text-body-muted">
                      {format(day, "EEEE, MMM d")}
                    </span>
                    {dayEvents.map((event) => (
                      <EventPill key={event.id} event={event} />
                    ))}
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
            {/* Strip showing which streams touched this day — silent for
                any stream with zero data, so a truly empty day still
                renders empty. */}
            <DayCellSummary summary={daySummaries[key]} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * 7-day view of the Mon-Sun week containing `focusDate`. Cells are the
 * same shape as MonthView's but taller and unclamped on pill count — you
 * see every scheduled event for the week without overflow popovers. The
 * day-detail dialog still opens on click (via the same `onSelectDay`
 * callback), keeping muscle memory consistent across the two views.
 */
function WeekView({
  focusDate,
  events,
  daySummaries,
  onSelectDay,
}: {
  focusDate: Date;
  events: CalendarEvent[];
  daySummaries: Record<string, DaySummary>;
  onSelectDay: (date: string) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(focusDate, { weekStartsOn: 1 });
    const end = endOfWeek(focusDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [focusDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  return (
    <div className="grid px-2 md:grid-cols-7 gap-1 mt-4">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayEvents = eventsByDay.get(key) ?? [];
        return (
          <div
            key={key}
            role="button"
            aria-label={`${format(day, "EEEE, MMMM d")} details`}
            tabIndex={0}
            onClick={() => onSelectDay(key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectDay(key);
              }
            }}
            className={cn(
              "flex min-h-40 cursor-pointer flex-col gap-1 rounded-xl border border-line bg-paper p-2 transition-colors hover:border-rf-green-deep/40 md:min-h-56",
              isToday(day) && "border-rf-green-deep",
            )}
          >
            <div className="flex items-baseline justify-between px-1">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide text-body-muted",
                  isToday(day) && "text-rf-green-deep",
                )}
              >
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold text-ink",
                  isToday(day) && "text-rf-green-deep",
                )}
              >
                {format(day, "d")}
              </span>
            </div>
            {/* No MAX cap here — a week cell has enough vertical space
                for the full day's events, so we don't need the
                overflow-popover pattern MonthView uses. */}
            <div className="flex flex-col gap-0">
              {dayEvents.map((event) => (
                <EventPill key={event.id} event={event} />
              ))}
            </div>
            <DayCellSummary summary={daySummaries[key]} />
          </div>
        );
      })}
    </div>
  );
}

function AgendaView({ events }: { events: CalendarEvent[] }) {
  const today = useMemo(() => new Date(), []);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [events]);

  if (grouped.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListTodo />
          </EmptyMedia>
          <EmptyTitle>Nothing scheduled</EmptyTitle>
          <EmptyDescription>
            Add a due date to a task in Tasks to see it show up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-2 py-4">
      {grouped.map(([date, items]) => {
        const day = parseISO(date);
        return (
          <div key={date} className="flex flex-col gap-1">
            <h3
              className={cn(
                "px-1 text-sm font-semibold text-ink",
                isSameDay(day, today) && "text-rf-green-deep",
              )}
            >
              {isSameDay(day, today) ? "Today" : format(day, "EEEE, MMM d")}
            </h3>
            <div className="rounded-2xl border border-line bg-paper">
              {items.map((event, i) => (
                <Link
                  key={event.id}
                  href={event.href ?? "#"}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-white/60",
                    i !== items.length - 1 && "border-b border-line",
                  )}
                >
                  <EventDot color={event.color} />
                  <Checkbox checked={event.completed} />
                  <span
                    className={cn(
                      "flex-1",
                      event.completed && "text-body-muted line-through",
                    )}
                  >
                    {event.title} 
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function CalendarClient({
  events,
  daySummaries,
  googleCalendarConnected,
}: {
  events: CalendarEvent[];
  daySummaries: Record<string, DaySummary>;
  googleCalendarConnected: boolean;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  // Single source of truth for what the calendar is centered on. Month
  // view treats it as "the month containing this date", week view as
  // "the week containing this date"; the prev/next buttons step it by
  // the current view's unit. Kept as `focusDate` (not `monthDate`) since
  // it's no longer month-specific.
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isConnecting, startConnectTransition] = useTransition();

  function handleConnectGoogleCalendar() {
    startConnectTransition(async () => {
      const res = await connectGoogleCalendar();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.url) window.location.href = res.url;
    });
  }

  // Nav semantics: step by month in month view, by week in week view. In
  // agenda view the header hides the nav entirely (nothing to page).
  function stepPrev() {
    setFocusDate((d) => (viewMode === "week" ? subWeeks(d, 1) : subMonths(d, 1)));
  }
  function stepNext() {
    setFocusDate((d) => (viewMode === "week" ? addWeeks(d, 1) : addMonths(d, 1)));
  }

  // Label shown between the prev/next buttons. Week view shows the actual
  // week range (Mon-Sun), month view shows the month. Compact variants
  // for the mobile header.
  function periodLabel(compact: boolean): string {
    if (viewMode === "week") {
      const start = startOfWeek(focusDate, { weekStartsOn: 1 });
      const end = endOfWeek(focusDate, { weekStartsOn: 1 });
      if (isSameMonth(start, end)) {
        return compact
          ? `${format(start, "MMM d")}–${format(end, "d")}`
          : `${format(start, "MMM d")} – ${format(end, "d")}`;
      }
      return compact
        ? `${format(start, "MMM d")}–${format(end, "MMM d")}`
        : `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
    }
    return compact ? format(focusDate, "MMM yyyy") : format(focusDate, "MMMM yyyy");
  }

  return (
    <div className="flex flex-col gap-4 px-1 pb-16 md:px-8 mt-6">
      {/* Desktop / tablet header — full Month/Week/Timeline tabs,
          spelled-out period label, and the nav + Today controls all
          visible at once. */}
      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList>
              <TabsTab value="month">Month</TabsTab>
              <TabsTab value="week">Week</TabsTab>
              <TabsTab value="agenda">Timeline</TabsTab>
            </TabsList>
          </Tabs>
          <Button
            variant="default"
            size="sm"
            render={<Link href="/app/tasks" />}
          >
            <Plus />
            Add task
          </Button>
          {/* {!googleCalendarConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectGoogleCalendar}
              disabled={isConnecting}
            >
              <CalendarPlus />
              Connect Google Calendar
            </Button>
          ) : null} */}
        </div>
        {viewMode !== "agenda" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={viewMode === "week" ? "Previous week" : "Previous month"}
              onClick={stepPrev}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-36 text-center text-sm font-semibold text-ink">
              {periodLabel(false)}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={viewMode === "week" ? "Next week" : "Next month"}
              onClick={stepNext}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFocusDate(new Date())}
            >
              Today
            </Button>
          </div>
        ) : null}
      </div>

      {/* Mobile header — period nav on the left (hidden in agenda view
          since there's nothing to page), "Add task" + a "..." menu (view
          switcher + Today) on the right, so it fits in one row. */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        {viewMode !== "agenda" ? (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={viewMode === "week" ? "Previous week" : "Previous month"}
              onClick={stepPrev}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-[5.5rem] text-center text-sm font-semibold text-ink">
              {periodLabel(true)}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={viewMode === "week" ? "Next week" : "Next month"}
              onClick={stepNext}
            >
              <ChevronRight />
            </Button>
          </div>
        ) : (
          <span className="text-sm font-semibold text-ink">Timeline</span>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            render={<Link href="/app/tasks" />}
          >
            <Plus />
            Add task
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Calendar options"
              className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode("month")}>
                <LucideCalendarFold />
                Month
                {viewMode === "month" ? (
                  <Check className="ml-auto text-rf-green-deep" />
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("week")}>
                <LucideCalendarFold />
                Week
                {viewMode === "week" ? (
                  <Check className="ml-auto text-rf-green-deep" />
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("agenda")}>
                <TdesignComponentSteps1 />
                Timeline
                {viewMode === "agenda" ? (
                  <Check className="ml-auto text-rf-green-deep" />
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFocusDate(new Date())}>
                Today
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {viewMode === "month" ? (
        <MonthView
          monthDate={focusDate}
          events={events}
          daySummaries={daySummaries}
          onSelectDay={setSelectedDate}
        />
      ) : viewMode === "week" ? (
        <WeekView
          focusDate={focusDate}
          events={events}
          daySummaries={daySummaries}
          onSelectDay={setSelectedDate}
        />
      ) : (
        <AgendaView events={events} />
      )}

      <DayDetailDialog
        date={selectedDate}
        summary={selectedDate ? daySummaries[selectedDate] : undefined}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}

function DayDetailDialog({
  date,
  summary,
  onClose,
}: {
  date: string | null;
  summary: DaySummary | undefined;
  onClose: () => void;
}) {
  // Local completed-state overlay so checkbox toggles feel instant, without
  // re-fetching the whole calendar view. The server action still persists.
  const [localCompleted, setLocalCompleted] = useState<Record<string, boolean>>(
    {},
  );
  const [localHabitDone, setLocalHabitDone] = useState<Record<string, boolean>>(
    {},
  );
  const [, startTransition] = useTransition();

  function isTaskDone(taskId: string, serverCompleted: boolean): boolean {
    return localCompleted[taskId] ?? serverCompleted;
  }

  function handleToggleTask(taskId: string, currentDone: boolean) {
    const next = !currentDone;
    setLocalCompleted((prev) => ({ ...prev, [taskId]: next }));
    startTransition(async () => {
      const res = await toggleTaskCompleted(taskId, next);
      if (res.error) {
        setLocalCompleted((prev) => ({ ...prev, [taskId]: currentDone }));
        toast.error(res.error);
      }
    });
  }

  // Keyed by "habitId:date" — a habit's done-ness is per-day, and this
  // dialog instance persists across different selected days without
  // remounting, so a plain habitId key would leak state between days.
  function isHabitDone(habitId: string, serverDone: boolean): boolean {
    const key = `${habitId}:${date}`;
    return localHabitDone[key] ?? serverDone;
  }

  function handleToggleHabit(habitId: string, currentDone: boolean) {
    if (!date) return;
    const key = `${habitId}:${date}`;
    const next = !currentDone;
    setLocalHabitDone((prev) => ({ ...prev, [key]: next }));
    startTransition(async () => {
      const res = await toggleHabitDate(habitId, date);
      if (res.error) {
        setLocalHabitDone((prev) => ({ ...prev, [key]: currentDone }));
        toast.error(res.error);
      }
    });
  }

  return (
    <ResponsiveDialog
      open={date !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {date ? format(parseISO(date), "EEEE, MMMM d") : ""}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogPanel className="flex flex-col gap-4">
          {!summary ||
          (summary.tasks.length === 0 &&
            summary.habits.length === 0 &&
            summary.financeCount === 0 &&
            summary.workSeconds === 0 &&
            summary.googleEvents.length === 0) ? (
            <p className="text-sm text-body-muted">
              Nothing recorded for this day.
            </p>
          ) : (
            <>
              {summary.tasks.length > 0 ? (
                <div className="flex mt-4 flex-col gap-1.5">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-body-muted">
                    Tasks
                  </h4>
                  <div>
                    {summary.tasks.map((t) => {
                      const done = isTaskDone(t.id, t.completed);
                      const checkboxId = `day-task-${t.id}`;
                      return (
                        <label
                          key={t.id}
                          htmlFor={checkboxId}
                          className="flex cursor-pointer items-center gap-2 py-1"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={done}
                            onCheckedChange={() => handleToggleTask(t.id, done)}
                          />
                          <span
                            className={cn(
                              "text-sm text-ink",
                              done && "text-body-muted line-through",
                            )}
                          >
                            {t.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {summary.habits.length > 0 ? (
                <div className="flex mt-4 flex-col gap-1.5">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-body-muted">
                    Habits
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.habits.map((h) => {
                      const done = isHabitDone(h.id, h.done);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => handleToggleHabit(h.id, done)}
                          className="flex w-full max-w-20 flex-col items-center gap-1 active:scale-[0.96]"
                          aria-label={`${done ? "Unmark" : "Mark"} ${h.name}`}
                          aria-pressed={done}
                        >
                          <div
                            className={cn(
                              "size-14 rounded-lg transition-colors",
                              done
                                ? "bg-rf-green-deep hover:bg-rf-green-deep/80"
                                : "bg-line hover:bg-body-muted/40",
                            )}
                          />
                          <p className="text-ink text-xs text-center">
                            {h.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {summary.workSeconds > 0 ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
                    Deep work
                  </span>
                  <span className="tabular-nums text-sm font-semibold text-ink">
                    {formatDuration(summary.workSeconds)}
                  </span>
                </div>
              ) : null}
              {summary.financeCount > 0 ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
                      Personal finance
                    </span>
                    <span className="text-xs text-body-muted">
                      {summary.financeCount} transaction
                      {summary.financeCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "tabular-nums text-sm font-semibold",
                      summary.financeNet >= 0
                        ? "text-rf-green-deep"
                        : "text-rf-coral",
                    )}
                  >
                    {summary.financeNet >= 0 ? "+" : "−"}
                    {Math.abs(summary.financeNet)}
                  </span>
                </div>
              ) : null}
              {summary.googleEvents.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-body-muted">
                    Google Calendar
                  </h4>
                  <div className="flex flex-col gap-1">
                    {summary.googleEvents.map((ge) => (
                      <div
                        key={ge.id}
                        className="flex items-center gap-2 rounded-lg border border-line px-3 py-2"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: "var(--rf-sky)" }}
                        />
                        <span className="truncate text-sm text-ink">
                          {ge.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </ResponsiveDialogPanel>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
