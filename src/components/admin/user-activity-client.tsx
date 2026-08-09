import { ChevronRightIcon, Users } from "lucide-react";
import Link from "next/link";
import type { UserActivityDetail } from "@/actions/admin";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  AVATAR_ACCENT_BG_CLASSES,
  accentIndexFor,
  initialsOf,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

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

export function UserActivityClient({ detail }: { detail: UserActivityDetail }) {
  const totalInteractions =
    detail.breakdown.habits +
    detail.breakdown.tasks +
    detail.breakdown.transactions +
    detail.breakdown.chats +
    detail.breakdown.deepworkSessions +
    detail.breakdown.goals;

  return (
    <div className="flex flex-col gap-6 px-4 pb-16 md:px-8">
      <div className="flex flex-wrap gap-3 text-sm text-body-muted">
        <span>Joined {formatDate(detail.joinedAt)}</span>
        <span>·</span>
        <span>Last active {formatDate(detail.lastActiveAt)}</span>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-body-muted">
          Interactions ({totalInteractions.toLocaleString()} total, lifetime)
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Habits" value={detail.breakdown.habits} />
          <Stat label="Tasks" value={detail.breakdown.tasks} />
          <Stat label="Transactions" value={detail.breakdown.transactions} />
          <Stat label="Chats" value={detail.breakdown.chats} />
          <Stat label="Deep work sessions" value={detail.breakdown.deepworkSessions} />
          <Stat label="Goals" value={detail.breakdown.goals} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-body-muted">
          AI Talk token usage (lifetime)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Input tokens" value={detail.tokens.input.toLocaleString()} />
          <Stat label="Output tokens" value={detail.tokens.output.toLocaleString()} />
          <Stat label="Total" value={detail.tokens.total.toLocaleString()} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-body-muted">
          Referred ({detail.referrals.length})
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
              const accentClass = AVATAR_ACCENT_BG_CLASSES[accentIndexFor(r.displayName)];
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
                      {r.username ? `@${r.username}` : "Hasn't set up a profile yet"}
                      {r.joinedAt ? ` · joined ${formatDate(r.joinedAt)}` : ""}
                    </span>
                  </div>
                  {r.username ? (
                    <ChevronRightIcon className="shrink-0 text-body-muted" size={16} />
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
                <div key={r.userId} className="flex items-center gap-3 px-4 py-3 opacity-80">
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
