"use client";

import { Play, Plus, Square, Timer, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createProject,
  createSession,
  deleteProject,
  deleteSession,
  updateSession,
} from "@/actions/deepwork";
import { TextEffect } from "@/components/text-effect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DeepworkSessionWithProject,
  Project,
} from "@/lib/types/productivity";
import {
  Card,
  CardDescription,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { Frame } from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SlidingNumber } from "../sliding-number";
import { time } from "console";
import { PlusIcon } from "../animated-icons/plus";
import IxProject from "../animated-icons/project";

// See src/lib/uid.ts for why we can't use `crypto.randomUUID()` directly.
import { uid } from "@/lib/uid";

const NO_PROJECT = "__none__";

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function dayLabel(date: Date, today: Date): string {
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function toLocalDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalTimeInput(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function DeepWorkClient({
  initialProjects,
  initialSessions,
  belowMetricsSlot,
}: {
  initialProjects: Project[];
  initialSessions: DeepworkSessionWithProject[];
  /** Rendered right after the Today / Last-7-days / Timer row and BEFORE
      the History list. Used by the page to inject server-fetched charts
      (TimeRange + Waffle) without this client component knowing anything
      about their data shape. */
  belowMetricsSlot?: React.ReactNode;
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [sessions, setSessions] =
    useState<DeepworkSessionWithProject[]>(initialSessions);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(NO_PROJECT);
  const [runningSince, setRunningSince] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const [manualOpen, setManualOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const now = new Date();
  const [manualDate, setManualDate] = useState(() => toLocalDateInput(now));
  const [manualStart, setManualStart] = useState(() => toLocalTimeInput(now));
  const [manualEnd, setManualEnd] = useState(() => toLocalTimeInput(now));
  const [manualProjectId, setManualProjectId] = useState(NO_PROJECT);

  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editProjectId, setEditProjectId] = useState(NO_PROJECT);

  useEffect(() => {
    if (!runningSince) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [runningSince]);

  const elapsedSeconds = runningSince
    ? Math.floor((Date.now() - runningSince.getTime()) / 1000)
    : 0;
  // referenced so the tick state actually drives a re-render each second
  void tick;

  const todaySeconds = useMemo(() => {
    const today = new Date();
    return sessions
      .filter((s) => {
        const d = new Date(s.start_time);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      })
      .reduce((sum, s) => sum + s.duration_in_seconds, 0);
  }, [sessions]);

  const weekSeconds = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    return sessions
      .filter((s) => new Date(s.start_time).getTime() >= weekAgo.getTime())
      .reduce((sum, s) => sum + s.duration_in_seconds, 0);
  }, [sessions]);

  const groupedSessions = useMemo(() => {
    const groups = new Map<string, DeepworkSessionWithProject[]>();
    for (const s of sessions) {
      const d = new Date(s.start_time);
      const key = toLocalDateInput(d);
      const list = groups.get(key) ?? [];
      list.push(s);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [sessions]);

  function handleAddProject() {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    const optimistic: Project = {
      id: uid(),
      user_id: null,
      name: trimmed,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, optimistic]);
    setNewProjectName("");
    startTransition(async () => {
      const res = await createProject(trimmed);
      if (res.error) {
        setProjects((prev) => prev.filter((p) => p.id !== optimistic.id));
        toast.error(res.error);
        return;
      }
      // Swap the optimistic (client-uid) project id for the real one the
      // server just wrote. Without this, if the user immediately starts a
      // focus session against this project, createSession sends the fake
      // id and Postgres rejects the row with a projects_pkey FK violation
      // ("insert or update on table 'deepwork_sessions' violates foreign
      // key constraint 'deepwork_sessions_project_id_fkey'"). Also
      // rewrites `selectedProjectId` if the user had already picked this
      // project in the Start dialog before the server round-trip landed.
      if (res.id) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === optimistic.id ? { ...p, id: res.id as string } : p,
          ),
        );
        setSelectedProjectId((current) =>
          current === optimistic.id ? (res.id as string) : current,
        );
        setManualProjectId((current) =>
          current === optimistic.id ? (res.id as string) : current,
        );
      }
    });
  }

  function handleDeleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(NO_PROJECT);
    startTransition(async () => {
      const res = await deleteProject(id);
      if (res.error) toast.error(res.error);
    });
  }

  function handleConfirmStart() {
    setRunningSince(new Date());
    setStartOpen(false);
  }

  function handleStop() {
    if (!runningSince) return;
    const start = runningSince;
    const end = new Date();
    const durationSeconds = Math.round(
      (end.getTime() - start.getTime()) / 1000,
    );
    setRunningSince(null);

    if (durationSeconds < 1) return;

    const projectId =
      selectedProjectId === NO_PROJECT ? null : selectedProjectId;
    const optimistic: DeepworkSessionWithProject = {
      id: uid(),
      user_id: null,
      project_id: projectId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_in_minutes: Math.round(durationSeconds / 60),
      duration_in_seconds: durationSeconds,
      is_manual_entry: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project: projects.find((p) => p.id === projectId) ?? null,
    };
    setSessions((prev) => [optimistic, ...prev]);

    startTransition(async () => {
      const res = await createSession({
        projectId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        isManualEntry: false,
      });
      if (res.error) {
        setSessions((prev) => prev.filter((s) => s.id !== optimistic.id));
        toast.error(res.error);
      }
    });
  }

  function handleManualSave() {
    const start = new Date(`${manualDate}T${manualStart}:00`);
    const end = new Date(`${manualDate}T${manualEnd}:00`);
    if (end.getTime() <= start.getTime()) {
      toast.error("End time must be after the start time");
      return;
    }
    const durationSeconds = Math.round(
      (end.getTime() - start.getTime()) / 1000,
    );
    const projectId = manualProjectId === NO_PROJECT ? null : manualProjectId;
    const optimistic: DeepworkSessionWithProject = {
      id: uid(),
      user_id: null,
      project_id: projectId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_in_minutes: Math.round(durationSeconds / 60),
      duration_in_seconds: durationSeconds,
      is_manual_entry: true,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project: projects.find((p) => p.id === projectId) ?? null,
    };
    setSessions((prev) => [optimistic, ...prev]);
    setManualOpen(false);

    startTransition(async () => {
      const res = await createSession({
        projectId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        isManualEntry: true,
      });
      if (res.error) {
        setSessions((prev) => prev.filter((s) => s.id !== optimistic.id));
        toast.error(res.error);
      }
    });
  }

  function handleDeleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    startTransition(async () => {
      const res = await deleteSession(id);
      if (res.error) toast.error(res.error);
    });
  }

  function handleOpenEditSession(session: DeepworkSessionWithProject) {
    setEditingSessionId(session.id);
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    setEditDate(toLocalDateInput(start));
    setEditStart(toLocalTimeInput(start));
    setEditEnd(toLocalTimeInput(end));
    setEditProjectId(session.project_id || NO_PROJECT);
  }

  function handleSaveEditSession() {
    if (!editingSessionId) return;
    const start = new Date(`${editDate}T${editStart}:00`);
    const end = new Date(`${editDate}T${editEnd}:00`);
    if (end.getTime() <= start.getTime()) {
      toast.error("End time must be after the start time");
      return;
    }
    const durationSeconds = Math.round(
      (end.getTime() - start.getTime()) / 1000,
    );
    const projectId = editProjectId === NO_PROJECT ? null : editProjectId;
    const previous = sessions.find((s) => s.id === editingSessionId);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === editingSessionId
          ? {
              ...s,
              project_id: projectId,
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              duration_in_seconds: durationSeconds,
              duration_in_minutes: Math.round(durationSeconds / 60),
              updated_at: new Date().toISOString(),
            }
          : s,
      ),
    );
    setEditingSessionId(null);

    startTransition(async () => {
      const res = await updateSession(editingSessionId, {
        projectId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      if (res.error) {
        if (previous) {
          setSessions((prev) =>
            prev.map((s) => (s.id === editingSessionId ? previous : s)),
          );
        }
        toast.error(res.error);
      }
    });
  }

  function handleDeleteEditingSession() {
    if (!editingSessionId) return;
    const session = sessions.find((s) => s.id === editingSessionId);
    if (!session) return;
    setEditingSessionId(null);
    handleDeleteSession(editingSessionId);
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-16 md:px-8 mt-6">
      <div className="grid md:grid-rows-1 grid-rows-2 md:grid-cols-12  gap-3">
        <div className="min-w-0 flex  w-full md:flex-col  row-span-1 max-h-24 col-span-2 md:max-w-44 flex-1">
          <CardFrame className="min-w-0 row-span-1 max-h-24 col-span-2 max-w-44 flex-1">
            <CardFrameHeader className="py-1">
              <CardFrameTitle>Today</CardFrameTitle>
            </CardFrameHeader>
            <Card>
              <CardPanel className="mx-auto min-w-0 py-4">
                <p
                  className={cn(
                    "break-words text-2xl text-center font-bold",
                    // metricTextSizeClass(formatMoneyCompact(monthlyIncome)),
                  )}
                >
                  {formatDuration(todaySeconds)}
                </p>
              </CardPanel>
            </Card>
          </CardFrame>
          <CardFrame className="min-w-0 row-span-1 max-h-24 col-span-2 max-w-44 flex-1">
            <CardFrameHeader className="py-1 mx-auto">
              <CardFrameTitle>Last 7 days</CardFrameTitle>
            </CardFrameHeader>
            <Card>
              <CardPanel className="mx-auto min-w-0 py-4">
                <p
                  className={cn(
                    "break-words text-2xl text-center font-bold",
                    // metricTextSizeClass(formatMoneyCompact(monthlyExpense)),
                  )}
                >
                  {formatDuration(weekSeconds)}
                </p>
              </CardPanel>
            </Card>
          </CardFrame>
        </div>

        <div className="col-span-4">{belowMetricsSlot}</div>
        <div className="flex w-full flex-col col-span-4 relative items-center gap-4 rounded-xl border border-line bg-paper p-6">
          <span className="font-mono text-4xl font-bold tabular-nums text-ink">
            {formatClock(elapsedSeconds)}
          </span>
          {/*
          <div className="flex items-center gap-0.5 font-mono text-5xl">
            <SlidingNumber value={5} padStart={true} />
            <span className="text-zinc-500">:</span>
            <SlidingNumber value={5} padStart={true} /> <span className="text-zinc-500">:</span>
          <SlidingNumber value={5} padStart={true} />
          </div> */}
          {runningSince && selectedProjectId !== NO_PROJECT ? (
            <span className="text-sm text-body-muted">
              {projects.find((p) => p.id === selectedProjectId)?.name}
            </span>
          ) : null}
          {!runningSince ? (
            <Button size="lg" onClick={() => setStartOpen(true)}>
              <Play />
              Start focus session
            </Button>
          ) : (
            <Button size="lg" variant="destructive" onClick={handleStop}>
              <Square />
              Stop &amp; save
            </Button>
          )}
          <div className="flex gap-1 text-sm absolute right-5 top-5 ">
            <Button
              size="icon-lg"
              variant={"ghost"}
              onClick={() => setManualOpen(true)}
              className="text-body-muted underline-offset-2 hover:text-ink hover:underline"
            >
              <PlusIcon />
            </Button>
            <button
              type="button"
              onClick={() => setProjectsOpen(true)}
              className="text-body-muted underline-offset-2 hover:text-ink hover:underline"
            >
              <IxProject className="size-5" />
              {/* Manage projects */}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-body-muted">
          History
        </h2>
        {groupedSessions.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Timer />
              </EmptyMedia>
              <EmptyTitle>No sessions logged yet</EmptyTitle>
              <EmptyDescription>
                Start a focus session or log time manually to see it here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          groupedSessions.map(([dateStr, items]) => {
            const dayTotal = items.reduce(
              (sum, s) => sum + s.duration_in_seconds,
              0,
            );
            return (
              <Frame key={dateStr} className="w-full">
                <Table variant="card">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {dayLabel(new Date(`${dateStr}T00:00:00`), now)}
                      </TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((session) => (
                      <TableRow
                        key={session.id}
                        className="cursor-pointer"
                        onClick={() => handleOpenEditSession(session)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-ink">
                              {session.project?.name ?? "No project"}
                              {session.is_manual_entry ? (
                                <span className="ml-2 text-xs font-normal text-body-muted">
                                  manual
                                </span>
                              ) : null}
                            </span>
                            <span className="text-xs text-body-muted">
                              {new Date(session.start_time).toLocaleTimeString(
                                undefined,
                                { hour: "2-digit", minute: "2-digit" },
                              )}{" "}
                              →{" "}
                              {new Date(session.end_time).toLocaleTimeString(
                                undefined,
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDuration(session.duration_in_seconds)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDuration(dayTotal)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </Frame>
            );
          })
        )}
      </div>

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a focus session</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6">
            <Select
              value={selectedProjectId}
              onValueChange={(v) => setSelectedProjectId(v as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmStart}>
              <Play />
              Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={projectsOpen} onOpenChange={setProjectsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projects</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-6">
            {projects.length === 0 ? (
              <p className="text-sm text-body-muted">
                No projects yet — add one below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-sm text-ink"
                  >
                    {p.name}
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(p.id)}
                      aria-label={`Delete project ${p.name}`}
                      className="text-body-muted hover:text-rf-coral"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddProject();
                }}
                placeholder="New project"
              />
              <Button
                size="icon-sm"
                variant="outline"
                onClick={handleAddProject}
                aria-label="Add project"
              >
                <Plus />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log time manually</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6">
            <Select
              value={manualProjectId}
              onValueChange={(v) => setManualProjectId(v as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              nativeInput
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
            />
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Start
                </span>
                <Input
                  type="time"
                  nativeInput
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">End</span>
                <Input
                  type="time"
                  nativeInput
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleManualSave}>Save session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingSessionId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSessionId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <TextEffect preset="fade-in-blur" per="word" speedReveal={1.5}>
                Edit focus session
              </TextEffect>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6">
            <Select
              value={editProjectId}
              onValueChange={(v) => setEditProjectId(v as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-body-muted">Date</span>
              <Input
                type="date"
                nativeInput
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Started at
                </span>
                <Input
                  type="time"
                  nativeInput
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Ended at
                </span>
                <Input
                  type="time"
                  nativeInput
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-body-muted">
                Duration
              </span>
              <div className="text-sm font-semibold text-ink">
                {editingSessionId
                  ? formatDuration(
                      Math.round(
                        (new Date(`${editDate}T${editEnd}:00`).getTime() -
                          new Date(`${editDate}T${editStart}:00`).getTime()) /
                          1000,
                      ),
                    )
                  : "—"}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteEditingSession}
              className="text-rf-coral hover:text-rf-coral"
            >
              <Trash2 />
              Delete
            </Button>
            <Button onClick={handleSaveEditSession}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
