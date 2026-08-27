"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import type { CoachingStance, UserStandards } from "@/lib/types/standards";

export async function getMyStandards(): Promise<UserStandards | null> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return null;

  const { data, error } = await supabase
    .from("user_standards")
    .select("*")
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserStandards;
}

export async function updateMyStandards(input: {
  targetDeepWorkHours?: number | null;
  targetWorkdaysPerWeek?: number | null;
  coachingStance?: CoachingStance | null;
  protectedTime?: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  // Validated here as well as in the DB check constraints — a constraint
  // violation surfaces as an opaque Postgres string, and this is a form
  // people fill in by hand.
  const hours = input.targetDeepWorkHours;
  if (hours != null && (!Number.isFinite(hours) || hours <= 0 || hours > 24)) {
    return { error: "Target hours must be between 0 and 24" };
  }
  const days = input.targetWorkdaysPerWeek;
  if (days != null && (!Number.isInteger(days) || days < 1 || days > 7)) {
    return { error: "Workdays per week must be between 1 and 7" };
  }

  const { error } = await supabase.from("user_standards").upsert({
    user_id: user.user.id,
    target_deep_work_hours: hours ?? null,
    target_workdays_per_week: days ?? null,
    coaching_stance: input.coachingStance ?? null,
    protected_time: input.protectedTime?.trim() || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath("/app/profile/standards");
  return {};
}
