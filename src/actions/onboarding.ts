"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";

/**
 * Habit-specific follow-up onboarding — NOT part of the general onboarding
 * flow (that's src/actions/profile.ts + onboarding-client.tsx, which only
 * collects username/age/phone/enabled tools). Per product direction, habit
 * questions (goals, challenges, frequency, reminders) should only surface
 * once the user has actually turned the Habits module on — e.g. the first
 * time they open /app/habits, or right after enabling it in Settings.
 * Not yet wired into any UI; these are ready for that follow-up screen.
 */
export async function completeHabitOnboarding(input: {
  goals: string[];
  challenges: string[];
  preferredFrequency: "daily" | "weekly" | "flexible";
  reminderTime: "morning" | "midday" | "evening" | "night" | "none";
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase.from("user_onboarding").upsert(
    {
      user_id: user.user.id,
      habit_goals: input.goals,
      habit_challenges: input.challenges,
      habit_preferred_frequency: input.preferredFrequency,
      habit_reminder_time: input.reminderTime,
    },
    { onConflict: "user_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}

/**
 * Get recommended habits based on user's goal selections
 */
export async function getRecommendedHabits(): Promise<
  Array<{
    name: string;
    description: string;
    type: "boolean" | "checklist";
    targetGoals: string[];
  }>
> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return [];

  const { data: onboarding, error: onboardingError } = await supabase
    .from("user_onboarding")
    .select("habit_goals")
    .eq("user_id", user.user.id)
    .single();

  if (onboardingError || !onboarding?.habit_goals) return [];

  const goals = onboarding.habit_goals as string[];

  // Return recommended habits based on goals
  const habitsMap: Record<
    string,
    Array<{
      name: string;
      description: string;
      type: "boolean" | "checklist";
      targetGoals: string[];
    }>
  > = {
    focus: [
      {
        name: "Deep Work Block",
        description: "Dedicated 90-minute focus session",
        type: "checklist",
        targetGoals: ["focus"],
      },
      {
        name: "Morning Routine",
        description: "Start your day with intention",
        type: "checklist",
        targetGoals: ["focus"],
      },
      {
        name: "No Notifications Time",
        description: "30 min with all notifications off",
        type: "boolean",
        targetGoals: ["focus"],
      },
    ],
    save_time: [
      {
        name: "Time Blocking",
        description: "Schedule your day by blocks",
        type: "checklist",
        targetGoals: ["save_time"],
      },
      {
        name: "Weekly Planning",
        description: "Plan your week ahead",
        type: "checklist",
        targetGoals: ["save_time"],
      },
    ],
    health: [
      {
        name: "Exercise",
        description: "30 min workout or activity",
        type: "boolean",
        targetGoals: ["health"],
      },
      {
        name: "Drink Water",
        description: "Stay hydrated throughout the day",
        type: "boolean",
        targetGoals: ["health"],
      },
      {
        name: "Nutrition",
        description: "Eat healthy, balanced meals",
        type: "boolean",
        targetGoals: ["health"],
      },
    ],
  };

  const recommended: typeof habitsMap[string] = [];
  for (const goal of goals) {
    if (habitsMap[goal]) {
      recommended.push(...habitsMap[goal]);
    }
  }

  // Remove duplicates by name
  return Array.from(
    new Map(recommended.map((h) => [h.name, h])).values()
  ).slice(0, 5); // Return top 5
}
