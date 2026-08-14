"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import type {
  DeepworkSessionWithProject,
  Project,
} from "@/lib/types/productivity";

export async function listProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProject(
  name: string,
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Project name is required" };

  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("projects")
    .insert({ id, name: trimmed, user_id: user.user.id });
  if (error) return { error: error.message };

  revalidatePath("/app/deep-work");
  // Returning the real server-side id lets the client swap out the
  // optimistic uid()-generated placeholder — without that, starting a
  // session against a just-created project sends a project_id that
  // doesn't exist in the projects table, violating the FK.
  return { id };
}

export async function deleteProject(
  projectId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("projects")
    .update({ is_deleted: true })
    .eq("id", projectId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/deep-work");
  return {};
}

export async function listSessions(
  limit = 50,
): Promise<DeepworkSessionWithProject[]> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return [];

  const { data, error } = await supabase
    .from("deepwork_sessions")
    .select("*, project:projects(id, name)")
    .eq("user_id", user.user.id)
    .eq("is_deleted", false)
    .order("start_time", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as unknown as DeepworkSessionWithProject[]) ?? [];
}

export async function createSession(input: {
  projectId?: string | null;
  startTime: string;
  endTime: string;
  isManualEntry: boolean;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  const durationSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return { error: "Session end must be after the start" };
  }

  const { error } = await supabase.from("deepwork_sessions").insert({
    id: crypto.randomUUID(),
    user_id: user.user.id,
    project_id: input.projectId || null,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    duration_in_minutes: Math.round(durationSeconds / 60),
    duration_in_seconds: durationSeconds,
    is_manual_entry: input.isManualEntry,
  });
  if (error) return { error: error.message };

  revalidatePath("/app/deep-work");
  return {};
}

export async function updateSession(
  sessionId: string,
  input: {
    projectId?: string | null;
    startTime: string;
    endTime: string;
  },
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  const durationSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return { error: "Session end must be after the start" };
  }

  const { error } = await supabase
    .from("deepwork_sessions")
    .update({
      project_id: input.projectId || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_in_minutes: Math.round(durationSeconds / 60),
      duration_in_seconds: durationSeconds,
    })
    .eq("id", sessionId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/deep-work");
  return {};
}

export async function deleteSession(
  sessionId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("deepwork_sessions")
    .update({ is_deleted: true })
    .eq("id", sessionId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/deep-work");
  return {};
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Daily focus minutes for a rolling window ending today. Zero-fills any
 * missing day so nivo's TimeRange draws every cell (blank days included)
 * instead of skipping them, which would look like a truncated chart.
 * Default window: 90 days.
 */
export async function getDeepworkDailyMinutes(
  windowDays = 90,
): Promise<{ day: string; value: number }[]> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return [];

  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (windowDays - 1));

  const { data, error } = await supabase
    .from("deepwork_sessions")
    .select("start_time, duration_in_seconds")
    .eq("user_id", user.user.id)
    .eq("is_deleted", false)
    .gte("start_time", start.toISOString());
  if (error) return [];

  const minutesByDay = new Map<string, number>();
  for (const row of data ?? []) {
    const key = dayKey(new Date(row.start_time));
    minutesByDay.set(
      key,
      (minutesByDay.get(key) ?? 0) + (row.duration_in_seconds ?? 0) / 60,
    );
  }

  // Zero-fill every day in the window so the chart draws a full band.
  const points: { day: string; value: number }[] = [];
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    points.push({ day: key, value: Math.round(minutesByDay.get(key) ?? 0) });
  }
  return points;
}

