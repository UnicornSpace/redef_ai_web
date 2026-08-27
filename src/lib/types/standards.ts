/**
 * Types for user_standards. Kept out of src/actions/standards.ts because
 * that file has "use server" at the top — Next's server-action transform
 * only permits async function exports there, and a plain `export
 * interface` silently poisons every action in the module at runtime. This
 * has bitten this project twice already (src/lib/age-ranges.ts,
 * src/lib/types/profile.ts) — same fix, same reason.
 */

/**
 * How the user wants to be coached relative to their target:
 * - push:     hold them to it, call it out when they're short
 * - balanced: note the gap either way, no strong lean
 * - protect:  guard against overwork, flag when they're running long
 */
export type CoachingStance = "push" | "balanced" | "protect";

export interface UserStandards {
  user_id: string;
  target_deep_work_hours: number | null;
  target_workdays_per_week: number | null;
  coaching_stance: CoachingStance | null;
  protected_time: string | null;
}

export const COACHING_STANCES: {
  value: CoachingStance;
  label: string;
  description: string;
}[] = [
  {
    value: "push",
    label: "Push me",
    description:
      "Hold me to my target. If I'm short, say so — don't soften it.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Tell me where I stand without leaning either way.",
  },
  {
    value: "protect",
    label: "Protect me",
    description:
      "Watch for overwork. Tell me to stop when I've done enough.",
  },
];
