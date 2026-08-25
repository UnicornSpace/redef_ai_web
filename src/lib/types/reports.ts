/**
 * Weekly report types — kept out of src/actions/reports.ts because that
 * file has "use server" at the top. Next's server-action transform only
 * allows async function exports from such a file; a plain `export
 * interface` (even though it's erased by TypeScript, before that erasure
 * the transform still sees it as a non-function export) silently poisons
 * every action in the module at runtime. Bit us twice already this
 * project (src/lib/age-ranges.ts, src/lib/types/profile.ts) — same fix.
 */

import type { ModuleKey } from "@/lib/modules";

/** A single stat: this window's value, the window before it, and a
    trailing 4-week average to gauge it against. */
export interface ReportMetric {
  current: number;
  previous: number;
  monthAvgPerWeek: number;
}

export interface WeeklyReportData {
  /** Human-readable, e.g. "Aug 18 – Aug 24". */
  windowLabel: string;
  /** ISO date (yyyy-mm-dd), inclusive bounds of this report's window. */
  weekStart: string;
  weekEnd: string;
  enabledModules: ModuleKey[];
  habits: (ReportMetric & { activeHabits: number; bestStreak: number }) | null;
  tasks: ReportMetric | null;
  deepWork: (ReportMetric & { unit: "hours" }) | null;
  personalFinance:
    | { spent: ReportMetric; income: ReportMetric; net: ReportMetric }
    | null;
}

export interface WeeklyReportSnapshot {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  data: WeeklyReportData;
  emailedAt: string | null;
  seenAt: string | null;
  createdAt: string;
}
