export interface Task {
  id: string;
  user_id: string | null;
  name: string;
  category: string | null;
  due_date: string | null;
  is_completed: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export type HabitType = "boolean" | "checklist" | "smart_checklist" | "number";
export type HabitPeriod = "daily" | "weekly" | "custom";
export type GoalComparator = "at_least" | "less_than" | "exactly";
export type HabitPriority = "high" | "medium" | "low";

export interface Habit {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  started_at: string;
  end_date: string | null;
  completed_dates: string[];
  category: string | null;
  owner_display_name: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;

  // New fields for habit redesign
  type: HabitType;
  parent_habit_id: string | null;
  target_per_week: number;
  user_goal_period: HabitPeriod;
  custom_frequency: number | null;
  user_goal_category: string | null;
  color_tag: string | null;
  estimated_time_minutes: number | null;
  current_streak: number;
  best_streak: number;
  completion_count: number;
  last_completed_at: string | null;

  // Only set for type === "number" — e.g. "at least 30 pushups a day".
  goal_number: number | null;
  goal_unit: string | null;
  goal_comparator: GoalComparator | null;

  // Null = unspecified. Sort order in the Focus view is high → medium →
  // low → unspecified.
  priority: HabitPriority | null;
}

export interface HabitChecklistItem {
  id: string;
  habit_id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_optional: boolean;
  estimated_time_minutes: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  completion_time: string;
  completed_item_ids: string[];
  numeric_value: number | null;
  time_spent_minutes: number | null;
  notes: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserOnboarding {
  id: string;
  user_id: string;
  age_range: string | null;
  selected_tools: string[];
  habit_goals: string[] | null;
  habit_challenges: string[] | null;
  habit_preferred_frequency: string | null;
  habit_reminder_time: string | null;
  recommended_habit_ids: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitGoal {
  id: string;
  user_id: string;
  goal_type: string;
  goal_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitCollaborator {
  id: string;
  habit_id: string;
  user_id: string | null;
  display_name: string | null;
  completed_dates: string[];
  joined_at: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * One row in a user's habit list — either a habit they own, or a habit
 * they're collaborating on (accepted someone else's invite). Owned habits
 * carry the other collaborators on `collaborators` for the avatar stack.
 *
 * `checklistItems` + `todayCompletedItemIds` are only populated for
 * type === "checklist" habits. `todayNumericValue` is only populated for
 * type === "number" habits. `children` is only populated for
 * type === "smart_checklist" parents — the flat list returned by
 * listHabits() excludes any habit with a parent_habit_id, since those
 * render nested inside their parent's card instead of as their own
 * top-level entry.
 */
export type HabitListItem =
  | (Habit & {
      isCollaboration: false;
      collaborators: HabitCollaborator[];
      checklistItems?: HabitChecklistItem[];
      todayCompletedItemIds?: string[];
      todayNumericValue?: number | null;
      children?: HabitListItem[];
    })
  | (Habit & {
      isCollaboration: true;
      collaboratorId: string;
      collaborators: HabitCollaborator[];
      checklistItems?: HabitChecklistItem[];
      todayCompletedItemIds?: string[];
      todayNumericValue?: number | null;
      children?: HabitListItem[];
    });

export interface Project {
  id: string;
  user_id: string | null;
  name: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeepworkSession {
  id: string;
  user_id: string | null;
  project_id: string | null;
  start_time: string;
  end_time: string;
  duration_in_minutes: number;
  duration_in_seconds: number;
  is_manual_entry: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeepworkSessionWithProject extends DeepworkSession {
  project: Pick<Project, "id" | "name"> | null;
}

export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  user_id: string | null;
  type: TransactionType;
  amount: number;
  category: string | null;
  space: string | null;
  description: string | null;
  occurred_on: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export type GoalPeriodType = "weekly" | "21_day" | "monthly" | "custom";

export interface Goal {
  id: string;
  user_id: string | null;
  title: string;
  period_type: GoalPeriodType;
  start_date: string;
  end_date: string;
  daily_hours_target: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalWithProgress extends Goal {
  habits: {
    id: string;
    name: string;
    completedToday: boolean;
    daysDone: number;
    daysElapsed: number;
  }[];
  tasks: { id: string; name: string; is_completed: boolean }[];
  hoursLogged: number | null;
  hoursTarget: number | null;
  progressPct: number;
}

export interface Challenge {
  id: string;
  owner_user_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  start_date: string;
  end_date: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string | null;
  display_name: string | null;
  completed_dates: string[];
  joined_at: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
