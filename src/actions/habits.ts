"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import type {
  GoalComparator,
  Habit,
  HabitChecklistItem,
  HabitCollaborator,
  HabitListItem,
  HabitType,
} from "@/lib/types/productivity";

function displayNameFromEmail(email: string | undefined | null): string {
  return email?.split("@")[0] ?? "Someone";
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  // Checklist items + today's per-item/numeric state — only relevant for
  // type === "checklist"/"number" habits, but cheap enough to just fetch for
  // all owned ids in one batched query rather than branching per-type.
  const [checklistItemsRes, todayCompletionsRes] = await Promise.all([
    ownedIds.length > 0
      ? supabase
          .from("habit_checklist_items")
          .select("*")
          .in("habit_id", ownedIds)
          .eq("is_deleted", false)
          .order("order_index", { ascending: true })
      : Promise.resolve({ data: [] as HabitChecklistItem[] }),
    ownedIds.length > 0
      ? supabase
          .from("habit_completions")
          .select("habit_id, completed_item_ids, numeric_value")
          .in("habit_id", ownedIds)
          .eq("user_id", userId)
          .eq("completion_date", todayIso())
      : Promise.resolve({
          data: [] as {
            habit_id: string;
            completed_item_ids: string[];
            numeric_value: number | null;
          }[],
        }),
  ]);

  const checklistItemsByHabit = new Map<string, HabitChecklistItem[]>();
  for (const item of checklistItemsRes.data ?? []) {
    const list = checklistItemsByHabit.get(item.habit_id) ?? [];
    list.push(item);
    checklistItemsByHabit.set(item.habit_id, list);
  }
  const todayCompletedItemsByHabit = new Map<string, string[]>();
  const todayNumericValueByHabit = new Map<string, number | null>();
  for (const row of todayCompletionsRes.data ?? []) {
    todayCompletedItemsByHabit.set(row.habit_id, row.completed_item_ids ?? []);
    todayNumericValueByHabit.set(row.habit_id, row.numeric_value ?? null);
  }

  const ownedItemsById = new Map<string, HabitListItem>();
  for (const h of ownedHabits) {
    ownedItemsById.set(h.id, {
      ...h,
      isCollaboration: false,
      collaborators: collaboratorsByHabit.get(h.id) ?? [],
      checklistItems: checklistItemsByHabit.get(h.id) ?? [],
      todayCompletedItemIds: todayCompletedItemsByHabit.get(h.id) ?? [],
      todayNumericValue: todayNumericValueByHabit.get(h.id) ?? null,
      children: [],
    });
  }

  // Nest children (habits with parent_habit_id set) under their parent, and
  // exclude them from the flat top-level list — they render inside the
  // parent's "smart checklist" card instead of as their own entry.
  const childIds = new Set<string>();
  for (const h of ownedHabits) {
    if (!h.parent_habit_id) continue;
    const parent = ownedItemsById.get(h.parent_habit_id);
    const child = ownedItemsById.get(h.id);
    if (!parent || !child) continue;
    (parent as { children: HabitListItem[] }).children.push(child);
    childIds.add(h.id);
  }

  const ownedItems: HabitListItem[] = ownedHabits
    .filter((h) => !childIds.has(h.id))
    .map((h) => ownedItemsById.get(h.id) as HabitListItem);

  type CollabRow = HabitCollaborator & { habit: Habit | null };
  const myCollaborations = (
    (myCollaborationsRes.data ?? []) as CollabRow[]
  ).filter((c) => c.habit);
  const collaborationHabitIds = myCollaborations.map((c) => c.habit_id);

  // Comparison view needs the OTHER participants too — not just the caller's
  // own row. For a habit the caller joined (rather than owns), that's the
  // owner (from the joined habits row) plus any sibling collaborators, so
  // fetch those siblings the same way collaboratorsByHabit does for owned
  // habits above.
  const { data: siblingCollaborators } =
    collaborationHabitIds.length > 0
      ? await supabase
          .from("habit_collaborators")
          .select("*")
          .in("habit_id", collaborationHabitIds)
          .eq("is_deleted", false)
          .neq("user_id", userId)
      : { data: [] as HabitCollaborator[] };
  const siblingsByHabit = new Map<string, HabitCollaborator[]>();
  for (const c of siblingCollaborators ?? []) {
    const list = siblingsByHabit.get(c.habit_id) ?? [];
    list.push(c);
    siblingsByHabit.set(c.habit_id, list);
  }

  const collaborationItems: HabitListItem[] = myCollaborations.map((c) => {
    const habit = c.habit as Habit;
    const owner: HabitCollaborator = {
      id: `owner:${habit.id}`,
      habit_id: habit.id,
      user_id: habit.user_id,
      display_name: habit.owner_display_name,
      completed_dates: habit.completed_dates ?? [],
      joined_at: habit.created_at,
      is_deleted: false,
      created_at: habit.created_at,
      updated_at: habit.updated_at,
    };
    return {
      ...habit,
      completed_dates: c.completed_dates ?? [],
      isCollaboration: true,
      collaboratorId: c.id,
      collaborators: [owner, ...(siblingsByHabit.get(habit.id) ?? [])],
    };
  });

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
  type?: HabitType;
  targetPerWeek?: number;
  // Only used when type === "checklist" — steps the habit is broken into.
  checklistItems?: { name: string; isOptional?: boolean }[];
  // Only used when type === "number" — e.g. "at least 30 pushups a day".
  goalComparator?: GoalComparator;
  goalNumber?: number;
  goalUnit?: string | null;
}): Promise<{
  error?: string;
  id?: string;
  // Item ids in the SAME ORDER as `input.checklistItems` — the client uses
  // these to build a real optimistic HabitListItem (with items whose ids
  // will match what toggleChecklistItem expects) so the new habit appears
  // instantly and its steps are interactable immediately, no refresh needed.
  checklistItemIds?: string[];
}> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const name = input.name.trim();
  if (!name) return { error: "Habit name is required" };

  const type: HabitType = input.type ?? "boolean";
  if (type === "number" && (input.goalNumber == null || Number.isNaN(input.goalNumber))) {
    return { error: "Set a goal number for this habit" };
  }
  const id = crypto.randomUUID();

  const { error } = await supabase.from("habits").insert({
    id,
    name,
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    started_at: input.startedAt,
    end_date: input.endDate || null,
    user_id: user.user.id,
    owner_display_name: displayNameFromEmail(user.user.email),
    type,
    target_per_week: input.targetPerWeek ?? 7,
    goal_comparator: type === "number" ? (input.goalComparator ?? "at_least") : null,
    goal_number: type === "number" ? input.goalNumber : null,
    goal_unit: type === "number" ? input.goalUnit?.trim() || null : null,
  });
  if (error) return { error: error.message };

  const items = (input.checklistItems ?? []).filter((i) => i.name.trim());
  let checklistItemIds: string[] | undefined;
  if (type === "checklist" && items.length > 0) {
    const rows = items.map((item, index) => ({
      id: crypto.randomUUID(),
      habit_id: id,
      name: item.name.trim(),
      order_index: index + 1,
      is_optional: item.isOptional ?? false,
    }));
    const { error: itemsError } = await supabase
      .from("habit_checklist_items")
      .insert(rows);
    if (itemsError) {
      // Habit row is already created; surface the error but don't roll back
      // — the user can still add items later from the habit's card.
      return { id, error: `Habit created, but steps failed to save: ${itemsError.message}` };
    }
    checklistItemIds = rows.map((r) => r.id);
  }

  revalidatePath("/app/habits");
  return { id, checklistItemIds };
}

/**
 * Update the editable fields on an existing habit — the name, description,
 * category, and (for number habits) the goal. Type and parent-child
 * linkage are deliberately NOT editable here; changing type after the fact
 * would leave orphan checklist items or numeric_value rows, and the
 * parent link has its own dedicated setHabitParent action.
 */
export async function updateHabit(
  habitId: string,
  input: {
    name: string;
    description?: string | null;
    category?: string | null;
    endDate?: string | null;
    goalComparator?: GoalComparator;
    goalNumber?: number;
    goalUnit?: string | null;
  },
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const name = input.name.trim();
  if (!name) return { error: "Habit name is required" };

  // Only touch goal_* if the caller actually passed them — an undefined
  // goalNumber for a boolean/checklist habit shouldn't null out fields
  // we don't own, and for a number habit an undefined goalNumber means
  // "keep it as is".
  const patch: Record<string, unknown> = {
    name,
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    end_date: input.endDate || null,
    updated_at: new Date().toISOString(),
  };
  if (input.goalNumber !== undefined) patch.goal_number = input.goalNumber;
  if (input.goalComparator !== undefined) patch.goal_comparator = input.goalComparator;
  if (input.goalUnit !== undefined) patch.goal_unit = input.goalUnit?.trim() || null;

  const { error } = await supabase
    .from("habits")
    .update(patch)
    .eq("id", habitId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}

/**
 * Link an existing habit as a child of a "smart checklist" parent habit —
 * e.g. a plain boolean "Meditation" habit nested under a "Morning Wellness"
 * parent. Both must belong to the caller, the parent must actually be a
 * smart_checklist (enforced here rather than a DB constraint, since a
 * cross-row CHECK isn't possible in Postgres), and a habit can't be linked
 * under itself.
 */
export async function setHabitParent(
  childId: string,
  parentId: string,
): Promise<{ error?: string }> {
  if (childId === parentId) return { error: "A habit can't be its own parent" };

  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: parent, error: parentError } = await supabase
    .from("habits")
    .select("id, type")
    .eq("id", parentId)
    .eq("user_id", user.user.id)
    .eq("is_deleted", false)
    .maybeSingle();
  if (parentError) return { error: parentError.message };
  if (!parent) return { error: "Parent habit not found" };
  if (parent.type !== "smart_checklist") {
    return { error: "Only a smart checklist habit can have sub-habits" };
  }

  const { error } = await supabase
    .from("habits")
    .update({ parent_habit_id: parentId })
    .eq("id", childId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}

/**
 * Unlink a habit from its smart-checklist parent — it goes back to being
 * its own top-level habit.
 */
export async function removeHabitParent(
  childId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("habits")
    .update({ parent_habit_id: null })
    .eq("id", childId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}

/**
 * Add a step to an existing checklist habit — appended after the current
 * last order_index.
 */
export async function addChecklistItem(
  habitId: string,
  name: string,
  isOptional = false,
): Promise<{ error?: string; id?: string; orderIndex?: number }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Step name is required" };

  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: habit } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (!habit) return { error: "Habit not found" };

  const { data: existing } = await supabase
    .from("habit_checklist_items")
    .select("order_index")
    .eq("habit_id", habitId)
    .eq("is_deleted", false)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;

  const id = crypto.randomUUID();
  const { error } = await supabase.from("habit_checklist_items").insert({
    id,
    habit_id: habitId,
    name: trimmed,
    order_index: nextOrder,
    is_optional: isOptional,
  });
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return { id, orderIndex: nextOrder };
}

export async function deleteChecklistItem(
  itemId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: item } = await supabase
    .from("habit_checklist_items")
    .select("habit_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { error: "Step not found" };

  const { data: habit } = await supabase
    .from("habits")
    .select("id")
    .eq("id", item.habit_id)
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (!habit) return { error: "Step not found" };

  const { error } = await supabase
    .from("habit_checklist_items")
    .update({ is_deleted: true })
    .eq("id", itemId);
  if (error) return { error: error.message };

  revalidatePath("/app/habits");
  return {};
}

/**
 * Toggle one checklist item's completion for a given day. Once every
 * non-optional item for the habit is checked for that day, the day is
 * marked complete on the habit's `completed_dates` — same field the
 * boolean-habit heatmap already reads, so the calendar/streak UI needs no
 * separate code path for checklist habits.
 */
export async function toggleChecklistItem(
  habitId: string,
  date: string,
  itemId: string,
): Promise<{ error?: string; completedItemIds?: string[]; dayComplete?: boolean }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("id, completed_dates")
    .eq("id", habitId)
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (habitError) return { error: habitError.message };
  if (!habit) return { error: "Habit not found" };

  const { data: items, error: itemsError } = await supabase
    .from("habit_checklist_items")
    .select("id, is_optional")
    .eq("habit_id", habitId)
    .eq("is_deleted", false);
  if (itemsError) return { error: itemsError.message };

  const { data: existingCompletion } = await supabase
    .from("habit_completions")
    .select("completed_item_ids")
    .eq("habit_id", habitId)
    .eq("user_id", user.user.id)
    .eq("completion_date", date)
    .maybeSingle();

  const current: string[] = existingCompletion?.completed_item_ids ?? [];
  const nextItemIds = current.includes(itemId)
    ? current.filter((id) => id !== itemId)
    : [...current, itemId];

  const { error: upsertError } = await supabase
    .from("habit_completions")
    .upsert(
      {
        habit_id: habitId,
        user_id: user.user.id,
        completion_date: date,
        completed_item_ids: nextItemIds,
      },
      { onConflict: "habit_id,user_id,completion_date" },
    );
  if (upsertError) return { error: upsertError.message };

  const requiredIds = (items ?? [])
    .filter((i) => !i.is_optional)
    .map((i) => i.id);
  const dayComplete =
    requiredIds.length > 0 && requiredIds.every((id) => nextItemIds.includes(id));

  const currentDates: string[] = habit.completed_dates ?? [];
  const hasDate = currentDates.includes(date);
  if (dayComplete !== hasDate) {
    const nextDates = dayComplete
      ? [...currentDates, date]
      : currentDates.filter((d) => d !== date);
    const { error: datesError } = await supabase
      .from("habits")
      .update({ completed_dates: nextDates })
      .eq("id", habitId)
      .eq("user_id", user.user.id);
    if (datesError) return { error: datesError.message };
  }

  revalidatePath("/app/habits");
  return { completedItemIds: nextItemIds, dayComplete };
}

function meetsGoal(
  value: number,
  goal: number,
  comparator: GoalComparator,
): boolean {
  if (comparator === "at_least") return value >= goal;
  if (comparator === "less_than") return value < goal;
  return value === goal;
}

/**
 * Log today's (or a past day's) numeric value for a "number" habit — e.g.
 * 20 pushups. Compares against the habit's own goal_number/goal_comparator
 * to decide whether the day counts as done, and syncs that into
 * `completed_dates` the same way toggleChecklistItem does, so the heatmap
 * and streak logic need no separate code path for this habit type.
 */
export async function logNumericValue(
  habitId: string,
  date: string,
  value: number,
): Promise<{ error?: string; dayComplete?: boolean }> {
  if (!Number.isFinite(value)) return { error: "Enter a valid number" };

  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("completed_dates, goal_number, goal_comparator")
    .eq("id", habitId)
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (habitError) return { error: habitError.message };
  if (!habit) return { error: "Habit not found" };
  if (habit.goal_number == null || !habit.goal_comparator) {
    return { error: "This habit doesn't have a goal set" };
  }

  const { error: upsertError } = await supabase
    .from("habit_completions")
    .upsert(
      {
        habit_id: habitId,
        user_id: user.user.id,
        completion_date: date,
        numeric_value: value,
      },
      { onConflict: "habit_id,user_id,completion_date" },
    );
  if (upsertError) return { error: upsertError.message };

  const dayComplete = meetsGoal(
    value,
    Number(habit.goal_number),
    habit.goal_comparator as GoalComparator,
  );

  const currentDates: string[] = habit.completed_dates ?? [];
  const hasDate = currentDates.includes(date);
  if (dayComplete !== hasDate) {
    const nextDates = dayComplete
      ? [...currentDates, date]
      : currentDates.filter((d) => d !== date);
    const { error: datesError } = await supabase
      .from("habits")
      .update({ completed_dates: nextDates })
      .eq("id", habitId)
      .eq("user_id", user.user.id);
    if (datesError) return { error: datesError.message };
  }

  revalidatePath("/app/habits");
  return { dayComplete };
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
