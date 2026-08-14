"use client";

import { ResponsiveTimeRange } from "@nivo/calendar";

/**
 * Daily focus minutes as a 90-day contribution band. Server passes in the
 * zero-filled series from getDeepworkDailyMinutes, so this component stays
 * a thin nivo wrapper. The visual mirrors ActivityHeatmap's palette so
 * both charts on the same page read as one system.
 */
export function DeepworkTimeRange({
  points,
}: {
  /** Zero-filled — every day in the window is present, missing days as 0.
      Nivo `TimeRange` derives `from`/`to` from the data's min/max keys, so
      the zero-fill is what makes the chart a full band and not a ragged
      pair of columns clustered around actual activity. */
  points: { day: string; value: number }[];
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper/40 px-4 py-8 text-center text-sm text-body-muted">
        Log a focus session to start seeing your last 90 days.
      </div>
    );
  }

  const totalMinutes = points.reduce((sum, p) => sum + p.value, 0);
  const activeDays = points.filter((p) => p.value > 0).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between px-2">
        <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
          Focus, last 90 days
        </span>
        <span className="tabular-nums text-xs text-body-muted">
          {(totalMinutes / 60).toFixed(1)}h total · {activeDays} active days
        </span>
      </div>
      <div className="h-36 w-60">
        <ResponsiveTimeRange
          data={points}
          from={points[0].day}
          to={points[points.length - 1].day}
          emptyColor="#EDEEEE"
          colors={["#DDEEDA", "#8FCFA5", "#3EA76D", "#0F5C36"]}
          margin={{ top: 32, right: 8, bottom: 8, left: 32 }}
          dayBorderWidth={2}
          dayBorderColor="#F7F5F3"
          daySpacing={1}
          weekdayLegendOffset={40}
          theme={{ text: { fontSize: 10, fill: "#8b8b7d" } }}
        />
      </div>
    </div>
  );
}
