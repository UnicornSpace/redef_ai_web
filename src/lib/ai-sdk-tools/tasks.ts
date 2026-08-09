import { createClient } from "@/lib/server";
import { tool } from "ai";
import z from "zod";

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
    "summarize (e.g. \"3 open tasks\") and let the UI show the detail.",
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
      .select("id, name, category, due_date, is_completed")
      .eq("user_id", user.user.id)
      .eq("is_deleted", false)
      .eq("is_completed", Boolean(isCompleted))
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };

    return {
      data: {
        tasks: (data ?? []).map((t) => ({
          id: t.id as string,
          name: t.name as string,
          category: (t.category as string | null) ?? null,
          dueDate: (t.due_date as string | null) ?? null,
          isCompleted: Boolean(t.is_completed),
        })),
        count: (data ?? []).length,
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
  description: "Add a new task or a todo",
  inputSchema: z.object({
    name: z.string().describe("the name of the task or todo"),
  }),
  execute: async ({ name }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError) return { error: authError.message };

    const { error } = await supabase
      .from("tasks")
      .insert({ id: crypto.randomUUID(), name, user_id: user.user.id });
    if (error) return { error: error.message };

    return { data: "Task added successfully" };
  },
});
