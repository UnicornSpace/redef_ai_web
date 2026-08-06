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
