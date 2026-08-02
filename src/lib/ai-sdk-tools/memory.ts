import { tool } from "ai";
import z from "zod";
import { createClient } from "@/lib/server";

export const updateMemoryTool = tool({
  description:
    "Save what you know about the user so future conversations remember it. Call this when you learn a durable fact worth recalling later (their goals, context, ongoing projects, preferences not already covered by their personalization settings). Pass the FULL updated summary each time - it replaces whatever was stored before, so include everything still relevant, not just the new fact.",
  inputSchema: z.object({
    memorySummary: z
      .string()
      .describe(
        "The complete updated memory summary to store, replacing whatever was there before.",
      ),
  }),
  execute: async ({ memorySummary }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: "Not signed in" };
    }

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.user.id,
      memory_summary: memorySummary,
    });
    if (error) {
      return { error: error.message };
    }

    return { data: "Memory updated" };
  },
});
