"use client";

import { Play, Plus, Square, Timer, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createProject,
  createSession,
  deleteProject,
  deleteSession,
} from "@/actions/deepwork";
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

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

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
}: {
  initialProjects: Project[];
  initialSessions: DeepworkSessionWithProject[];
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
  const [, startTransition] = useTransition();

  const now = new Date();
  const [manualDate, setManualDate] = useState(() => toLocalDateInput(now));
  const [manualStart, setManualStart] = useState(() => toLocalTimeInput(now));
  const [manualEnd, setManualEnd] = useState(() => toLocalTimeInput(now));
  const [manualProjectId, setManualProjectId] = useState(NO_PROJECT);

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

  return (
    <div className="flex flex-col gap-6 px-4 pb-16 md:px-8 mt-6">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-body-muted">
            Today
          </p>
          <p className="tabular-nums text-xl font-extrabold text-ink">
            {formatDuration(todaySeconds)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-body-muted">
            Last 7 days
          </p>
          <p className="tabular-nums text-xl font-extrabold text-ink">
            {formatDuration(weekSeconds)}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-paper p-6">
        <span className="font-mono text-4xl font-bold tabular-nums text-ink">
          {formatClock(elapsedSeconds)}
        </span>
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
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="text-body-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Log time manually
          </button>
          <button
            type="button"
            onClick={() => setProjectsOpen(true)}
            className="text-body-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Manage projects
          </button>
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
              <div key={dateStr} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between px-1">
                  <h3 className="text-sm font-semibold text-ink">
                    {dayLabel(new Date(`${dateStr}T00:00:00`), now)}
                  </h3>
                  <span className="tabular-nums text-xs text-body-muted">
                    {formatDuration(dayTotal)}
                  </span>
                </div>
                <div className="rounded-2xl border border-line bg-paper">
                  {items.map((session, i) => (
                    <div
                      key={session.id}
                      className={`flex items-center gap-3 px-3 py-2.5 ${
                        i !== items.length - 1
                          ? "border-b border-line"
                          : ""
                      }`}
                    >
                      <span className="flex-1 text-sm text-ink">
                        {session.project?.name ?? "No project"}
                        {session.is_manual_entry ? (
                          <span className="ml-2 text-xs text-body-muted">
                            manual
                          </span>
                        ) : null}
                      </span>
                      <span className="tabular-nums text-sm font-medium text-body-muted">
                        {formatDuration(session.duration_in_seconds)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteSession(session.id)}
                        aria-label="Delete session"
                        className="text-body-muted"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
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
                <span className="text-xs font-medium text-body-muted">
                  End
                </span>
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
    </div>
  );
}
