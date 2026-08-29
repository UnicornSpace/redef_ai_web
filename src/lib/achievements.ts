export interface Achievement {
  key: string;
  label: string;
  emoji: string;
}

/**
 * Tenure milestones — the concrete examples the product asked for ("15 days
 * signed up, 1 month") are account-age based, not activity-based, so this
 * needs nothing beyond auth.users.created_at (no privileged cross-user
 * habit/task data required to compute or display these).
 */
const TENURE_MILESTONES: { days: number; key: string; label: string; emoji: string }[] = [
  { days: 7, key: "week_1", label: "1 week", emoji: "🌱" },
  { days: 15, key: "days_15", label: "15 days", emoji: "🔥" },
  { days: 30, key: "month_1", label: "1 month", emoji: "⭐" },
  { days: 90, key: "month_3", label: "3 months", emoji: "🏆" },
  { days: 180, key: "month_6", label: "6 months", emoji: "💎" },
  { days: 365, key: "year_1", label: "1 year", emoji: "👑" },
];

export function computeTenureAchievements(
  memberSince: string | null,
): Achievement[] {
  if (!memberSince) return [];
  const days = Math.floor(
    (Date.now() - new Date(memberSince).getTime()) / 86_400_000,
  );
  return TENURE_MILESTONES.filter((m) => days >= m.days).map((m) => ({
    key: m.key,
    label: m.label,
    emoji: m.emoji,
  }));
}

/**
 * Activity-based achievements — unlike tenure, these need real usage data
 * (referral count, completed tasks, habit streak, deep-work hours), so the
 * caller does the actual querying (see getPublicActivityAchievements in
 * src/actions/activity.ts, which respects the same public-activity opt-out
 * the activity heatmap does) and passes in plain numbers here. Kept as pure
 * functions, same shape as computeTenureAchievements, so the thresholds are
 * easy to see and change in one place without touching any query code.
 */
type Milestone = { min: number; key: string; label: string; emoji: string };

function unlockedFor(value: number, milestones: Milestone[]): Achievement[] {
  return milestones
    .filter((m) => value >= m.min)
    .map((m) => ({ key: m.key, label: m.label, emoji: m.emoji }));
}

const REFERRAL_MILESTONES: Milestone[] = [
  { min: 1, key: "referral_1", label: "First referral", emoji: "🤝" },
  { min: 3, key: "referral_3", label: "Brought in 3 friends", emoji: "🎉" },
  { min: 10, key: "referral_10", label: "Community builder", emoji: "🌟" },
];

export function computeReferralAchievements(
  referralCount: number,
): Achievement[] {
  return unlockedFor(referralCount, REFERRAL_MILESTONES);
}

const TASK_MILESTONES: Milestone[] = [
  { min: 10, key: "tasks_10", label: "10 tasks done", emoji: "✅" },
  { min: 50, key: "tasks_50", label: "50 tasks done", emoji: "🚀" },
  { min: 200, key: "tasks_200", label: "200 tasks done", emoji: "🏅" },
];

export function computeTaskAchievements(
  completedTaskCount: number,
): Achievement[] {
  return unlockedFor(completedTaskCount, TASK_MILESTONES);
}

const HABIT_STREAK_MILESTONES: Milestone[] = [
  { min: 7, key: "streak_7", label: "7-day streak", emoji: "🔥" },
  { min: 30, key: "streak_30", label: "30-day streak", emoji: "💪" },
  { min: 100, key: "streak_100", label: "100-day streak", emoji: "🐉" },
];

export function computeHabitStreakAchievements(
  bestStreak: number,
): Achievement[] {
  return unlockedFor(bestStreak, HABIT_STREAK_MILESTONES);
}

const DEEP_WORK_MILESTONES: Milestone[] = [
  { min: 10, key: "deepwork_10h", label: "10 hours of deep work", emoji: "🧠" },
  { min: 50, key: "deepwork_50h", label: "50 hours of deep work", emoji: "⚡" },
  { min: 200, key: "deepwork_200h", label: "200 hours of deep work", emoji: "🗿" },
];

export function computeDeepWorkAchievements(
  totalHours: number,
): Achievement[] {
  return unlockedFor(totalHours, DEEP_WORK_MILESTONES);
}
