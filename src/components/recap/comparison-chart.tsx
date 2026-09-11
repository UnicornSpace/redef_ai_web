"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricSeries } from "@/lib/types/reports";
import { RECAP, RECAP_ACCENTS } from "./recap-theme";

const DAY_LABELS = ["", "", "", "", "", "", ""];

/**
 * This week vs the week before, one point per day. Mirrors the Instagram
 * recap's chart: the current window in the accent colour and heavy, the
 * previous window thin and muted so it reads as a baseline rather than a
 * competing series.
 *
 * Renders nothing when there's no series — snapshots written before
 * series existed legitimately have none (see MetricSeries' doc comment),
 * and a chart of two flat zero lines is worse than no chart.
 */
export function ComparisonChart({
  series,
  accent = "green",
  formatValue,
}: {
  series: MetricSeries | undefined;
  accent?: keyof typeof RECAP_ACCENTS;
  formatValue?: (n: number) => string;
}) {
  if (!series) return null;
  const hasAny =
    series.current.some((v) => v !== 0) || series.previous.some((v) => v !== 0);
  if (!hasAny) return null;

  const color = RECAP_ACCENTS[accent];
  const data = series.current.map((v, i) => ({
    day: DAY_LABELS[i],
    current: v,
    previous: series.previous[i] ?? 0,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid
              horizontal
              vertical={false}
              stroke={RECAP.line}
              strokeDasharray="0"
            />
            <XAxis
              dataKey="day"
              tick={false}
              axisLine={false}
              tickLine={false}
              height={4}
            />
            <YAxis
              width={44}
              axisLine={false}
              tickLine={false}
              tick={{ fill: RECAP.textMuted, fontSize: 11 }}
              tickFormatter={(v) =>
                formatValue
                  ? formatValue(Number(v))
                  : String(Math.round(Number(v)))
              }
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke={RECAP.textMuted}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke={color}
              strokeWidth={4}
              dot={false}
              animationDuration={700}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: RECAP.textMuted }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: color }} />
          This week
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ background: RECAP.textMuted }}
          />
          Previous week
        </span>
      </div>
    </div>
  );
}
