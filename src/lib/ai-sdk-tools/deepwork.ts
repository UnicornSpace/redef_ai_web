import { createClient } from "@/lib/server";
import { tool } from "ai";
import z from "zod";

/**
 * The AI Talk assistant's deep-work toolkit. Three tools that work as a
 * loop: list projects → log sessions matched to them → summarize.
 *
 * Split into an array-of-sessions logger deliberately: users typically say
 * things like "I worked from 9 to 12 on X and 1 to 5 on Y" in one voice
 * note, and we want that to become two rows (against different projects)
 * in a single tool call rather than a chain of single-session calls.
 */

export const listDeepWorkProjectsTool = tool({
  description:
    "List the user's deep-work projects. Call this BEFORE logDeepWorkSessions " +
    "whenever the user mentions what they worked ON, so you can match each " +
    "session to a real projectId. If the user names something that doesn't " +
    "match any existing project, log the session without a projectId (do " +
    "NOT invent an id) and tell them the project isn't set up yet.",
  inputSchema: z.object({}),
  execute: async () => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", user.user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    if (error) return { error: error.message };

    return {
      data: {
        projects: data ?? [],
        count: (data ?? []).length,
      },
    };
  },
});

export const logDeepWorkSessionsTool = tool({
  description:
    "Log one or more deep-work / focus sessions the user describes in " +
    "natural language. Resolve every relative time against the current " +
    "date/time in the system prompt and pass absolute ISO 8601 datetimes. " +
    "If the user described multiple stretches (\"9 to 12 on X, then 1 to 5 " +
    "on Y\"), pass them as SEPARATE array entries so they log as separate " +
    "sessions — do NOT collapse them into one long block. Attach a " +
    "projectId (from listDeepWorkProjects) only when it truly matches what " +
    "the user said; leave it null otherwise.",
  inputSchema: z.object({
    sessions: z
      .array(
        z.object({
          startTime: z
            .string()
            .describe(
              "ISO 8601 datetime the session started, e.g. 2026-08-09T09:00:00",
            ),
          endTime: z
            .string()
            .describe(
              "ISO 8601 datetime the session ended, e.g. 2026-08-09T12:00:00",
            ),
          projectId: z
            .string()
            .nullable()
            .optional()
            .describe(
              "The project.id this session was on, from listDeepWorkProjects. " +
                "null (or omit) if the user didn't specify or you can't match.",
            ),
        }),
      )
      .min(1)
      .describe("One entry per continuous focus stretch."),
  }),
  execute: async ({ sessions }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    // Only accept projectIds that actually belong to this user — the AI
    // could hallucinate an id, and we never want to write a foreign row.
    const providedIds = Array.from(
      new Set(
        sessions
          .map((s) => s.projectId ?? null)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    let validProjectIds = new Set<string>();
    if (providedIds.length > 0) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.user.id)
        .eq("is_deleted", false)
        .in("id", providedIds);
      validProjectIds = new Set((projects ?? []).map((p) => p.id));
    }

    const rows: Array<{
      id: string;
      user_id: string;
      project_id: string | null;
      start_time: string;
      end_time: string;
      duration_in_minutes: number;
      duration_in_seconds: number;
      is_manual_entry: boolean;
    }> = [];
    const errors: string[] = [];

    for (const s of sessions) {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      const durationSeconds = Math.round(
        (end.getTime() - start.getTime()) / 1000,
      );
      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        !Number.isFinite(durationSeconds) ||
        durationSeconds <= 0
      ) {
        errors.push(`Session ${s.startTime}→${s.endTime}: end must be after start`);
        continue;
      }
      rows.push({
        id: crypto.randomUUID(),
        user_id: user.user.id,
        project_id:
          s.projectId && validProjectIds.has(s.projectId) ? s.projectId : null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_in_minutes: Math.round(durationSeconds / 60),
        duration_in_seconds: durationSeconds,
        is_manual_entry: true,
      });
    }

    if (rows.length === 0) {
      return { error: errors.join("; ") || "No valid sessions to log" };
    }

    const { error } = await supabase.from("deepwork_sessions").insert(rows);
    if (error) return { error: error.message };

    const totalHours = (
      rows.reduce((acc, r) => acc + r.duration_in_seconds, 0) / 3600
    ).toFixed(1);
    const linked = rows.filter((r) => r.project_id).length;
    return {
      data: `Logged ${rows.length} session${rows.length === 1 ? "" : "s"} (${totalHours}h total, ${linked} linked to a project)${errors.length ? `. Skipped: ${errors.join("; ")}` : ""}.`,
    };
  },
});

type RangeKey = "today" | "yesterday" | "week" | "month" | "all" | "custom";

function rangeToBounds(
  range: RangeKey,
  startDate?: string,
  endDate?: string,
): { start: Date; end: Date } | null {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  if (range === "today") return { start: startOfDay, end: endOfDay };
  if (range === "yesterday") {
    const s = new Date(startOfDay);
    s.setDate(s.getDate() - 1);
    const e = new Date(endOfDay);
    e.setDate(e.getDate() - 1);
    return { start: s, end: e };
  }
  if (range === "week") {
    // Rolling 7-day window ending today — matches how the user phrases
    // "this week" in casual conversation (not ISO-week calendar boundary).
    const s = new Date(startOfDay);
    s.setDate(s.getDate() - 6);
    return { start: s, end: endOfDay };
  }
  if (range === "month") {
    const s = new Date(startOfDay);
    s.setDate(s.getDate() - 29);
    return { start: s, end: endOfDay };
  }
  if (range === "all") {
    return { start: new Date(0), end: endOfDay };
  }
  if (range === "custom") {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
    return { start: s, end: e };
  }
  return null;
}

export const getDeepWorkSummaryTool = tool({
  description:
    "Summarize the user's deep-work / focus time. Use this to answer " +
    "\"how much did I work today / yesterday / this week / this month\" or " +
    "for a custom date range. Returns total hours + per-project breakdown.",
  inputSchema: z.object({
    range: z
      .enum(["today", "yesterday", "week", "month", "all", "custom"])
      .describe(
        "Preset window. Use 'custom' with startDate+endDate for anything else.",
      ),
    startDate: z
      .string()
      .optional()
      .describe("ISO 8601, only with range='custom'"),
    endDate: z
      .string()
      .optional()
      .describe("ISO 8601, only with range='custom'"),
  }),
  execute: async ({ range, startDate, endDate }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const bounds = rangeToBounds(range as RangeKey, startDate, endDate);
    if (!bounds) return { error: "Invalid range" };

    const { data, error } = await supabase
      .from("deepwork_sessions")
      .select("duration_in_seconds, project_id, start_time")
      .eq("user_id", user.user.id)
      .eq("is_deleted", false)
      .gte("start_time", bounds.start.toISOString())
      .lte("start_time", bounds.end.toISOString());
    if (error) return { error: error.message };

    const totalSeconds = (data ?? []).reduce(
      (acc, r) => acc + (r.duration_in_seconds ?? 0),
      0,
    );

    const byProjectId = new Map<string | null, number>();
    for (const r of data ?? []) {
      const key = r.project_id ?? null;
      byProjectId.set(key, (byProjectId.get(key) ?? 0) + (r.duration_in_seconds ?? 0));
    }

    const projectIds = Array.from(byProjectId.keys()).filter(
      (id): id is string => Boolean(id),
    );
    let projectNames = new Map<string, string>();
    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.user.id)
        .in("id", projectIds);
      projectNames = new Map(
        (projects ?? []).map((p) => [p.id as string, p.name as string]),
      );
    }

    const perProject = Array.from(byProjectId.entries())
      .map(([id, seconds]) => ({
        project: id ? (projectNames.get(id) ?? "Unknown project") : "No project",
        hours: Number((seconds / 3600).toFixed(2)),
      }))
      .sort((a, b) => b.hours - a.hours);

    return {
      data: {
        range,
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
        sessionCount: (data ?? []).length,
        byProject: perProject,
      },
    };
  },
});

// Back-compat: chat route still imports `logDeepWorkSessionTool` under the
// old single-session name. Alias to the new bulk tool so existing wire-up
// doesn't break until the route is updated in the same commit.
export const logDeepWorkSessionTool = logDeepWorkSessionsTool;
