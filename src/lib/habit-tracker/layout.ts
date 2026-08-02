/**
 * Pure layout math for the tracker grid — shared by the PDF renderer and the
 * client-side live preview / "too cramped" warning. NO react-pdf import here so
 * the client can use it without pulling the renderer into the browser bundle.
 *
 * All units are PDF points (72pt = 1 inch).
 */

import type { HabitConfig, TrackerConfig, WidgetType } from "./types";

// A4 landscape.
export const PAGE = { width: 841.89, height: 595.28 };
export const MARGIN = 16; // ~0.22in — tight, working-sheet margins.

export const FIXED_COLS = { day: 34, date: 62, score: 46 };

export const ROW_H = 24;
export const HEADER_H = 38;
export const TITLE_H = 32; // first page only

export const CELL_PAD = 3;

/** Nominal (max) box edge per widget type, and the gap between boxes. */
export const NOMINAL_BOX: Record<Exclude<WidgetType, "blank-line">, number> = {
  "multi-check": 14,
  "unit-blocks": 12,
  checkbox: 15,
};
export const BOX_GAP: Record<"multi-check" | "unit-blocks", number> = {
  "multi-check": 3,
  "unit-blocks": 2,
};

/** Below these, a column is too small to hand-write into → warn the user. */
export const MIN_WRITABLE_BOX = 9;
export const MIN_COL_W = 34;

export const FONT = {
  title: 13,
  headerLabel: 9.5,
  subLabel: 6.5,
  day: 10,
  date: 8,
} as const;

export function printableWidth(): number {
  return PAGE.width - MARGIN * 2;
}
export function printableHeight(): number {
  return PAGE.height - MARGIN * 2;
}

/** Rough text width estimate (Inter-ish average advance ≈ 0.55em). */
function estTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55;
}

/** Ideal (uncompressed) width a habit column would like, before fitting. */
function idealHabitWidth(h: HabitConfig): number {
  const labelW = Math.min(
    estTextWidth(h.label || "", FONT.headerLabel) + 10,
    150,
  );
  switch (h.type) {
    case "checkbox":
      return Math.max(54, Math.min(labelW, 90));
    case "blank-line":
      return Math.max(74, Math.min(labelW, 120));
    case "multi-check": {
      const n = h.count ?? 1;
      const boxes =
        n * NOMINAL_BOX["multi-check"] +
        (n - 1) * BOX_GAP["multi-check"] +
        CELL_PAD * 2;
      return Math.max(boxes, Math.min(labelW, 150), 50);
    }
    case "unit-blocks": {
      const n = h.count ?? 1;
      const boxes =
        n * NOMINAL_BOX["unit-blocks"] +
        (n - 1) * BOX_GAP["unit-blocks"] +
        CELL_PAD * 2;
      return Math.max(boxes, Math.min(labelW, 150), 50);
    }
  }
}

export interface HabitColumnPlan {
  habit: HabitConfig;
  /** Final rendered column width (after fitting to the page). */
  width: number;
  /** For multi-check / unit-blocks: the edge length to draw each box at. */
  boxSize: number | null;
  /** True if this column ended up too small to write in comfortably. */
  cramped: boolean;
}

export interface LayoutPlan {
  columns: {
    day: number;
    date: number;
    score: number;
    habits: HabitColumnPlan[];
  };
  /** How much habit columns were shrunk to fit (1 = not shrunk at all). */
  scale: number;
  /** Any column too tight to hand-write into. */
  cramped: boolean;
  crampedLabels: string[];
  pages: { startDay: number; count: number }[];
  totalPages: number;
}

function paginate(total: number): { startDay: number; count: number }[] {
  const firstRows = Math.max(
    1,
    Math.floor((printableHeight() - TITLE_H - HEADER_H) / ROW_H),
  );
  const otherRows = Math.max(
    1,
    Math.floor((printableHeight() - HEADER_H) / ROW_H),
  );
  const pages: { startDay: number; count: number }[] = [];
  let day = 1;
  let first = true;
  while (day <= total) {
    const cap = first ? firstRows : otherRows;
    const count = Math.min(cap, total - day + 1);
    pages.push({ startDay: day, count });
    day += count;
    first = false;
  }
  return pages.length ? pages : [{ startDay: 1, count: 0 }];
}

/**
 * Compute the full grid layout for a config: column widths (auto-shrunk to fit),
 * per-box sizes, pagination, and whether anything ended up too cramped.
 */
export function computeLayout(config: TrackerConfig): LayoutPlan {
  const habits = config.habits;
  const availableForHabits =
    printableWidth() - FIXED_COLS.day - FIXED_COLS.date - FIXED_COLS.score;

  const ideals = habits.map(idealHabitWidth);
  const totalIdeal = ideals.reduce((a, b) => a + b, 0) || 1;

  // Auto-shrink first: only scale DOWN, never stretch beyond ideal.
  const scale = Math.min(1, availableForHabits / totalIdeal);

  const crampedLabels: string[] = [];

  const habitPlans: HabitColumnPlan[] = habits.map((habit, i) => {
    const width = ideals[i] * scale;
    let boxSize: number | null = null;
    let cramped = false;

    if (habit.type === "multi-check" || habit.type === "unit-blocks") {
      const n = habit.count ?? 1;
      const gap = BOX_GAP[habit.type];
      const inner = width - CELL_PAD * 2 - (n - 1) * gap;
      const perSlot = inner / n;
      // Never let boxes overflow the column — clamp to what actually fits.
      boxSize = Math.max(4, Math.min(perSlot, NOMINAL_BOX[habit.type]));
      cramped = boxSize < MIN_WRITABLE_BOX;
    } else {
      cramped = width < MIN_COL_W;
    }

    if (cramped) crampedLabels.push(habit.label || `Column ${i + 1}`);
    return { habit, width, boxSize, cramped };
  });

  const pages = paginate(config.challengeLength);

  return {
    columns: {
      day: FIXED_COLS.day,
      date: FIXED_COLS.date,
      score: FIXED_COLS.score,
      habits: habitPlans,
    },
    scale,
    cramped: crampedLabels.length > 0,
    crampedLabels,
    pages,
    totalPages: pages.length,
  };
}

/** Add days to an ISO yyyy-mm-dd date and format short, e.g. "24 Jul". UTC-safe. */
export function formatRowDate(startISO: string, dayOffset: number): string {
  const [y, m, d] = startISO.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(Date.UTC(y, m - 1, d + dayOffset));
  const day = dt.getUTCDate();
  const month = dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${day} ${month}`;
}
