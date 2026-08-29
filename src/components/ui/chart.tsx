"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

// Minimal shadcn-style chart wrapper around Recharts — ChartContainer feeds
// each series' color to its shapes via a CSS var (--color-<key>) so chart
// definitions reference `var(--color-x)` instead of hardcoding hex, and
// ChartTooltipContent/ChartLegendContent replace Recharts' default popup
// styling with this app's own card/border/text tokens.

export type ChartConfig = Record<
  string,
  {
    label: React.ReactNode;
    color?: string;
  }
>;

type ChartContextValue = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart(): ChartContextValue {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("Chart components must be used within a ChartContainer");
  return ctx;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const style = Object.fromEntries(
    Object.entries(config)
      .filter(([, cfg]) => cfg.color)
      .map(([key, cfg]) => [`--color-${key}`, cfg.color]),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        className={cn(
          "flex aspect-video w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-body-muted [&_.recharts-cartesian-grid_line]:stroke-line [&_.recharts-curve.recharts-tooltip-cursor]:stroke-line [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-radial-bar-background-sector]:fill-line [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-line/40 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-line [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        style={style}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  className,
}: {
  active?: boolean;
  payload?: readonly {
    name?: string;
    value?: number | string;
    dataKey?: string;
    color?: string;
  }[];
  label?: React.ReactNode;
  labelFormatter?: (label: React.ReactNode) => React.ReactNode;
  formatter?: (value: number | string, name: string) => React.ReactNode;
  className?: string;
}) {
  const { config } = useChart();
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        "grid min-w-32 gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs shadow-lg",
        className,
      )}
    >
      {label != null ? (
        <div className="font-medium text-ink">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      ) : null}
      <div className="grid gap-1">
        {payload.map((item) => {
          const key = item.dataKey ?? item.name ?? "";
          const cfg = config[key as string];
          return (
            <div
              key={key}
              className="flex w-full items-center gap-1.5 text-body-muted"
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="flex-1">{cfg?.label ?? item.name}</span>
              <span className="font-mono font-medium tabular-nums text-ink">
                {formatter && item.value != null
                  ? formatter(item.value, key as string)
                  : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ChartLegend = RechartsPrimitive.Legend;

export function ChartLegendContent({
  payload,
}: {
  payload?: readonly { value?: string; color?: string; dataKey?: string }[];
}) {
  const { config } = useChart();
  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
      {payload.map((item) => {
        const key = (item.dataKey ?? item.value ?? "") as string;
        const cfg = config[key];
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-body-muted">
              {cfg?.label ?? item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
