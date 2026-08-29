"use client";

import { toast } from "sonner";
import type { Achievement } from "@/lib/achievements";

/**
 * Visual for a single "achievement unlocked" moment — built ahead of the
 * actual trigger. Nothing in the app calls showAchievementUnlocked() yet;
 * detecting the moment an achievement is actually crossed (a referral
 * lands, a streak hits 30, a task-count milestone passes) is a separate
 * decision to make once the delivery mechanism is settled. This is just
 * the UI, ready to wire up.
 */
function AchievementUnlockedCard({
  achievement,
}: {
  achievement: Achievement;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-rf-green-deep/30 bg-g-green-pale px-4 py-3 shadow-lg">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-xl"
      >
        {achievement.emoji}
      </span>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wide text-rf-green-deep">
          Achievement unlocked
        </span>
        <span className="text-sm font-semibold text-ink">
          {achievement.label}
        </span>
      </div>
    </div>
  );
}

/** Call this once a real trigger decides an achievement was just earned. */
export function showAchievementUnlocked(achievement: Achievement): void {
  toast.custom(() => <AchievementUnlockedCard achievement={achievement} />, {
    duration: 5000,
  });
}
