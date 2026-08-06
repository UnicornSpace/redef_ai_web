import { createClient } from "@/lib/server";
import { tool } from "ai";
import z from "zod";

export const logDeepWorkSessionTool = tool({
  description:
    "Log a deep-work / focus session the user describes in natural language " +
    "(e.g. \"I worked from 9am to 5pm today\", \"I focused for 3 hours this " +
    "morning\"). Resolve relative times against the current date/time given " +
    "in the system prompt and pass absolute ISO 8601 datetimes.",
  inputSchema: z.object({
    startTime: z
      .string()
      .describe("ISO 8601 datetime the session started, e.g. 2026-08-05T09:00:00"),
    endTime: z
      .string()
      .describe("ISO 8601 datetime the session ended, e.g. 2026-08-05T17:00:00"),
  }),
  execute: async ({ startTime, endTime }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
    if (
      !Number.isFinite(durationSeconds) ||
      durationSeconds <= 0 ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return { error: "Session end must be after the start" };
    }

    const { error } = await supabase.from("deepwork_sessions").insert({
      id: crypto.randomUUID(),
      user_id: user.user.id,
      project_id: null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_in_minutes: Math.round(durationSeconds / 60),
      duration_in_seconds: durationSeconds,
      is_manual_entry: true,
    });
    if (error) {
      return { error: error.message };
    }

    const hours = (durationSeconds / 3600).toFixed(1);
    return { data: `Logged a ${hours}h deep-work session.` };
  },
});
