"use client";

import { ListChecks, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createTask,
  deleteTask,
  toggleTaskCompleted,
  updateTaskDueDate,
} from "@/actions/tasks";
import { useRegisterFab } from "@/components/app-shell/mobile-fab-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import type { Task } from "@/lib/types/productivity";
import { cn } from "@/lib/utils";

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

type Filter = "active" | "all" | "completed";
const ALL_CATEGORIES = "__all__";

export function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [addOpen, setAddOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const detailTask = tasks.find((t) => t.id === detailTaskId) ?? null;

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) if (t.category) set.add(t.category);
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "active") list = list.filter((t) => !t.is_completed);
    else if (filter === "completed") list = list.filter((t) => t.is_completed);
    if (categoryFilter !== ALL_CATEGORIES) {
      list = list.filter((t) => (t.category?.trim() || "General") === categoryFilter);
    }
    return list;
  }, [tasks, filter, categoryFilter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const t of filtered) {
      const key = t.category?.trim() || "General";
      const list = groups.get(key) ?? [];
      list.push(t);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === "General") return 1;
      if (b === "General") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const activeCount = tasks.filter((t) => !t.is_completed).length;

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const trimmedCategory = category.trim() || null;
    const optimistic: Task = {
      id: uid(),
      user_id: null,
      name: trimmed,
      category: trimmedCategory,
      due_date: dueDate || null,
      is_completed: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);
    setName("");
    setCategory("");
    setDueDate("");
    setAddOpen(false);
    startTransition(async () => {
      const res = await createTask({
        name: trimmed,
        category: trimmedCategory,
        dueDate: optimistic.due_date,
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

  useRegisterFab(
    { label: "Add task", icon: Plus, onClick: () => setAddOpen(true) },
    [],
  );

  return (
    <div className="flex flex-col gap-5 px-4 pb-16 md:px-8">
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
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder="Category (optional)"
            className="w-36 sm:w-44"
            list="task-categories"
          />
          <datalist id="task-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
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

      <ResponsiveDialog open={addOpen} onOpenChange={setAddOpen}>
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
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (optional)"
              list="task-categories"
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-body-muted">{activeCount} left</span>
          {categories.length > 0 ? (
            <Select
              onValueChange={(v) => setCategoryFilter(v ?? ALL_CATEGORIES)}
              value={categoryFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
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
        <div className="flex flex-col gap-6">
          {grouped.map(([categoryLabel, items]) => (
            <div key={categoryLabel} className="flex flex-col gap-1">
              {categoryFilter === ALL_CATEGORIES ? (
                <h2 className="px-2 text-xs font-bold uppercase tracking-wide text-body-muted">
                  {categoryLabel}
                </h2>
              ) : null}
              <div className="rounded-2xl border border-line bg-paper">
                {items.map((task, i) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex flex-wrap items-center gap-3 px-3 py-2.5",
                      i !== items.length - 1 && "border-b border-line",
                    )}
                  >
                    <Checkbox
                      checked={task.is_completed}
                      onCheckedChange={() => handleToggle(task)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      onClick={() => setDetailTaskId(task.id)}
                      className={cn(
                        "min-w-0 flex-1 text-left text-sm text-ink",
                        task.is_completed &&
                          "text-body-muted line-through",
                      )}
                    >
                      {task.name}
                    </button>
                    {task.due_date ? (
                      <span className="shrink-0 text-xs text-body-muted">
                        {new Date(`${task.due_date}T00:00:00`).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
              {detailTask.category ? (
                <span className="w-fit rounded-full bg-g-green-pale px-2.5 py-0.5 text-xs font-semibold text-rf-green-deep">
                  {detailTask.category}
                </span>
              ) : null}
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
