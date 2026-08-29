"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type { UsageAnalytics } from "@/actions/admin";
import {
  Card,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import {
  ChartContainer,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
import { Users } from "lucide-react";

const DAILY_CONFIG: ChartConfig = {
  habits: { label: "Habits", color: "#3e9a35" },
  tasks: { label: "Tasks", color: "#8b5cf6" },
  deepWork: { label: "Deep Work", color: "#ffb332" },
  personalFinance: { label: "Personal Finance", color: "#ff6a55" },
  chats: { label: "AI Talk", color: "#4da5ff" },
};

const TOTALS_CONFIG: ChartConfig = {
  count: { label: "Total", color: "#3e9a35" },
};

function formatShortDate(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function AdminUsageClient({ data }: { data: UsageAnalytics }) {
  const mostUsed = data.totalsByModule[0];
  const leastUsed = data.totalsByModule[data.totalsByModule.length - 1];

  return (
    <div className="flex flex-col gap-5 px-4 pb-16 md:px-8">
      <div className="flex flex-wrap gap-3">
        <CardFrame className="min-w-0 max-w-64 flex-1">
          <CardFrameHeader className="py-1">
            <CardFrameTitle>Most used</CardFrameTitle>
          </CardFrameHeader>
          <Card>
            <CardPanel className="py-4">
              <p className="text-lg font-bold text-ink">
                {mostUsed?.module ?? "—"}
              </p>
              <p className="text-xs text-body-muted">
                {(mostUsed?.count ?? 0).toLocaleString()} total, all time
              </p>
            </CardPanel>
          </Card>
        </CardFrame>
        <CardFrame className="min-w-0 max-w-64 flex-1">
          <CardFrameHeader className="py-1">
            <CardFrameTitle>Underused</CardFrameTitle>
          </CardFrameHeader>
          <Card>
            <CardPanel className="py-4">
              <p className="text-lg font-bold text-ink">
                {leastUsed?.module ?? "—"}
              </p>
              <p className="text-xs text-body-muted">
                {(leastUsed?.count ?? 0).toLocaleString()} total, all time
              </p>
            </CardPanel>
          </Card>
        </CardFrame>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4">
        <div>
          <h2 className="text-sm font-bold text-ink">
            Daily activity by feature
          </h2>
          <p className="text-xs text-body-muted">
            Last 30 days — new habits, tasks, sessions, transactions, and
            chats created each day.
          </p>
        </div>
        <ChartContainer config={DAILY_CONFIG} className="aspect-auto h-72 w-full">
          <BarChart data={data.daily} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tickFormatter={formatShortDate}
            />
            <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
            <ChartTooltip
              content={<ChartTooltipContent labelFormatter={(l) => formatShortDate(l as string)} />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="habits" stackId="a" fill="var(--color-habits)" radius={0} />
            <Bar dataKey="tasks" stackId="a" fill="var(--color-tasks)" radius={0} />
            <Bar dataKey="deepWork" stackId="a" fill="var(--color-deepWork)" radius={0} />
            <Bar
              dataKey="personalFinance"
              stackId="a"
              fill="var(--color-personalFinance)"
              radius={0}
            />
            <Bar
              dataKey="chats"
              stackId="a"
              fill="var(--color-chats)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4">
        <div>
          <h2 className="text-sm font-bold text-ink">Most vs. least used feature</h2>
          <p className="text-xs text-body-muted">
            Total rows ever created per feature, across every user.
          </p>
        </div>
        {data.totalsByModule.length === 0 ? (
          <p className="text-sm text-body-muted">No activity yet.</p>
        ) : (
          <ChartContainer config={TOTALS_CONFIG} className="aspect-auto h-56 w-full">
            <BarChart
              data={data.totalsByModule}
              layout="vertical"
              margin={{ left: 8, right: 24 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                dataKey="module"
                type="category"
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4">
        <div>
          <h2 className="text-sm font-bold text-ink">Top referrers</h2>
          <p className="text-xs text-body-muted">
            Who's actually bringing people in, all time.
          </p>
        </div>
        {data.topReferrers.length === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No referrals yet</EmptyTitle>
              <EmptyDescription>
                Nobody has signed up through a referral link so far.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {data.topReferrers.map((r, i) => (
              <div key={r.userId} className="flex items-center gap-3 py-2.5">
                <span className="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-body-muted">
                  {i + 1}
                </span>
                {r.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external avatar
                  <img
                    alt=""
                    className="size-8 shrink-0 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    src={r.avatarUrl}
                  />
                ) : (
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                      AVATAR_ACCENT_BG_CLASSES[accentIndexFor(r.displayName)],
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
                    {r.username ? `@${r.username}` : r.userId}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                  {r.referralCount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
