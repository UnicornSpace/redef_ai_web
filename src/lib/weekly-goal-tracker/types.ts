/**
 * Shared types for the Weekly Goal Planner generator — a single-page,
 * print-ready A4 sheet split into three fixed bands:
 *
 *   1. Header (~6% of the page) — a free-text "focus" line and a year.
 *   2. Goals (~44%) — a nested Goal → Task → Subtask checklist, printed as
 *      checkboxes the user ticks by hand through the week.
 *   3. Grid (~50%) — a Mon–Sun table with custom row labels (e.g. "Work
 *      Hours") and blank cells the user fills in freehand — deliberately
 *      NOT pre-populated with anything beyond the row label, since the
 *      whole point is a surface to draw/write on.
 */

export interface SubtaskDraft {
  id: string;
  text: string;
}

export interface TaskDraft {
  id: string;
  text: string;
  subtasks: SubtaskDraft[];
}

export interface GoalDraft {
  id: string;
  text: string;
  tasks: TaskDraft[];
}

/** Full week, Monday first. */
export const GRID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export interface WeeklyPlannerConfig {
  /** Free-text "what this week is about" line. Printed blank if empty. */
  focus?: string;
  /** Just the year, e.g. "2026". Printed blank if empty. */
  year?: string;
  goals: GoalDraft[];
  /** Row labels for the bottom grid — first defaults to "Work Hours". */
  gridRows: string[];
  /**
   * When true, ignore focus/year/goals/gridRows content entirely and
   * render a fully blank template (structure only) — the "download an
   * empty sheet" path.
   */
  blank?: boolean;
}

export const LIMITS = {
  maxGoals: 6,
  maxTasksPerGoal: 6,
  maxSubtasksPerTask: 6,
  textMax: 80,
  minGridRows: 1,
  maxGridRows: 8,
} as const;

export const DEFAULT_GRID_ROWS = [
  "Work Hours",
  "",
  "",
  "",
  "",
] as const;
