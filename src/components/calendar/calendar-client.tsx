"use client";

import {
  addMonths,
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
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlertIcon,
  ListTodo,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleTaskCompleted } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type ViewMode = "month" | "agenda";

const MAX_PILLS_PER_DAY = 3;

function MonthView({
  monthDate,
  events,
  onSelectDay,
}: {
  monthDate: Date;
  events: CalendarEvent[];
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
    <div className="flex flex-col gap-4">
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
}: {
  events: CalendarEvent[];
  daySummaries: Record<string, DaySummary>;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 px-1 pb-16 md:px-8 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList>
              <TabsTab value="month">Month</TabsTab>
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
        </div>
        {viewMode === "month" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => setMonthDate((d) => subMonths(d, 1))}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-28 text-center text-sm font-semibold text-ink">
              {format(monthDate, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => setMonthDate((d) => addMonths(d, 1))}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMonthDate(new Date())}
            >
              Today
            </Button>
          </div>
        ) : null}
      </div>

      {viewMode === "month" ? (
        <MonthView
          monthDate={monthDate}
          events={events}
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

  return (
    <Dialog open={date !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {date ? format(parseISO(date), "EEEE, MMMM d") : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-6 pb-6">
          {!summary ||
          (summary.tasks.length === 0 &&
            summary.habits.length === 0 &&
            summary.financeCount === 0 &&
            summary.workSeconds === 0) ? (
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
                    Habits done
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.habits.map((h) => (
                      <div
                        key={h.id}
                        className="w-full max-w-20 flex flex-col items-center gap-1"
                      >
                        <div className="bg-green-600 size-14 rounded-lg"></div>
                        <p className="text-black text-xs text-center">
                          {h.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {summary.workSeconds > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-body-muted">
                    Deep work
                  </h4>
                  <p className="text-sm text-ink">
                    {formatDuration(summary.workSeconds)} logged
                  </p>
                </div>
              ) : null}
              {summary.financeCount > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-body-muted">
                    Personal finance
                  </h4>
                  <p className="text-sm text-ink">
                    {summary.financeCount} transaction
                    {summary.financeCount === 1 ? "" : "s"} — net{" "}
                    <span className="tabular-nums">
                      {summary.financeNet >= 0 ? "+" : "-"}
                      {Math.abs(summary.financeNet).toFixed(2)}
                    </span>
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
