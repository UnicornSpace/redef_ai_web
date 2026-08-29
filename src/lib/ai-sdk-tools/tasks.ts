import { createClient } from "@/lib/server";
import { tool } from "ai";
import z from "zod";
import { isShoppingTask } from "@/lib/tasks";

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const getSecretPinTool = tool({
  description: "Get the secret pin of the user",
  inputSchema: z.object({}),
  execute: async () => {
    return { data: "1234" };
  },
});

export const getTasksTool = tool({
  description:
    "Get the user's tasks / todos. Returns structured task rows (not a " +
    "formatted string) — the UI renders these as an interactive checkbox " +
    "list, so DON'T re-list them yourself in prose; instead just briefly " +
    "summarize (e.g. \"3 open tasks\") and let the UI show the detail. " +
    "Each open task flags isOverdue/isDueToday — if any are set, mention " +
    "the specific task yourself rather than only reporting the count. " +
    "Shopping items (tasks labeled \"Buy\") are never included here — " +
    "they live only in the shopping-list view.",
  inputSchema: z.object({
    isCompleted: z
      .boolean()
      .default(false)
      .optional()
      .describe("false = incomplete tasks (default), true = completed"),
  }),
  execute: async ({ isCompleted }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }
    const { data, error } = await supabase
      .from("tasks")
      .select("id, name, labels, due_date, is_completed")
      .eq("user_id", user.user.id)
      .eq("is_deleted", false)
      .eq("is_completed", Boolean(isCompleted))
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };

    const today = todayIso();
    const rows = (data ?? []).filter(
      (t) => !isShoppingTask(t.labels as string[] | null),
    );
    return {
      data: {
        tasks: rows.map((t) => {
          const dueDate = (t.due_date as string | null) ?? null;
          return {
            id: t.id as string,
            name: t.name as string,
            labels: (t.labels as string[] | null) ?? [],
            dueDate,
            isCompleted: Boolean(t.is_completed),
            isOverdue: !isCompleted && dueDate != null && dueDate < today,
            isDueToday: !isCompleted && dueDate === today,
          };
        }),
        count: rows.length,
        filter: isCompleted ? "completed" : "open",
      },
    };
  },
});

export const markTaskAsCompletedTool = tool({
  description: "Mark a task as completed",
  inputSchema: z.object({
    taskId: z.string().describe("the id of the task"),
  }),
  execute: async ({ taskId }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError) return { error: authError.message };

    const { error } = await supabase
      .from("tasks")
      .update({ is_completed: true })
      .eq("id", taskId)
      .eq("user_id", user.user.id);
    if (error) return { error: error.message };

    return { data: "Task marked as completed" };
  },
});

export const addTasksTool = tool({
  description:
    "Add a new task or a todo. If the user mentions when it's due (\"by " +
    "Friday\", \"tomorrow\") or a label (\"for the trip\", \"work\"), " +
    "include it — don't ask if they didn't say, but never drop it if they " +
    "did. A task can have several labels. If the user is asking you to add " +
    "something to their shopping/buy list (\"add milk to my list\", \"I " +
    "need to buy...\"), include \"Buy\" as one of the labels — that's what " +
    "routes it to the shopping list instead of the main task list.",
  inputSchema: z.object({
    name: z.string().describe("the name of the task or todo"),
    dueDate: z
      .string()
      .nullable()
      .optional()
      .describe("YYYY-MM-DD, only if the user stated or implied one."),
    labels: z
      .array(z.string())
      .nullable()
      .optional()
      .describe(
        "Short labels, only for what the user actually said. Include " +
          "\"Buy\" for a shopping-list item.",
      ),
  }),
  execute: async ({ name, dueDate, labels }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError) return { error: authError.message };

    const cleanLabels = Array.from(
      new Set((labels ?? []).map((l) => l.trim()).filter(Boolean)),
    );
    const { error } = await supabase.from("tasks").insert({
      id: crypto.randomUUID(),
      name,
      due_date: dueDate || null,
      labels: cleanLabels,
      user_id: user.user.id,
    });
    if (error) return { error: error.message };

    return {
      data: `Task added${dueDate ? `, due ${dueDate}` : ""}${cleanLabels.length ? ` (${cleanLabels.join(", ")})` : ""}.`,
    };
  },
});
