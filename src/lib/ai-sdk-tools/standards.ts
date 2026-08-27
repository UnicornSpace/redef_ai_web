import { tool } from "ai";
import z from "zod";
import { createClient } from "@/lib/server";

/**
 * Lets the assistant record what the user says they're aiming for, so
 * they only have to say it once. Deliberately NOT inferred from behavior:
 * "you worked 9 hours" is data, "I want to work 9 hours" is intent, and
 * conflating them is exactly how you end up congratulating someone for a
 * day they consider a failure.
 */
export const updateWorkStandardsTool = tool({
  description:
    "Record the user's work target or coaching preference — ONLY when they " +
    "state it themselves (\"I'm aiming for 9 hours a day\", \"stop telling me " +
    "to rest\", \"no work after 8pm\"). Never infer a target from what they " +
    "happened to do. Pass only the fields they actually mentioned; omitted " +
    "fields keep their current value. Confirm briefly in your reply so they " +
    "know it stuck.",
  inputSchema: z.object({
    targetDeepWorkHours: z
      .number()
      .nullable()
      .optional()
      .describe("Target deep-work hours on a working day, e.g. 9"),
    targetWorkdaysPerWeek: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe("How many days a week they intend to work, 1-7"),
    coachingStance: z
      .enum(["push", "balanced", "protect"])
      .nullable()
      .optional()
      .describe(
        "push = hold them to the target and call out shortfalls; " +
          "balanced = neutral read; protect = watch for overwork",
      ),
    protectedTime: z
      .string()
      .nullable()
      .optional()
      .describe('Free text, e.g. "no work after 8pm" or "Sundays off"'),
  }),
  execute: async (input) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    if (
      input.targetDeepWorkHours != null &&
      (input.targetDeepWorkHours <= 0 || input.targetDeepWorkHours > 24)
    ) {
      return { error: "Target hours must be between 0 and 24" };
    }
    if (
      input.targetWorkdaysPerWeek != null &&
      (input.targetWorkdaysPerWeek < 1 || input.targetWorkdaysPerWeek > 7)
    ) {
      return { error: "Workdays per week must be between 1 and 7" };
    }

    // Merge rather than replace — the model is told to pass only what the
    // user mentioned, so a bare upsert would silently null out every other
    // standard they'd previously set.
    const { data: existing } = await supabase
      .from("user_standards")
      .select("*")
      .eq("user_id", user.user.id)
      .maybeSingle();

    const next = {
      user_id: user.user.id,
      target_deep_work_hours:
        input.targetDeepWorkHours !== undefined
          ? input.targetDeepWorkHours
          : (existing?.target_deep_work_hours ?? null),
      target_workdays_per_week:
        input.targetWorkdaysPerWeek !== undefined
          ? input.targetWorkdaysPerWeek
          : (existing?.target_workdays_per_week ?? null),
      coaching_stance:
        input.coachingStance !== undefined
          ? input.coachingStance
          : (existing?.coaching_stance ?? null),
      protected_time:
        input.protectedTime !== undefined
          ? (input.protectedTime?.trim() || null)
          : (existing?.protected_time ?? null),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("user_standards").upsert(next);
    if (error) return { error: error.message };

    return {
      data: "Saved — I'll measure your days against that from now on.",
    };
  },
});
