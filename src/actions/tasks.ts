"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import type { Task } from "@/lib/types/productivity";

export async function listTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  // `labels` is `null` for any row untouched since the category->labels
  // migration (and would be missing entirely if that migration hasn't run
  // yet) — every caller assumes a real array, so guarantee one here rather
  // than at every call site.
  return (data ?? []).map((t) => ({ ...t, labels: t.labels ?? [] }));
}

function normalizeLabels(labels: string[] | null | undefined): string[] {
  return Array.from(
    new Set((labels ?? []).map((l) => l.trim()).filter(Boolean)),
  );
}

export async function createTask(input: {
  name: string;
  labels?: string[] | null;
  dueDate?: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const name = input.name.trim();
  if (!name) return { error: "Task name is required" };

  const { error } = await supabase.from("tasks").insert({
    id: crypto.randomUUID(),
    name,
    labels: normalizeLabels(input.labels),
    due_date: input.dueDate || null,
    user_id: user.user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/app/tasks");
  return {};
}

export async function updateTaskLabels(
  taskId: string,
  labels: string[],
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("tasks")
    .update({ labels: normalizeLabels(labels) })
    .eq("id", taskId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/tasks");
  return {};
}

export async function updateTaskDueDate(
  taskId: string,
  dueDate: string | null,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("tasks")
    .update({ due_date: dueDate })
    .eq("id", taskId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/tasks");
  return {};
}

export async function toggleTaskCompleted(
  taskId: string,
  isCompleted: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("tasks")
    .update({ is_completed: isCompleted })
    .eq("id", taskId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/tasks");
  return {};
}

export async function deleteTask(taskId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("tasks")
    .update({ is_deleted: true })
    .eq("id", taskId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/tasks");
  return {};
}
