/**
 * The optional feature "modules" a user can turn on/off during onboarding —
 * Talk, Calendar, Challenges, and Home stay core/always-on; these four are
 * the ones people skip if they only want part of the app.
 */
export type ModuleKey = "habits" | "tasks" | "deep_work" | "personal_finance";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  description: string;
}

export const MODULES: ModuleDef[] = [
  {
    key: "habits",
    label: "Habits",
    description: "Track daily habits and build streaks.",
  },
  {
    key: "tasks",
    label: "Tasks",
    description: "Capture to-dos with due dates and categories.",
  },
  {
    key: "deep_work",
    label: "Deep Work",
    description: "Log focused work sessions and see where your hours go.",
  },
  {
    key: "personal_finance",
    label: "Personal Finance",
    description: "Track income and expenses.",
  },
];

export const DEFAULT_ENABLED_MODULES: ModuleKey[] = MODULES.map((m) => m.key);

export function isModuleKey(value: string): value is ModuleKey {
  return MODULES.some((m) => m.key === value);
}
