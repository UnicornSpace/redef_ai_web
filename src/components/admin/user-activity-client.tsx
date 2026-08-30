"use client";

import { ChevronRightIcon, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminRange, UserActivityDetail } from "@/actions/admin";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AVATAR_ACCENT_BG_CLASSES,
  accentIndexFor,
  initialsOf,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

// Same labels/options as admin-dashboard-client.tsx's list-page selector —
// duplicated rather than shared since it's a 4-entry lookup, matching how
// small per-file constants like this already work elsewhere in the app.
const RANGE_LABELS: Record<AdminRange, string> = {
  "1d": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-paper p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
        {label}
      </span>
      <span className="text-xl font-bold text-ink">{value}</span>
    </div>
  );
}

export function UserActivityClient({
  detail,
  range,
}: {
  detail: UserActivityDetail;
  range: AdminRange;
}) {
  const router = useRouter();
  const heroAccentClass =
    AVATAR_ACCENT_BG_CLASSES[accentIndexFor(detail.displayName)];
  const totalInteractions =
    detail.breakdown.habits +
    detail.breakdown.tasks +
    detail.breakdown.transactions +
    detail.breakdown.chats +
    detail.breakdown.deepworkSessions +
    detail.breakdown.goals;
  const rangeLabel = RANGE_LABELS[range].toLowerCase();

  function updateRange(value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("range", value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-16 md:px-8">
      <div className="flex justify-end">
        <Select value={range} onValueChange={(v) => v && updateRange(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGE_LABELS) as AdminRange[]).map((r) => (
              <SelectItem key={r} value={r}>
                {RANGE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full max-w-2xl mx-auto flex-col items-center gap-6  p-8 text-center">
        <Avatar className="size-24 text-3xl">
          <AvatarImage
            alt={detail.displayName}
            referrerPolicy="no-referrer"
            src={detail.avatarUrl ?? undefined}
          />
          <AvatarFallback className={cn("font-bold text-white", heroAccentClass)}>
            {initialsOf(detail.displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-extrabold text-ink">
            {detail.displayName}
          </h1>
          <Link target="_blank" href={`https://redefai.app/u/${detail.username}`} className="text-sm text-accent-foreground">@{detail.username}</Link>
          {/* {memberSinceLabel ? (
            <p className="text-xs text-body-muted">
              Member since {memberSinceLabel}
            </p>
          ) : null} */}
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-body-muted">
          <span>Joined {formatDate(detail.joinedAt)}</span>
          <span>·</span>
          <span>Last active {formatDate(detail.lastActiveAt)}</span>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-body-muted">
          Interactions ({totalInteractions.toLocaleString()} total, {rangeLabel})
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <Stat label="Habits" value={detail.breakdown.habits} />
          <Stat label="Tasks" value={detail.breakdown.tasks} />
          <Stat label="Transactions" value={detail.breakdown.transactions} />
          <Stat label="Chats" value={detail.breakdown.chats} />
          <Stat
            label="Deep work hrs"
            value={detail.breakdown.deepworkSessions}
          />
          <Stat label="Goals" value={detail.breakdown.goals} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-body-muted">
          AI Talk token usage ({rangeLabel})
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Input tokens"
            value={detail.tokens.input.toLocaleString()}
          />
          <Stat
            label="Output tokens"
            value={detail.tokens.output.toLocaleString()}
          />
          <Stat label="Total" value={detail.tokens.total.toLocaleString()} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-body-muted">
          Referred ({detail.referrals.length}, {rangeLabel})
        </h2>
        {detail.referrals.length === 0 ? (
          <Empty className="rounded-2xl border border-line bg-paper py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No referrals</EmptyTitle>
              <EmptyDescription>
                Nobody has signed up through this user's referral link yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-paper">
            {detail.referrals.map((r) => {
              const accentClass =
                AVATAR_ACCENT_BG_CLASSES[accentIndexFor(r.displayName)];
              const content = (
                <>
                  {r.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external
                    // Google-hosted photo; next/image would need the host
                    // allowlisted in next.config.ts for one small avatar.
                    <img
                      alt=""
                      className="size-9 shrink-0 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                      src={r.avatarUrl}
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                        accentClass,
                      )}
                    >
                      {initialsOf(r.displayName)}
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-ink">
                      {r.displayName}
                    </span>
                    <span className="truncate text-xs text-body-muted">
                      {r.username
                        ? `@${r.username}`
                        : "Hasn't set up a profile yet"}
                      {r.joinedAt ? ` · joined ${formatDate(r.joinedAt)}` : ""}
                    </span>
                  </div>
                  {r.username ? (
                    <ChevronRightIcon
                      className="shrink-0 text-body-muted"
                      size={16}
                    />
                  ) : null}
                </>
              );
              return r.username ? (
                <Link
                  key={r.userId}
                  href={`/admin/users/${r.userId}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/60"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={r.userId}
                  className="flex items-center gap-3 px-4 py-3 opacity-80"
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
