"use client";

import { Copy, Trash2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteChallenge,
  joinChallenge,
  toggleChallengeDate,
} from "@/actions/challenges";
import { Button } from "@/components/ui/button";
import type { Challenge, ChallengeParticipant } from "@/lib/types/productivity";
import { cn } from "@/lib/utils";

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ChallengeDetailClient({
  challenge,
  initialParticipants,
  currentUserId,
}: {
  challenge: Challenge;
  initialParticipants: ChallengeParticipant[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState(initialParticipants);
  const [, startTransition] = useTransition();
  const todayKey = dateKey(new Date());
  const isOwner = challenge.owner_user_id === currentUserId;

  const ranked = useMemo(
    () =>
      [...participants].sort(
        (a, b) => b.completed_dates.length - a.completed_dates.length,
      ),
    [participants],
  );

  const me = participants.find((p) => p.user_id === currentUserId);
  const isDoneToday = me?.completed_dates.includes(todayKey) ?? false;

  function handleJoin() {
    startTransition(async () => {
      const res = await joinChallenge(challenge.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleToggleToday() {
    if (!me) return;
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === me.id
          ? {
              ...p,
              completed_dates: isDoneToday
                ? p.completed_dates.filter((d) => d !== todayKey)
                : [...p.completed_dates, todayKey],
            }
          : p,
      ),
    );
    startTransition(async () => {
      const res = await toggleChallengeDate(challenge.id, todayKey);
      if (res.error) toast.error(res.error);
    });
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/app/challenges/${challenge.id}/join`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteChallenge(challenge.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.push("/app/challenges");
    });
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-16 md:px-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4">
        {challenge.description ? (
          <p className="text-sm text-body-muted">
            {challenge.description}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {me ? (
            <Button
              variant={isDoneToday ? "secondary" : "default"}
              size="sm"
              onClick={handleToggleToday}
            >
              {isDoneToday ? "Marked today ✓" : "Mark today"}
            </Button>
          ) : (
            <Button size="sm" onClick={handleJoin}>
              Join this challenge
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy />
            Copy invite link
          </Button>
          {isOwner ? (
            <Button
              variant="destructive-outline"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 />
              Delete challenge
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-body-muted">
          Leaderboard
        </h2>
        <div className="rounded-2xl border border-line bg-paper">
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                i !== ranked.length - 1 && "border-b border-line",
                p.user_id === currentUserId && "bg-g-green-pale",
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
              <span className="flex-1 text-sm font-medium text-ink">
                {p.display_name ?? "Someone"}
                {p.user_id === currentUserId ? " (you)" : ""}
              </span>
              <span className="tabular-nums text-sm font-semibold text-rf-green-deep">
                {p.completed_dates.length} days
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
