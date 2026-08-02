"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import type { Challenge, ChallengeParticipant } from "@/lib/types/productivity";

function displayNameFromEmail(email: string | undefined | null): string {
  return email?.split("@")[0] ?? "Someone";
}

export async function listChallenges(): Promise<Challenge[]> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return [];

  const [owned, memberships] = await Promise.all([
    supabase
      .from("challenges")
      .select("*")
      .eq("owner_user_id", user.user.id)
      .eq("is_deleted", false),
    supabase
      .from("challenge_participants")
      .select("challenge_id")
      .eq("user_id", user.user.id)
      .eq("is_deleted", false),
  ]);

  const ownedList = owned.data ?? [];
  const memberChallengeIds = (memberships.data ?? []).map(
    (m) => m.challenge_id,
  );

  let memberList: Challenge[] = [];
  if (memberChallengeIds.length > 0) {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .in("id", memberChallengeIds)
      .eq("is_deleted", false);
    memberList = data ?? [];
  }

  const byId = new Map<string, Challenge>();
  for (const c of [...ownedList, ...memberList]) byId.set(c.id, c);
  return Array.from(byId.values()).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
}

/**
 * Fetches a challenge + its participants for a viewer who may not be a
 * member yet (e.g. hitting the invite link). Uses the admin client to
 * escape RLS — the endpoint is publicly linkable by design.
 */
export async function getChallenge(challengeId: string): Promise<{
  challenge: Challenge;
  participants: ChallengeParticipant[];
} | null> {
  const admin = createAdminClient();
  const [{ data: challenge }, { data: participants }] = await Promise.all([
    admin
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("is_deleted", false)
      .maybeSingle(),
    admin
      .from("challenge_participants")
      .select("*")
      .eq("challenge_id", challengeId)
      .eq("is_deleted", false),
  ]);

  if (!challenge) return null;
  return { challenge, participants: participants ?? [] };
}

export async function createChallenge(input: {
  name: string;
  description?: string | null;
  category?: string | null;
  startDate: string;
  endDate?: string | null;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const name = input.name.trim();
  if (!name) return { error: "Challenge name is required" };

  const challengeId = crypto.randomUUID();
  const { error: challengeError } = await supabase.from("challenges").insert({
    id: challengeId,
    owner_user_id: user.user.id,
    name,
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    start_date: input.startDate,
    end_date: input.endDate || null,
  });
  if (challengeError) return { error: challengeError.message };

  const { error: participantError } = await supabase
    .from("challenge_participants")
    .insert({
      id: crypto.randomUUID(),
      challenge_id: challengeId,
      user_id: user.user.id,
      display_name: displayNameFromEmail(user.user.email),
      completed_dates: [],
    });
  if (participantError) return { error: participantError.message };

  revalidatePath("/app/challenges");
  return { id: challengeId };
}

export async function createChallengeFromHabit(
  habitId: string,
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("*")
    .eq("id", habitId)
    .eq("user_id", user.user.id)
    .single();
  if (habitError || !habit) return { error: "Habit not found" };

  const challengeId = crypto.randomUUID();
  const { error: challengeError } = await supabase.from("challenges").insert({
    id: challengeId,
    owner_user_id: user.user.id,
    name: habit.name,
    description: habit.description,
    category: habit.category,
    start_date: habit.started_at,
    end_date: habit.end_date,
  });
  if (challengeError) return { error: challengeError.message };

  const { error: participantError } = await supabase
    .from("challenge_participants")
    .insert({
      id: crypto.randomUUID(),
      challenge_id: challengeId,
      user_id: user.user.id,
      display_name: displayNameFromEmail(user.user.email),
      completed_dates: habit.completed_dates ?? [],
    });
  if (participantError) return { error: participantError.message };

  revalidatePath("/app/challenges");
  return { id: challengeId };
}

export async function joinChallenge(
  challengeId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: existing } = await supabase
    .from("challenge_participants")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (existing) return {};

  const { error } = await supabase.from("challenge_participants").insert({
    id: crypto.randomUUID(),
    challenge_id: challengeId,
    user_id: user.user.id,
    display_name: displayNameFromEmail(user.user.email),
    completed_dates: [],
  });
  if (error) return { error: error.message };

  revalidatePath(`/app/challenges/${challengeId}`);
  return {};
}

export async function toggleChallengeDate(
  challengeId: string,
  date: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: participant, error: fetchError } = await supabase
    .from("challenge_participants")
    .select("id, completed_dates")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.user.id)
    .single();
  if (fetchError || !participant)
    return { error: "You haven't joined this challenge" };

  const current: string[] = participant.completed_dates ?? [];
  const next = current.includes(date)
    ? current.filter((d) => d !== date)
    : [...current, date];

  const { error } = await supabase
    .from("challenge_participants")
    .update({ completed_dates: next })
    .eq("id", participant.id);
  if (error) return { error: error.message };

  revalidatePath(`/app/challenges/${challengeId}`);
  return {};
}

export interface LeaderboardEntry {
  key: string;
  displayName: string;
  totalDays: number;
  challengeCount: number;
  isCurrentUser: boolean;
}

/**
 * Ranks everyone the current user shares a challenge with, aggregated
 * across all of the user's challenges (not just one) — same "rank by
 * completed_dates length" logic challenge-detail-client.tsx uses per
 * challenge, just summed across every challenge they're part of.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;
  if (!userId) return [];

  const challenges = await listChallenges();
  const challengeIds = challenges.map((c) => c.id);
  if (challengeIds.length === 0) return [];

  const { data: participants } = await supabase
    .from("challenge_participants")
    .select("*")
    .in("challenge_id", challengeIds)
    .eq("is_deleted", false);

  const byUser = new Map<string, LeaderboardEntry>();
  for (const p of participants ?? []) {
    const key = p.user_id ?? p.id;
    const days = (p.completed_dates ?? []).length;
    const existing = byUser.get(key);
    if (existing) {
      existing.totalDays += days;
      existing.challengeCount += 1;
    } else {
      byUser.set(key, {
        key,
        displayName: p.display_name ?? "Someone",
        totalDays: days,
        challengeCount: 1,
        isCurrentUser: p.user_id === userId,
      });
    }
  }

  return Array.from(byUser.values()).sort((a, b) => b.totalDays - a.totalDays);
}

export async function deleteChallenge(
  challengeId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("challenges")
    .update({ is_deleted: true })
    .eq("id", challengeId)
    .eq("owner_user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/challenges");
  return {};
}
