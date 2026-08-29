"use client";

import { ListChecks, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createTask,
  deleteTask,
  toggleTaskCompleted,
  updateTaskDueDate,
  updateTaskLabels,
} from "@/actions/tasks";
import { useRegisterFab } from "@/components/app-shell/mobile-fab-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Frame } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogPanel,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { isShoppingTask, SHOPPING_LABEL } from "@/lib/tasks";
import type { Task } from "@/lib/types/productivity";
import { uid } from "@/lib/uid";
import { cn } from "@/lib/utils";

type Filter = "active" | "all" | "completed";
type Tab = "tasks" | "shopping";
const NO_DATE_KEY = "__no_date__";

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShortDate(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function dueDateGroupLabel(key: string, todayKey: string): string {
  if (key === NO_DATE_KEY) return "No due date";
  if (key === todayKey) return "Today";
  if (key < todayKey) return `Overdue · ${formatShortDate(key)}`;
  return formatShortDate(key);
}

/**
 * Minimal tag input — chips + a text field, Enter/comma to add, Backspace
 * on an empty field to pop the last chip. There's no generic multi-select
 * tag component anywhere in this codebase yet, and one purpose-built for
 * task labels is simpler than a reusable abstraction for a single use.
 */
function LabelInput({
  labels,
  onChange,
  suggestions,
  listId,
}: {
  labels: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  listId: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    setDraft("");
    if (!trimmed) return;
    if (labels.some((l) => l.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...labels, trimmed]);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white px-2 py-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
            label.trim().toLowerCase() === SHOPPING_LABEL
              ? "bg-g-amber-pale text-rf-amber"
              : "bg-line text-ink",
          )}
        >
          {label}
          <button
            type="button"
            onClick={() => onChange(labels.filter((l) => l !== label))}
            aria-label={`Remove label ${label}`}
            className="opacity-70 hover:opacity-100"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && draft === "" && labels.length > 0) {
            onChange(labels.slice(0, -1));
          }
        }}
        onBlur={commit}
        list={listId}
        placeholder={labels.length === 0 ? "Add labels..." : ""}
        className="min-w-24 flex-1 border-0 bg-transparent py-0.5 text-sm text-ink outline-none placeholder:text-body-muted"
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

export function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [name, setName] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [addOpen, setAddOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [shoppingItemName, setShoppingItemName] = useState("");
  const shoppingInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const detailTask = tasks.find((t) => t.id === detailTaskId) ?? null;
  const todayKey = todayIso();

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) for (const l of t.labels) set.add(l);
    return Array.from(set).sort();
  }, [tasks]);

  // Shopping items are a completely separate list — pulled out here once
  // so neither the main table nor its counts ever see them.
  const mainTasks = useMemo(
    () => tasks.filter((t) => !isShoppingTask(t.labels)),
    [tasks],
  );
  const shoppingTasks = useMemo(
    () => tasks.filter((t) => isShoppingTask(t.labels)),
    [tasks],
  );

  const filtered = useMemo(() => {
    if (filter === "active") return mainTasks.filter((t) => !t.is_completed);
    if (filter === "completed") return mainTasks.filter((t) => t.is_completed);
    return mainTasks;
  }, [mainTasks, filter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const t of filtered) {
      const key = t.due_date ?? NO_DATE_KEY;
      const list = groups.get(key) ?? [];
      list.push(t);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === NO_DATE_KEY) return 1;
      if (b === NO_DATE_KEY) return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const activeCount = mainTasks.filter((t) => !t.is_completed).length;
  const shoppingActiveCount = shoppingTasks.filter((t) => !t.is_completed).length;

  function resetAddForm() {
    setName("");
    setLabels([]);
    setDueDate("");
  }

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const optimistic: Task = {
      id: uid(),
      user_id: null,
      name: trimmed,
      labels,
      due_date: dueDate || null,
      is_completed: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);
    setAddOpen(false);
    resetAddForm();
    startTransition(async () => {
      const res = await createTask({
        name: trimmed,
        labels: optimistic.labels,
        dueDate: optimistic.due_date,
      });
      if (res.error) {
        setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
        toast.error(res.error);
      }
    });
  }

  function handleAddShoppingItem() {
    const trimmed = shoppingItemName.trim();
    if (!trimmed) return;
    const optimistic: Task = {
      id: uid(),
      user_id: null,
      name: trimmed,
      labels: ["Buy"],
      due_date: null,
      is_completed: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);
    setShoppingItemName("");
    startTransition(async () => {
      const res = await createTask({
        name: trimmed,
        labels: ["Buy"],
        dueDate: null,
      });
      if (res.error) {
        setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
        toast.error(res.error);
      }
    });
  }

  function handleToggle(task: Task) {
    const nextCompleted = !task.is_completed;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, is_completed: nextCompleted } : t,
      ),
    );
    startTransition(async () => {
      const res = await toggleTaskCompleted(task.id, nextCompleted);
      if (res.error) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, is_completed: task.is_completed } : t,
          ),
        );
        toast.error(res.error);
      }
    });
  }

  function handleDelete(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    startTransition(async () => {
      const res = await deleteTask(task.id);
      if (res.error) {
        setTasks((prev) => [...prev, task]);
        toast.error(res.error);
      }
    });
  }

  function handleDueDateChange(task: Task, nextDate: string) {
    const previous = task.due_date;
    const value = nextDate || null;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, due_date: value } : t)),
    );
    startTransition(async () => {
      const res = await updateTaskDueDate(task.id, value);
      if (res.error) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, due_date: previous } : t,
          ),
        );
        toast.error(res.error);
      }
    });
  }

  function handleLabelsChange(task: Task, nextLabels: string[]) {
    const previous = task.labels;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, labels: nextLabels } : t)),
    );
    startTransition(async () => {
      const res = await updateTaskLabels(task.id, nextLabels);
      if (res.error) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, labels: previous } : t)),
        );
        toast.error(res.error);
      }
    });
  }

  useRegisterFab(
    {
      label: activeTab === "shopping" ? "Add item" : "Add task",
      icon: Plus,
      onClick: () =>
        activeTab === "shopping"
          ? shoppingInputRef.current?.focus()
          : setAddOpen(true),
    },
    [activeTab],
  );

  return (
    <div className="flex flex-col gap-5 px-4 pb-16 md:px-8">
      <div className="flex items-center justify-between gap-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList>
            <TabsTab value="tasks">Tasks</TabsTab>
            <TabsTab value="shopping">
              Shopping list
              {shoppingActiveCount > 0 ? ` (${shoppingActiveCount})` : ""}
            </TabsTab>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "shopping" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              ref={shoppingInputRef}
              value={shoppingItemName}
              onChange={(e) => setShoppingItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddShoppingItem();
              }}
              placeholder="Add an item to buy..."
              className="flex-1"
            />
            <Button
              onClick={handleAddShoppingItem}
              disabled={!shoppingItemName.trim()}
            >
              <Plus />
              Add
            </Button>
          </div>
          {shoppingTasks.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingCart />
                </EmptyMedia>
                <EmptyTitle>Nothing to buy</EmptyTitle>
                <EmptyDescription>
                  Add an item above, or say "add milk to my shopping list" in
                  Talk.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-2xl border border-line bg-paper">
              {shoppingTasks.map((task, i) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5",
                    i !== shoppingTasks.length - 1 && "border-b border-line",
                  )}
                >
                  <Checkbox
                    checked={task.is_completed}
                    onCheckedChange={() => handleToggle(task)}
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm text-ink",
                      task.is_completed && "text-body-muted line-through",
                    )}
                  >
                    {task.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(task)}
                    aria-label={`Remove ${task.name}`}
                    className="text-body-muted hover:text-rf-coral"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="hidden flex-col gap-2 rounded-2xl border border-line bg-paper p-3 sm:flex-row sm:items-center md:flex">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="Add a task..."
              className="flex-1"
            />
            <div className="flex flex-wrap gap-2">
              <div className="w-56">
                <LabelInput
                  labels={labels}
                  onChange={setLabels}
                  suggestions={allLabels}
                  listId="task-label-suggestions-toolbar"
                />
              </div>
              <Input
                type="date"
                nativeInput
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-36"
              />
              <Button onClick={handleAdd} disabled={!name.trim()}>
                <Plus />
                Add
              </Button>
            </div>
          </div>

          <ResponsiveDialog
            open={addOpen}
            onOpenChange={(open) => {
              setAddOpen(open);
              if (!open) resetAddForm();
            }}
          >
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Add a task</ResponsiveDialogTitle>
              </ResponsiveDialogHeader>
              <ResponsiveDialogPanel className="flex flex-col gap-4">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Task name"
                />
                <LabelInput
                  labels={labels}
                  onChange={setLabels}
                  suggestions={allLabels}
                  listId="task-label-suggestions-dialog"
                />
                <Input
                  type="date"
                  nativeInput
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </ResponsiveDialogPanel>
              <ResponsiveDialogFooter>
                <Button onClick={handleAdd} disabled={!name.trim()}>
                  Add task
                </Button>
              </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as Filter)}
            >
              <TabsList>
                <TabsTab value="active">Active</TabsTab>
                <TabsTab value="all">All</TabsTab>
                <TabsTab value="completed">Completed</TabsTab>
              </TabsList>
            </Tabs>
            <span className="text-sm text-body-muted">{activeCount} left</span>
          </div>

          {grouped.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListChecks />
                </EmptyMedia>
                <EmptyTitle>
                  {filter === "completed" ? "Nothing completed yet" : "All clear"}
                </EmptyTitle>
                <EmptyDescription>
                  {filter === "completed"
                    ? "Finished tasks will show up here."
                    : "Add your first task above to get started."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              {grouped.map(([dateKey, items]) => (
                <Frame key={dateKey} className="w-full">
                  <Table variant="card">
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className={cn(
                            dateKey !== NO_DATE_KEY &&
                              dateKey < todayKey &&
                              "text-rf-coral",
                          )}
                        >
                          {dueDateGroupLabel(dateKey, todayKey)}
                        </TableHead>
                        <TableHead className="text-right">Labels</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((task) => (
                        <TableRow
                          key={task.id}
                          className="cursor-pointer"
                          onClick={() => setDetailTaskId(task.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Checkbox
                                checked={task.is_completed}
                                onCheckedChange={() => handleToggle(task)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span
                                className={cn(
                                  "text-sm",
                                  task.is_completed
                                    ? "text-body-muted line-through"
                                    : "text-ink",
                                )}
                              >
                                {task.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              {task.labels.map((label) => (
                                <Badge key={label} variant="outline">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Frame>
              ))}
            </div>
          )}
        </>
      )}

      <ResponsiveDialog
        open={detailTask !== null}
        onOpenChange={(open) => !open && setDetailTaskId(null)}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {detailTask?.name ?? "Task"}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          {detailTask ? (
            <ResponsiveDialogPanel className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Labels
                </span>
                <LabelInput
                  labels={detailTask.labels}
                  onChange={(next) => handleLabelsChange(detailTask, next)}
                  suggestions={allLabels}
                  listId="task-label-suggestions-detail"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-body-muted">
                  Due date
                </span>
                <Input
                  type="date"
                  nativeInput
                  value={detailTask.due_date ?? ""}
                  onChange={(e) =>
                    handleDueDateChange(detailTask, e.target.value)
                  }
                />
              </div>
              <Button
                variant={detailTask.is_completed ? "secondary" : "default"}
                onClick={() => handleToggle(detailTask)}
              >
                {detailTask.is_completed
                  ? "Marked complete ✓"
                  : "Mark complete"}
              </Button>
            </ResponsiveDialogPanel>
          ) : null}
          <ResponsiveDialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (detailTask) handleDelete(detailTask);
                setDetailTaskId(null);
              }}
            >
              <Trash2 />
              Delete task
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
