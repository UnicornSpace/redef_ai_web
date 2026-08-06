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
          <EmptyTitle>No leaderboard yet</EmptyTitle>
          <EmptyDescription>
            Join or start a challenge to see how you stack up against everyone
            else in it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 pb-16 md:px-8 pt-6">
      <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-body-muted">
        Across all your challenges
      </h2>
      <div className="rounded-2xl border border-line bg-paper">
        {entries.map((entry, i) => (
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
                i === 0 ? "bg-rf-amber text-white" : "bg-line text-body-muted",
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
            <span className="flex-1 truncate text-sm font-medium text-ink">
              {entry.displayName}
              {entry.isCurrentUser ? " (you)" : ""}
            </span>
            <span className="text-xs text-body-muted">
              {entry.challengeCount}{" "}
              {entry.challengeCount === 1 ? "challenge" : "challenges"}
            </span>
            <span className="tabular-nums text-sm font-semibold text-rf-green-deep">
              {entry.totalDays} days
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
