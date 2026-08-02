"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import type {
  Habit,
  HabitCollaborator,
  HabitListItem,
} from "@/lib/types/productivity";

function displayNameFromEmail(email: string | undefined | null): string {
  return email?.split("@")[0] ?? "Someone";
}

export async function listHabits(): Promise<HabitListItem[]> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return [];

  const { data: owned, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const ownedHabits: Habit[] = owned ?? [];
  const ownedIds = ownedHabits.map((h) => h.id);

  const [collaboratorsOnOwnedRes, myCollaborationsRes] = await Promise.all([
    ownedIds.length > 0
      ? supabase
          .from("habit_collaborators")
          .select("*")
          .in("habit_id", ownedIds)
          .eq("is_deleted", false)
      : Promise.resolve({ data: [] as HabitCollaborator[] }),
    supabase
      .from("habit_collaborators")
      .select("*, habit:habits(*)")
      .eq("user_id", userId)
      .eq("is_deleted", false),
  ]);

  const collaboratorsByHabit = new Map<string, HabitCollaborator[]>();
  for (const c of collaboratorsOnOwnedRes.data ?? []) {
    const list = collaboratorsByHabit.get(c.habit_id) ?? [];
    list.push(c);
    collaboratorsByHabit.set(c.habit_id, list);
  }

  const ownedItems: HabitListItem[] = ownedHabits.map((h) => ({
    ...h,
    isCollaboration: false,
    collaborators: collaboratorsByHabit.get(h.id) ?? [],
  }));

  type CollabRow = HabitCollaborator & { habit: Habit | null };
  const collaborationItems: HabitListItem[] = (
    (myCollaborationsRes.data ?? []) as CollabRow[]
  )
    .filter((c) => c.habit)
    .map((c) => ({
      ...(c.habit as Habit),
      completed_dates: c.completed_dates ?? [],
      isCollaboration: true,
      collaboratorId: c.id,
      collaborators: [],
    }));

  return [...ownedItems, ...collaborationItems].sort((a, b) =>
    a.created_at < b.created_at ? -1 : 1,
  );
}

export async function createHabit(input: {
  name: string;
  description?: string | null;
  category?: string | null;
  startedAt: string;
  endDate?: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const name = input.name.trim();
  if (!name) return { error: "Habit name is required" };

  const { error } = await supabase.from("habits").insert({
    id: crypto.randomUUID(),
    name,
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    started_at: input.startedAt,
    end_date: input.endDate || null,
    user_id: user.user.id,
    owner_display_name: displayNameFromEmail(user.user.email),
  });
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}

export async function toggleHabitDate(
  habitId: string,
  date: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: habit, error: fetchError } = await supabase
    .from("habits")
    .select("completed_dates")
    .eq("id", habitId)
    .eq("user_id", user.user.id)
    .single();
  if (fetchError || !habit)
    return { error: fetchError?.message ?? "Habit not found" };

  const current: string[] = habit.completed_dates ?? [];
  const next = current.includes(date)
    ? current.filter((d) => d !== date)
    : [...current, date];

  const { error } = await supabase
    .from("habits")
    .update({ completed_dates: next })
    .eq("id", habitId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}

/**
 * Toggle a date on the CALLER's own collaborator row for a shared habit
 * (they joined via someone else's invite link, so their progress lives in
 * habit_collaborators, not on the habits row itself).
 */
export async function toggleCollaboratorDate(
  habitId: string,
  date: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: collaborator, error: fetchError } = await supabase
    .from("habit_collaborators")
    .select("id, completed_dates")
    .eq("habit_id", habitId)
    .eq("user_id", user.user.id)
    .single();
  if (fetchError || !collaborator)
    return { error: "You haven't joined this habit" };

  const current: string[] = collaborator.completed_dates ?? [];
  const next = current.includes(date)
    ? current.filter((d) => d !== date)
    : [...current, date];

  const { error } = await supabase
    .from("habit_collaborators")
    .update({ completed_dates: next })
    .eq("id", collaborator.id);
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}

/**
 * Fetch a habit by id WITHOUT the user-ownership check — used when someone
 * follows an invite link to a habit that isn't theirs. Only exposes fields
 * needed to render the invite preview, never completed_dates or user_id.
 *
 * Uses the service-role admin client so RLS doesn't block a different
 * user (or an anonymous visitor pre-signup) from resolving the invite.
 */
export async function getPublicHabit(
  habitId: string,
): Promise<Pick<
  Habit,
  "id" | "name" | "description" | "category" | "owner_display_name"
> | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("habits")
    .select("id, name, description, category, owner_display_name")
    .eq("id", habitId)
    .eq("is_deleted", false)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/**
 * Collaborators on a habit the caller owns — used for the avatar stack and
 * the activity-comparison view. Only the owner can see this list.
 */
export async function getHabitCollaborators(
  habitId: string,
): Promise<HabitCollaborator[]> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return [];

  const { data: habit } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (!habit) return [];

  const { data } = await supabase
    .from("habit_collaborators")
    .select("*")
    .eq("habit_id", habitId)
    .eq("is_deleted", false)
    .order("joined_at", { ascending: true });
  return data ?? [];
}

/**
 * What the current signed-in user's relationship to this habit is — used
 * by the invite/join page to decide which state to render before they act.
 */
export async function getMyHabitStatus(habitId: string): Promise<{
  isAuthenticated: boolean;
  isOwner: boolean;
  isCollaborator: boolean;
  collaboratorCount: number;
}> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const { count } = await admin
    .from("habit_collaborators")
    .select("id", { count: "exact", head: true })
    .eq("habit_id", habitId)
    .eq("is_deleted", false);

  if (authError || !user?.user) {
    return {
      isAuthenticated: false,
      isOwner: false,
      isCollaborator: false,
      collaboratorCount: count ?? 0,
    };
  }

  const [{ data: owned }, { data: collaboration }] = await Promise.all([
    supabase
      .from("habits")
      .select("id")
      .eq("id", habitId)
      .eq("user_id", user.user.id)
      .maybeSingle(),
    supabase
      .from("habit_collaborators")
      .select("id")
      .eq("habit_id", habitId)
      .eq("user_id", user.user.id)
      .eq("is_deleted", false)
      .maybeSingle(),
  ]);

  return {
    isAuthenticated: true,
    isOwner: Boolean(owned),
    isCollaborator: Boolean(collaboration),
    collaboratorCount: count ?? 0,
  };
}

/**
 * Accept a habit invite: create (or return the existing) habit_collaborators
 * row for the caller against the ORIGINAL habit, so their progress stays
 * linked to the inviter's habit instead of becoming a disconnected copy.
 */
export async function joinHabitAsCollaborator(
  habitId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const source = await getPublicHabit(habitId);
  if (!source) return { error: "That habit doesn't exist" };

  const { data: owned } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (owned) return { error: "You already own this habit" };

  const { data: existing } = await supabase
    .from("habit_collaborators")
    .select("id")
    .eq("habit_id", habitId)
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (existing) return {};

  const { error } = await supabase.from("habit_collaborators").insert({
    id: crypto.randomUUID(),
    habit_id: habitId,
    user_id: user.user.id,
    display_name: displayNameFromEmail(user.user.email),
    completed_dates: [],
  });
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}

export async function deleteHabit(
  habitId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("habits")
    .update({ is_deleted: true })
    .eq("id", habitId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}
