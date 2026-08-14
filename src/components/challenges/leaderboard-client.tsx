"use client";

import { Trophy, Users } from "lucide-react";
import type { LeaderboardEntry } from "@/actions/challenges";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AVATAR_ACCENT_BG_CLASSES, accentIndexFor, initialsOf } from "@/lib/avatar";
import { cn } from "@/lib/utils";

/**
 * Turn the per-stream breakdown into a compact subtitle like "12 habits ·
 * 4 sessions · 8 tasks · 3 challenge days" — only streams with a non-zero
 * count appear, so a low-activity user's row stays clean.
 */
function breakdownLine(entry: LeaderboardEntry): string {
  const parts: string[] = [];
  const { habits, deepwork, tasks, challengeDays } = entry.breakdown;
  if (habits > 0) parts.push(`${habits} habit${habits === 1 ? "" : "s"}`);
  if (deepwork > 0) parts.push(`${deepwork} session${deepwork === 1 ? "" : "s"}`);
  if (tasks > 0) parts.push(`${tasks} task${tasks === 1 ? "" : "s"}`);
  if (challengeDays > 0)
    parts.push(`${challengeDays} challenge day${challengeDays === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export function LeaderboardClient({
  entries,
}: {
  entries: LeaderboardEntry[];
}) {
  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>No one else here yet</EmptyTitle>
          <EmptyDescription>
            Join or start a challenge, or share a habit with a friend, to
            see how you stack up against everyone across all your
            activity.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 pb-16 md:px-8 pt-6">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wide text-body-muted">
          Activity, last 30 days
        </h2>
        <span className="text-[10px] text-body-muted">
          habits + deep work + tasks + challenges
        </span>
      </div>
      <div className="rounded-2xl border border-line bg-paper">
        {entries.map((entry, i) => {
          const subtitle = breakdownLine(entry);
          return (
            <div
              key={entry.key}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                i !== entries.length - 1 && "border-b border-line",
                entry.isCurrentUser && "bg-g-green-pale",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  i === 0
                    ? "bg-rf-amber text-white"
                    : "bg-line text-body-muted",
                )}
              >
                {i === 0 ? <Trophy size={12} /> : i + 1}
              </span>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                  AVATAR_ACCENT_BG_CLASSES[accentIndexFor(entry.displayName)],
                )}
              >
                {initialsOf(entry.displayName)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-ink">
                  {entry.displayName}
                  {entry.isCurrentUser ? " (you)" : ""}
                </span>
                {subtitle ? (
                  <span className="truncate text-[11px] text-body-muted">
                    {subtitle}
                  </span>
                ) : entry.challengeCount > 0 ? (
                  <span className="truncate text-[11px] text-body-muted">
                    In {entry.challengeCount}{" "}
                    {entry.challengeCount === 1 ? "challenge" : "challenges"}
                  </span>
                ) : (
                  <span className="truncate text-[11px] text-body-muted">
                    Quiet this month
                  </span>
                )}
              </div>
              <span className="tabular-nums text-sm font-semibold text-rf-green-deep">
                {entry.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
