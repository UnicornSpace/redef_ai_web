"use client";

import { ResponsiveCalendar } from "@nivo/calendar";
import type { ActivityHeatmapPoint } from "@/actions/activity";

/**
 * 12-month contribution-graph-style heatmap. Server components fetch the
 * data (getMyActivityHeatmap / getPublicActivityHeatmap) and hand it in as
 * a fully-computed array plus the from/to bounds, so this component itself
 * stays a thin @nivo/calendar wrapper without any Supabase concerns.
 *
 * Nivo needs to measure its container to size the grid; ResponsiveCalendar
 * requires the parent to have a fixed height. We enforce that here with
 * `h-40` (mobile) → `h-48` (md+), which comfortably fits the 7-row grid at
 * both breakpoints without cell distortion.
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
  /** Rendered instead of the chart when there's zero data — otherwise
      nivo shows a nearly-empty grid that looks broken. */
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
      <ResponsiveCalendar
        data={points}
        from={from}
        to={to}
        // 3-stop green ramp derived from the app's `rf-green-deep` /
        // `g-green-pale` tokens (nivo needs literal hex, no CSS vars).
        // Kept short so the visual distinction between "light day" and
        // "heavy day" stays legible.
        emptyColor="#EDEEEE"
        colors={["#DDEEDA", "#8FCFA5", "#3EA76D", "#0F5C36"]}
        margin={{ top: 20, right: 8, bottom: 20, left: 8 }}
        yearSpacing={20}
        monthBorderColor="transparent"
        dayBorderWidth={2}
        dayBorderColor="#F7F5F3"
        daySpacing={1}
        theme={{
          text: { fontSize: 10, fill: "#8b8b7d" },
        }}
      />
    </div>
  );
}
