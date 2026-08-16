// biome-ignore-all lint/suspicious/noArrayIndexKey: static preview cells — index is a stable key here
"use client";

import {
  ArrowDown,
  ArrowUp,
  Download,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_GRID_ROWS,
  GRID_DAYS,
  LIMITS,
} from "@/lib/weekly-goal-tracker/types";

// ---------------------------------------------------------------------------

interface SubtaskDraft {
  id: string;
  text: string;
}
interface TaskDraft {
  id: string;
  text: string;
  subtasks: SubtaskDraft[];
}
interface GoalDraft {
  id: string;
  text: string;
  tasks: TaskDraft[];
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function newGoal(text = ""): GoalDraft {
  return { id: uid(), text, tasks: [] };
}
function newTask(text = ""): TaskDraft {
  return { id: uid(), text, subtasks: [] };
}
function newSubtask(text = ""): SubtaskDraft {
  return { id: uid(), text };
}

/** Drop entirely-blank goals/tasks/subtasks rather than blocking the
    download on them — a builder like this collects half-finished rows
    naturally as people think through their week. */
function toPayloadGoals(goals: GoalDraft[]) {
  return goals
    .filter((g) => g.text.trim())
    .slice(0, LIMITS.maxGoals)
    .map((g) => ({
      text: g.text.trim(),
      tasks: g.tasks
        .filter((t) => t.text.trim())
        .slice(0, LIMITS.maxTasksPerGoal)
        .map((t) => ({
          text: t.text.trim(),
          subtasks: t.subtasks
            .filter((s) => s.text.trim())
            .slice(0, LIMITS.maxSubtasksPerTask)
            .map((s) => ({ text: s.text.trim() })),
        })),
    }));
}

// ---------------------------------------------------------------------------

export function WeeklyGoalBuilder() {
  const [focus, setFocus] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [goals, setGoals] = useState<GoalDraft[]>([newGoal()]);
  const [gridRows, setGridRows] = useState<string[]>([...DEFAULT_GRID_ROWS]);
  const [loadingFilled, setLoadingFilled] = useState(false);
  const [loadingBlank, setLoadingBlank] = useState(false);

  const payloadGoals = useMemo(() => toPayloadGoals(goals), [goals]);

  // ---- goal mutations -------------------------------------------------------
  const addGoal = () => {
    if (goals.length >= LIMITS.maxGoals) {
      toast.error(`You can add up to ${LIMITS.maxGoals} goals`);
      return;
    }
    setGoals((prev) => [...prev, newGoal()]);
  };
  const updateGoal = (id: string, text: string) =>
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, text } : g)));
  const removeGoal = (id: string) =>
    setGoals((prev) => prev.filter((g) => g.id !== id));
  const moveGoal = (id: string, dir: -1 | 1) =>
    setGoals((prev) => {
      const i = prev.findIndex((g) => g.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addTask = (goalId: string) =>
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        if (g.tasks.length >= LIMITS.maxTasksPerGoal) {
          toast.error(`Up to ${LIMITS.maxTasksPerGoal} tasks per goal`);
          return g;
        }
        return { ...g, tasks: [...g.tasks, newTask()] };
      }),
    );
  const updateTask = (goalId: string, taskId: string, text: string) =>
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== goalId
          ? g
          : {
              ...g,
              tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, text } : t)),
            },
      ),
    );
  const removeTask = (goalId: string, taskId: string) =>
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== goalId
          ? g
          : { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) },
      ),
    );

  const addSubtask = (goalId: string, taskId: string) =>
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          tasks: g.tasks.map((t) => {
            if (t.id !== taskId) return t;
            if (t.subtasks.length >= LIMITS.maxSubtasksPerTask) {
              toast.error(`Up to ${LIMITS.maxSubtasksPerTask} subtasks per task`);
              return t;
            }
            return { ...t, subtasks: [...t.subtasks, newSubtask()] };
          }),
        };
      }),
    );
  const updateSubtask = (
    goalId: string,
    taskId: string,
    subId: string,
    text: string,
  ) =>
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== goalId
          ? g
          : {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id !== taskId
                  ? t
                  : {
                      ...t,
                      subtasks: t.subtasks.map((s) =>
                        s.id === subId ? { ...s, text } : s,
                      ),
                    },
              ),
            },
      ),
    );
  const removeSubtask = (goalId: string, taskId: string, subId: string) =>
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== goalId
          ? g
          : {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id !== taskId
                  ? t
                  : { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) },
              ),
            },
      ),
    );

  // ---- grid row mutations ----------------------------------------------------
  const addGridRow = () => {
    if (gridRows.length >= LIMITS.maxGridRows) {
      toast.error(`You can add up to ${LIMITS.maxGridRows} rows`);
      return;
    }
    setGridRows((prev) => [...prev, ""]);
  };
  const updateGridRow = (index: number, value: string) =>
    setGridRows((prev) => prev.map((r, i) => (i === index ? value : r)));
  const removeGridRow = (index: number) =>
    setGridRows((prev) => prev.filter((_, i) => i !== index));
  const moveGridRow = (index: number, dir: -1 | 1) =>
    setGridRows((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  // ---- download ---------------------------------------------------------------
  async function download(blank: boolean) {
    const setLoading = blank ? setLoadingBlank : setLoadingFilled;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-weekly-goal-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: blank ? "" : focus.trim(),
          year: blank ? "" : year.trim(),
          goals: blank ? [] : payloadGoals,
          gridRows: blank ? gridRows.map(() => "") : gridRows,
          blank,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not generate the PDF");
      }
      const pdfBlob = await res.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = blank
        ? "redef-weekly-goal-planner-blank.pdf"
        : "redef-weekly-goal-planner.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Your planner is downloading");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex flex-1 flex-col gap-6 sm:gap-8">
        {/* Step 1 — header line */}
        <section className="flex flex-col gap-3">
          <StepHeading n={1} title="This week's focus" optional />
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[220px] flex flex-col gap-1">
              <Input
                value={focus}
                placeholder="e.g. Ship the v2 launch"
                onChange={(e) => setFocus(e.target.value)}
                aria-label="This week's focus"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Input
                value={year}
                placeholder="2026"
                inputMode="numeric"
                maxLength={4}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
                className="w-24"
                aria-label="Year"
              />
            </div>
          </div>
          <p className="text-xs text-body-muted -mt-1">
            Leave either blank to print an underline instead — fill it in by
            hand later.
          </p>
        </section>

        {/* Step 2 — goals */}
        <section className="flex flex-col gap-3">
          <StepHeading n={2} title="Goals, tasks & subtasks" />
          <p className="text-sm text-body-muted -mt-1">
            Each goal prints as a checkbox line. Add tasks under a goal, and
            subtasks under a task, if you want to break it down further.
          </p>
          <div className="flex flex-col gap-3">
            {goals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                index={i}
                total={goals.length}
                goal={goal}
                onChangeText={(text) => updateGoal(goal.id, text)}
                onRemove={() => removeGoal(goal.id)}
                onMove={(dir) => moveGoal(goal.id, dir)}
                onAddTask={() => addTask(goal.id)}
                onChangeTask={(taskId, text) =>
                  updateTask(goal.id, taskId, text)
                }
                onRemoveTask={(taskId) => removeTask(goal.id, taskId)}
                onAddSubtask={(taskId) => addSubtask(goal.id, taskId)}
                onChangeSubtask={(taskId, subId, text) =>
                  updateSubtask(goal.id, taskId, subId, text)
                }
                onRemoveSubtask={(taskId, subId) =>
                  removeSubtask(goal.id, taskId, subId)
                }
              />
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={addGoal}
            disabled={goals.length >= LIMITS.maxGoals}
          >
            <Plus /> Add goal
          </Button>
        </section>

        {/* Step 3 — grid rows */}
        <section className="flex flex-col gap-3">
          <StepHeading n={3} title="Weekly grid rows" />
          <p className="text-sm text-body-muted -mt-1">
            Columns are fixed — Monday through Sunday. Name each row
            whatever you want to hand-track: work hours, meditation,
            journaling. Leave a row blank to just draw in it.
          </p>
          <div className="flex flex-col gap-2">
            {gridRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-xs font-semibold text-body-muted">
                  {i + 1}
                </span>
                <Input
                  value={row}
                  placeholder={i === 0 ? "Work Hours" : "Leave blank to draw"}
                  onChange={(e) => updateGridRow(i, e.target.value)}
                  aria-label={`Grid row ${i + 1} label`}
                  className="flex-1"
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => moveGridRow(i, -1)}
                  disabled={i === 0}
                  aria-label="Move row up"
                >
                  <ArrowUp />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => moveGridRow(i, 1)}
                  disabled={i === gridRows.length - 1}
                  aria-label="Move row down"
                >
                  <ArrowDown />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => removeGridRow(i)}
                  disabled={gridRows.length <= LIMITS.minGridRows}
                  aria-label="Remove row"
                  className="text-destructive-foreground hover:bg-destructive/8"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={addGridRow}
            disabled={gridRows.length >= LIMITS.maxGridRows}
          >
            <Plus /> Add row
          </Button>
        </section>
      </div>

      {/* Preview + downloads — on mobile this comes FIRST (order-first) so
          you see the live sheet at the top of the page without scrolling
          past the whole builder; on desktop it resets to normal DOM order
          and sticks to the right column instead. */}
      <div className="order-first flex flex-col gap-4 lg:order-none lg:sticky lg:top-6 lg:w-[420px] lg:shrink-0">
        <StepHeading n={4} title="Preview" />
        <SheetPreview
          focus={focus}
          year={year}
          goals={payloadGoals}
          gridRows={gridRows}
        />

        <div className="flex flex-col gap-2">
          <Button
            size="xl"
            className="w-full bg-rf-green-deep shadow-lg shadow-rf-green-deep/20 hover:bg-rf-green-deep/90"
            onClick={() => download(false)}
            loading={loadingFilled}
            disabled={loadingFilled}
          >
            <Download /> Download my planner
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => download(true)}
            loading={loadingBlank}
            disabled={loadingBlank}
          >
            <Download /> Download empty sheet
          </Button>
          <p className="text-center text-xs text-body-muted">
            A4 · 1 page · free, no sign-up
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepHeading({
  n,
  title,
  optional,
}: {
  n: number;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 items-center justify-center rounded-full bg-rf-green-deep text-xs font-semibold text-white">
        {n}
      </span>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {optional && <span className="text-xs text-body-muted">(optional)</span>}
    </div>
  );
}

function GoalCard({
  index,
  total,
  goal,
  onChangeText,
  onRemove,
  onMove,
  onAddTask,
  onChangeTask,
  onRemoveTask,
  onAddSubtask,
  onChangeSubtask,
  onRemoveSubtask,
}: {
  index: number;
  total: number;
  goal: GoalDraft;
  onChangeText: (text: string) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onAddTask: () => void;
  onChangeTask: (taskId: string, text: string) => void;
  onRemoveTask: (taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onChangeSubtask: (taskId: string, subId: string, text: string) => void;
  onRemoveSubtask: (taskId: string, subId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[rgba(55,50,47,0.12)] bg-white p-3 sm:p-4 shadow-xs">
      <div className="flex items-start gap-2">
        <span className="mt-2 hidden text-xs font-semibold text-body-muted sm:inline">
          {index + 1}
        </span>
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              value={goal.text}
              placeholder="Goal — e.g. Launch the new website"
              onChange={(e) => onChangeText(e.target.value)}
              aria-label={`Goal ${index + 1}`}
              className="flex-1"
            />
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              aria-label="Move up"
            >
              <ArrowUp />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => onMove(1)}
              disabled={index === total - 1}
              aria-label="Move down"
            >
              <ArrowDown />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onRemove}
              aria-label="Remove goal"
              className="text-destructive-foreground hover:bg-destructive/8"
            >
              <Trash2 />
            </Button>
          </div>

          {goal.tasks.length > 0 && (
            <div className="flex flex-col gap-2 pl-4 border-l-2 border-[rgba(55,50,47,0.1)]">
              {goal.tasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={task.text}
                      placeholder="Task"
                      onChange={(e) => onChangeTask(task.id, e.target.value)}
                      aria-label="Task"
                      className="flex-1"
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onAddSubtask(task.id)}
                      aria-label="Add subtask"
                      title="Add subtask"
                    >
                      <Plus />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onRemoveTask(task.id)}
                      aria-label="Remove task"
                      className="text-destructive-foreground hover:bg-destructive/8"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  {task.subtasks.length > 0 && (
                    <div className="flex flex-col gap-2 pl-4 border-l-2 border-[rgba(55,50,47,0.08)]">
                      {task.subtasks.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2">
                          <Input
                            value={sub.text}
                            placeholder="Subtask"
                            onChange={(e) =>
                              onChangeSubtask(task.id, sub.id, e.target.value)
                            }
                            aria-label="Subtask"
                            className="flex-1"
                          />
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => onRemoveSubtask(task.id, sub.id)}
                            aria-label="Remove subtask"
                            className="text-destructive-foreground hover:bg-destructive/8"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onAddTask}
            className="inline-flex w-fit items-center gap-1 rounded-full border border-[rgba(55,50,47,0.14)] bg-white px-3 py-1 text-xs font-medium text-ink shadow-xs transition-colors hover:bg-paper"
          >
            <Plus className="size-3 opacity-70" />
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- schematic preview of the printed sheet --------------------------------

interface PreviewGoal {
  text: string;
  tasks: { text: string; subtasks: { text: string }[] }[];
}

function SheetPreview({
  focus,
  year,
  goals,
  gridRows,
}: {
  focus: string;
  year: string;
  goals: PreviewGoal[];
  gridRows: string[];
}) {
  return (
    <div className="flex aspect-[595/842] w-full flex-col rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(55,50,47,0.12),0_8px_24px_rgba(55,50,47,0.1)] sm:p-4">
      {/* header — ~6% */}
      <div className="flex items-end justify-between border-b border-[rgba(55,50,47,0.25)] pb-1.5 mb-2 basis-[6%]">
        <span className="truncate text-[10px] font-semibold text-ink">
          {focus || (
            <span className="inline-block h-[7px] w-24 border-b border-body-muted/50" />
          )}
        </span>
        <span className="text-[11px] font-bold text-ink">
          {year || (
            <span className="inline-block h-[8px] w-8 border-b border-body-muted/50" />
          )}
        </span>
      </div>

      {/* goals — ~44%, grows */}
      <div className="flex-1 basis-[44%] overflow-hidden">
        <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-body-muted">
          Goals
        </span>
        <div className="flex flex-col gap-1">
          {(goals.length > 0
            ? goals
            : [{ text: "", tasks: [{ text: "", subtasks: [] }] }]
          )
            .slice(0, 4)
            .map((g, gi) => (
              <div key={gi} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="inline-block size-1.5 shrink-0 rounded-[1px] border border-[#6b7280]" />
                  {g.text ? (
                    <span className="truncate text-[8px] font-semibold text-ink">
                      {g.text}
                    </span>
                  ) : (
                    <span className="inline-block h-[6px] w-20 border-b border-body-muted/40" />
                  )}
                </div>
                {g.tasks.slice(0, 2).map((t, ti) => (
                  <div key={ti} className="ml-2.5 flex items-center gap-1">
                    <span className="inline-block size-1 shrink-0 rounded-[1px] border border-[#6b7280]" />
                    {t.text ? (
                      <span className="truncate text-[7px] text-ink">
                        {t.text}
                      </span>
                    ) : (
                      <span className="inline-block h-[5px] w-14 border-b border-body-muted/30" />
                    )}
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>

      {/* grid — ~50%. Rows use flex-1 (not a fixed % each) so however many
          rows exist — 1 or all 8 — they evenly divide this band and every
          one of them is actually visible, instead of a hardcoded row cap
          silently hiding rows past a fixed count. */}
      <div className="flex basis-[50%] flex-col overflow-hidden rounded-md border border-[rgba(55,50,47,0.16)]">
        <div className="flex shrink-0 border-b border-[rgba(55,50,47,0.25)] bg-paper">
          <div className="w-[26%] shrink-0 border-r border-[rgba(55,50,47,0.25)]" />
          {GRID_DAYS.map((day) => (
            <div
              key={day}
              className="flex-1 border-r border-[rgba(55,50,47,0.25)] px-0.5 py-1 text-center text-[6.5px] font-semibold text-ink last:border-r-0"
            >
              {day.slice(0, 3)}
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col">
          {gridRows.map((row, i) => (
            <div
              key={i}
              className="flex flex-1 border-b border-[rgba(55,50,47,0.12)] last:border-b-0"
            >
              <div className="flex w-[26%] shrink-0 items-center border-r border-[rgba(55,50,47,0.12)] px-1">
                <span className="truncate text-[6.5px] font-medium text-ink">
                  {row}
                </span>
              </div>
              {GRID_DAYS.map((day) => (
                <div
                  key={day}
                  className="flex-1 border-r border-[rgba(55,50,47,0.12)] last:border-r-0"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
