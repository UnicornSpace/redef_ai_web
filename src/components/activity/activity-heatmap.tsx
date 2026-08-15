"use client";

import { ResponsiveTimeRange } from "@nivo/calendar";
import type { ActivityHeatmapPoint } from "@/actions/activity";

/**
 * Contribution-graph-style heatmap over a bounded window. Server
 * components fetch the data (getMyActivityHeatmap /
 * getPublicActivityHeatmap) and hand it in as a fully-computed array
 * plus the from/to bounds, so this component itself stays a thin
 * @nivo/calendar wrapper without any Supabase concerns.
 *
 * We use `TimeRange` (not `Calendar`) because it only draws cells
 * WITHIN [from..to] — the plain Calendar always renders a full
 * calendar-year block, so Sep/Oct/Nov/Dec would still show as an empty
 * ghost grid when it's only August. TimeRange's horizontal weekday-row
 * band naturally stops at the last data day, which matches the "hide
 * months that haven't happened yet" spec and looks like GitHub's
 * familiar contribution graph as a bonus.
 */
export function ActivityHeatmap({
  points,
  from,
  to,
  emptyMessage = "No activity in this window.",
}: {
  points: ActivityHeatmapPoint[];
  from: string;
  to: string;
  emptyMessage?: string;
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper/40 px-4 py-8 text-center text-sm text-body-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="h-40 w-full md:h-64">
      <ResponsiveTimeRange
        data={points}
        from={from}
        to={to}
        // 3-stop green ramp derived from the app's `rf-green-deep` /
        // `g-green-pale` tokens (nivo needs literal hex, no CSS vars).
        emptyColor="#EDEEEE"
        colors={["#DDEEDA", "#8FCFA5", "#3EA76D", "#0F5C36"]}
        margin={{ top: 40, right: 8, bottom: 8, left: 32 }}
        dayBorderWidth={2}
        dayBorderColor="#F7F5F3"
        daySpacing={1}
        weekdayLegendOffset={50}
        theme={{
          text: { fontSize: 10, fill: "#8b8b7d" },
        }}
      />
    </div>
  );
}
