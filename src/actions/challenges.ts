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

export interface LeaderboardBreakdown {
  habits: number;
  deepwork: number;
  tasks: number;
  challengeDays: number;
}

export interface LeaderboardEntry {
  key: string;
  displayName: string;
  /** Weighted total across the last 30 days — see WEIGHTS below. */
  score: number;
  breakdown: LeaderboardBreakdown;
  /** How many challenges you share with this person — kept for context
      pills in the UI, no longer part of the sort. */
  challengeCount: number;
  isCurrentUser: boolean;
}

// Deliberately-tuned weights so no single stream dominates. Challenges
// get a slight bump because they're a social commitment (you told
// someone you'd do it); tasks a slight discount because "checking a
// task" is a much lower bar than "completed a habit". Change these if
// the ranking starts feeling wrong for real users.
const WEIGHTS = {
  habit: 1,
  deepwork: 1,
  task: 0.5,
  challengeDay: 1.5,
} as const;

// Fixed rolling window. Longer than a week (which would swing violently
// per-day) but short enough that "someone who was active six months ago"
// doesn't sit at the top forever.
const SCORING_WINDOW_DAYS = 30;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysAgoDateKey(days: number): string {
  return daysAgoIso(days).slice(0, 10);
}

/**
 * Universal leaderboard across everyone the user shares any social
 * context with — challenge co-participants AND habit collaborators — with
 * a score that spans every activity feature (habits, deep-work, tasks,
 * challenge check-ins), not just challenge check-ins. Ranks by weighted
 * activity over the last {@link SCORING_WINDOW_DAYS} days.
 *
 * Uses the admin client for cross-user reads: RLS scopes each of these
 * tables to the row owner, but people who joined a challenge or accepted
 * a habit invite have implicitly opted into being seen by other members
 * of that context (same principle as the challenge-detail comparison
 * view and habit collaborator comparison — this just aggregates the same
 * signal across more contexts).
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;
  if (!userId) return [];

  const admin = createAdminClient();

  // 1. Build the social graph — everyone linked to the caller via
  //    either a shared challenge or a shared habit. The caller is
  //    always included (they should see themselves on the leaderboard).
  const challenges = await listChallenges();
  const challengeIds = challenges.map((c) => c.id);

  const { data: ownedHabits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", userId)
    .eq("is_deleted", false);
  const ownedHabitIds = (ownedHabits ?? []).map((h) => h.id);

  const { data: joinedHabits } = await supabase
    .from("habit_collaborators")
    .select("habit_id")
    .eq("user_id", userId)
    .eq("is_deleted", false);
  const joinedHabitIds = (joinedHabits ?? []).map((h) => h.habit_id);
  const habitIds = Array.from(new Set([...ownedHabitIds, ...joinedHabitIds]));

  const [challengeParticipantsRes, habitCollaboratorsRes] = await Promise.all([
    challengeIds.length > 0
      ? admin
          .from("challenge_participants")
          .select("user_id, display_name, completed_dates, challenge_id")
          .in("challenge_id", challengeIds)
          .eq("is_deleted", false)
      : Promise.resolve({ data: [] as {
          user_id: string | null;
          display_name: string | null;
          completed_dates: string[] | null;
          challenge_id: string;
        }[] }),
    habitIds.length > 0
      ? admin
          .from("habit_collaborators")
          .select("user_id, display_name, habit_id")
          .in("habit_id", habitIds)
          .eq("is_deleted", false)
      : Promise.resolve({ data: [] as {
          user_id: string | null;
          display_name: string | null;
          habit_id: string;
        }[] }),
  ]);

  const socialUserIds = new Set<string>([userId]);
  const displayNameByUserId = new Map<string, string>();
  for (const p of challengeParticipantsRes.data ?? []) {
    if (p.user_id) {
      socialUserIds.add(p.user_id);
      if (p.display_name) displayNameByUserId.set(p.user_id, p.display_name);
    }
  }
  for (const c of habitCollaboratorsRes.data ?? []) {
    if (c.user_id) {
      socialUserIds.add(c.user_id);
      if (c.display_name && !displayNameByUserId.has(c.user_id)) {
        displayNameByUserId.set(c.user_id, c.display_name);
      }
    }
  }

  // The current user's own display name — grab from their email so the
  // "you" row doesn't fall back to "Someone".
  displayNameByUserId.set(
    userId,
    displayNameFromEmail(user.user?.email),
  );

  // Also pull owner display names for habits the caller joined — the
  // owner counts as social context even though they're not a
  // collaborator row.
  if (joinedHabitIds.length > 0) {
    const { data: ownerRows } = await admin
      .from("habits")
      .select("user_id, owner_display_name")
      .in("id", joinedHabitIds);
    for (const row of ownerRows ?? []) {
      if (row.user_id) {
        socialUserIds.add(row.user_id);
        if (row.owner_display_name && !displayNameByUserId.has(row.user_id)) {
          displayNameByUserId.set(row.user_id, row.owner_display_name);
        }
      }
    }
  }

  // Similarly for challenges the caller joined — pull the owner.
  const joinedChallenges = challenges.filter(
    (c) => c.owner_user_id && c.owner_user_id !== userId,
  );
  for (const c of joinedChallenges) {
    if (c.owner_user_id) socialUserIds.add(c.owner_user_id);
  }

  if (socialUserIds.size === 0) return [];
  const targetIds = Array.from(socialUserIds);
  const windowStartIso = daysAgoIso(SCORING_WINDOW_DAYS - 1);
  const windowStartKey = daysAgoDateKey(SCORING_WINDOW_DAYS - 1);

  // 2. Pull the four activity streams for every user in the graph,
  //    scoped to the scoring window.
  const [habitsRes, sessionsRes, tasksRes, challengeCheckinsRes] =
    await Promise.all([
      // Habit completions live in TWO places: on the owned `habits` row
      // (owner's own check-ins) AND on `habit_collaborators` rows
      // (collaborators' check-ins). Pull both.
      admin
        .from("habits")
        .select("user_id, completed_dates")
        .in("user_id", targetIds)
        .eq("is_deleted", false),
      admin
        .from("deepwork_sessions")
        .select("user_id, start_time")
        .in("user_id", targetIds)
        .eq("is_deleted", false)
        .gte("start_time", windowStartIso),
      admin
        .from("tasks")
        .select("user_id, updated_at, is_completed")
        .in("user_id", targetIds)
        .eq("is_deleted", false)
        .eq("is_completed", true)
        .gte("updated_at", windowStartIso),
      // Challenge check-ins the caller can already see — reuse
      // challengeParticipantsRes above rather than a fresh query.
      Promise.resolve({ data: challengeParticipantsRes.data ?? [] }),
    ]);
  const { data: habitCollabDatesRes } = habitIds.length > 0
    ? await admin
        .from("habit_collaborators")
        .select("user_id, completed_dates")
        .in("user_id", targetIds)
        .eq("is_deleted", false)
    : { data: [] as { user_id: string | null; completed_dates: string[] | null }[] };

  // 3. Aggregate per user into the breakdown, then compute score.
  const byUser = new Map<string, LeaderboardEntry>();
  function bump(uid: string, key: keyof LeaderboardBreakdown, by = 1): void {
    let entry = byUser.get(uid);
    if (!entry) {
      entry = {
        key: uid,
        displayName: displayNameByUserId.get(uid) ?? "Someone",
        score: 0,
        breakdown: { habits: 0, deepwork: 0, tasks: 0, challengeDays: 0 },
        challengeCount: 0,
        isCurrentUser: uid === userId,
      };
      byUser.set(uid, entry);
    }
    entry.breakdown[key] += by;
  }

  // Seed every social user so a completely-inactive-this-month person
  // still appears (with score 0) — otherwise you'd think they left.
  for (const uid of targetIds) bump(uid, "habits", 0);

  const inWindow = (date: string) => date >= windowStartKey;

  for (const row of habitsRes.data ?? []) {
    if (!row.user_id) continue;
    for (const d of (row.completed_dates as string[] | null) ?? []) {
      if (inWindow(d)) bump(row.user_id, "habits", 1);
    }
  }
  for (const row of habitCollabDatesRes ?? []) {
    if (!row.user_id) continue;
    for (const d of (row.completed_dates as string[] | null) ?? []) {
      if (inWindow(d)) bump(row.user_id, "habits", 1);
    }
  }
  for (const row of sessionsRes.data ?? []) {
    if (!row.user_id) continue;
    bump(row.user_id, "deepwork", 1);
  }
  for (const row of tasksRes.data ?? []) {
    if (!row.user_id) continue;
    bump(row.user_id, "tasks", 1);
  }

  // Challenge counts — total unique challenges shared with the caller
  // (context pill), and challenge check-in days in-window (scored).
  const challengesByUser = new Map<string, Set<string>>();
  for (const p of challengeCheckinsRes.data ?? []) {
    if (!p.user_id) continue;
    const set = challengesByUser.get(p.user_id) ?? new Set<string>();
    set.add(p.challenge_id);
    challengesByUser.set(p.user_id, set);
    for (const d of (p.completed_dates as string[] | null) ?? []) {
      if (inWindow(d)) bump(p.user_id, "challengeDays", 1);
    }
  }
  for (const [uid, set] of challengesByUser) {
    const entry = byUser.get(uid);
    if (entry) entry.challengeCount = set.size;
  }

  // Compute the weighted score and round to keep the UI tidy.
  for (const entry of byUser.values()) {
    entry.score = Math.round(
      entry.breakdown.habits * WEIGHTS.habit +
        entry.breakdown.deepwork * WEIGHTS.deepwork +
        entry.breakdown.tasks * WEIGHTS.task +
        entry.breakdown.challengeDays * WEIGHTS.challengeDay,
    );
  }

  return Array.from(byUser.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tiebreak on total raw activity, then keep "you" above equal peers
    // so the current user doesn't get buried when everyone's at zero.
    const aTotal =
      a.breakdown.habits +
      a.breakdown.deepwork +
      a.breakdown.tasks +
      a.breakdown.challengeDays;
    const bTotal =
      b.breakdown.habits +
      b.breakdown.deepwork +
      b.breakdown.tasks +
      b.breakdown.challengeDays;
    if (bTotal !== aTotal) return bTotal - aTotal;
    if (a.isCurrentUser) return -1;
    if (b.isCurrentUser) return 1;
    return 0;
  });
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
