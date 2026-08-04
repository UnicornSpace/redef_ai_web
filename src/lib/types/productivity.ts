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
 */
export type HabitListItem =
  | (Habit & { isCollaboration: false; collaborators: HabitCollaborator[] })
  | (Habit & {
      isCollaboration: true;
      collaboratorId: string;
      collaborators: HabitCollaborator[];
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
  habits: { id: string; name: string }[];
  tasks: { id: string; name: string; is_completed: boolean }[];
  hoursLogged: number | null;
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
