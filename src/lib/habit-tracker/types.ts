/**
 * Shared types for the Habit Challenge Sheet generator.
 *
 * Core principle: nothing here is habit-specific. A habit is just a `label`
 * (free text) plus one of four generic widget types. A "5 prayers" tracker and
 * a "3 meals" tracker are the SAME config with different numbers.
 */

export type WidgetType =
  | "multi-check"
  | "checkbox"
  | "blank-line"
  | "unit-blocks";

export interface HabitConfig {
  /** Free-text column heading, e.g. "Namaz", "Meals", "Deep Work". */
  label: string;
  type: WidgetType;
  /** Required for `multi-check` and `unit-blocks`; ignored otherwise. */
  count?: number;
  /** Optional, only for `multi-check`. If present, length should equal `count`. */
  subLabels?: string[];
}

export interface TrackerConfig {
  /** Total number of day-rows. 1..365. */
  challengeLength: number;
  /** Optional ISO date (yyyy-mm-dd). If set, the Date column is pre-filled. */
  startDate?: string;
  /** At least one habit column, in display order. */
  habits: HabitConfig[];
}

export const LIMITS = {
  minDays: 1,
  maxDays: 365,
  minCount: 1,
  /** Max sub-boxes per column so a single habit can't blow out the page width. */
  maxCount: 12,
  /** Soft cap on habit columns (beyond this, the sheet is unusable anyway). */
  maxHabits: 12,
} as const;

export const PRESET_LENGTHS = [21, 50, 90] as const;

export const WIDGET_META: Record<
  WidgetType,
  {
    name: string;
    blurb: string;
    needsCount: boolean;
    supportsSubLabels: boolean;
  }
> = {
  "multi-check": {
    name: "Multi-check",
    blurb:
      "A row of sub-boxes to tick. Great for 5 prayers, 3 meals, medication doses.",
    needsCount: true,
    supportsSubLabels: true,
  },
  checkbox: {
    name: "Checkbox",
    blurb: "A single yes/no box. Done or not done.",
    needsCount: false,
    supportsSubLabels: false,
  },
  "blank-line": {
    name: "Blank line",
    blurb: "An empty cell to write anything — a number, a count, a short note.",
    needsCount: false,
    supportsSubLabels: false,
  },
  "unit-blocks": {
    name: "Unit blocks",
    blurb: "Boxes to shade in by hand — hours, glasses of water, pages read.",
    needsCount: true,
    supportsSubLabels: false,
  },
};

export function widgetNeedsCount(type: WidgetType): boolean {
  return WIDGET_META[type].needsCount;
}
