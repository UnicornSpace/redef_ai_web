"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import type { AdminOverview, AdminRange, AdminSort, AdminUserRow } from "@/actions/admin";
import {
  Card,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AVATAR_ACCENT_BG_CLASSES,
  accentIndexFor,
  initialsOf,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

const RANGE_LABELS: Record<AdminRange, string> = {
  "1d": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

const SORT_LABELS: Record<AdminSort, string> = {
  interactions: "Most active",
  tokens: "Most tokens used",
  referrals: "Most referrals",
  joined: "Newest signups",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCompact(n: number): string {
  return n.toLocaleString();
}

export function AdminDashboardClient({
  overview,
  users,
  range,
  sort,
}: {
  overview: AdminOverview;
  users: AdminUserRow[];
  range: AdminRange;
  sort: AdminSort;
}) {
  const router = useRouter();

  function updateParam(key: "range" | "sort", value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-16 md:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={range} onValueChange={(v) => v && updateParam("range", v)}>
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

        <Select value={sort} onValueChange={(v) => v && updateParam("sort", v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as AdminSort[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-3">
        <CardFrame className="min-w-0 max-w-52 flex-1">
          <CardFrameHeader className="py-1">
            <CardFrameTitle>Total users</CardFrameTitle>
          </CardFrameHeader>
          <Card>
            <CardPanel className="mx-auto py-4">
              <p className="text-2xl font-bold">
                {formatCompact(overview.totalUsers)}
              </p>
            </CardPanel>
          </Card>
        </CardFrame>
        <CardFrame className="min-w-0 max-w-52 flex-1">
          <CardFrameHeader className="py-1">
            <CardFrameTitle>New signups ({RANGE_LABELS[range].toLowerCase()})</CardFrameTitle>
          </CardFrameHeader>
          <Card>
            <CardPanel className="mx-auto py-4">
              <p className="text-2xl font-bold">
                {formatCompact(overview.newSignups)}
              </p>
            </CardPanel>
          </Card>
        </CardFrame>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="text-right">
                Interactions ({RANGE_LABELS[range].toLowerCase()})
              </TableHead>
              <TableHead className="text-right">Tokens (all time)</TableHead>
              <TableHead className="text-right">Referrals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-body-muted">
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow
                  key={u.userId}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/users/${u.userId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- external
                        // Google-hosted photo; next/image would need the host
                        // allowlisted in next.config.ts for one small avatar.
                        <img
                          alt=""
                          className="size-8 shrink-0 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                          src={u.avatarUrl}
                        />
                      ) : (
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                            AVATAR_ACCENT_BG_CLASSES[accentIndexFor(u.displayName)],
                          )}
                        >
                          {initialsOf(u.displayName)}
                        </span>
                      )}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold text-ink">
                          {u.displayName}
                        </span>
                        <span className="truncate text-xs text-body-muted">
                          {u.username ? `@${u.username}` : u.email ?? u.userId}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-body-muted">
                    {formatDate(u.joinedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-body-muted">
                    {formatDate(u.lastActiveAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-semibold text-ink">
                    {formatCompact(u.interactions)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-body-muted">
                    {formatCompact(u.tokensUsed)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-body-muted">
                    {formatCompact(u.referrals)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
