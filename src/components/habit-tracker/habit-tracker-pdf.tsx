// biome-ignore-all lint/suspicious/noArrayIndexKey: fixed, non-reordering grid cells — index is a stable key here
/**
 * HabitTrackerPDF — the print-ready, BLANK habit-challenge sheet.
 *
 * Server-only (imported by the API route). Built entirely from react-pdf
 * primitives; the "table" is nested <View>s with flexDirection:row, because
 * react-pdf has no native grid. Column count and widths are fully driven by the
 * user's habit config via computeLayout() — nothing here is habit-specific.
 */

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import {
  CELL_PAD,
  computeLayout,
  FONT,
  formatRowDate,
  type HabitColumnPlan,
  HEADER_H,
  MARGIN,
  ROW_H,
  TITLE_H,
} from "@/lib/habit-tracker/layout";
import type { HabitConfig, TrackerConfig } from "@/lib/habit-tracker/types";
import { ensurePdfFonts } from "@/lib/pdf/fonts";

// ---- Styles ----------------------------------------------------------------
const INK = "#1f2937";
const LINE = "#3f3f46";
const HEADER_BG = "#eceae4";
const BOX = "#52525b";

const styles = StyleSheet.create({
  page: {
    paddingTop: MARGIN,
    paddingBottom: MARGIN + 10,
    paddingHorizontal: MARGIN,
    fontFamily: "Inter",
    color: INK,
    backgroundColor: "#ffffff",
  },
  titleRow: {
    height: TITLE_H,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 6,
  },
  title: { fontSize: FONT.title, fontWeight: "bold", color: INK },
  titleMeta: { fontSize: 8, color: "#6b7280", fontWeight: "medium" },
  // The grid draws single hairlines: the table owns the top+left edge, each
  // cell owns its right+bottom edge → no doubled borders.
  table: {
    borderTop: `0.75pt solid ${LINE}`,
    borderLeft: `0.75pt solid ${LINE}`,
  },
  headerRow: {
    flexDirection: "row",
    height: HEADER_H,
    backgroundColor: HEADER_BG,
  },
  row: { flexDirection: "row", height: ROW_H },
  cell: {
    borderRight: `0.75pt solid ${LINE}`,
    borderBottom: `0.75pt solid ${LINE}`,
    paddingHorizontal: CELL_PAD,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCell: {
    borderRight: `0.75pt solid ${LINE}`,
    borderBottom: `0.75pt solid ${LINE}`,
    paddingHorizontal: CELL_PAD,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: FONT.headerLabel,
    fontWeight: "bold",
    color: INK,
    textAlign: "center",
    maxLines: 2,
    textOverflow: "ellipsis",
    lineHeight: 1.05,
  },
  subLabelRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  subLabel: { fontSize: FONT.subLabel, color: "#52525b", textAlign: "center" },
  dayText: { fontSize: FONT.day, fontWeight: "semibold", color: INK },
  dateText: { fontSize: FONT.date, color: "#374151" },
  boxes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pageNumber: {
    position: "absolute",
    bottom: 6,
    right: MARGIN,
    fontSize: 7,
    color: "#9ca3af",
  },
  brand: {
    position: "absolute",
    bottom: 6,
    left: MARGIN,
    fontSize: 7,
    color: "#9ca3af",
    fontWeight: "medium",
  },
});

// ---- Cell renderers --------------------------------------------------------

function Box({ size, rounded = 2 }: { size: number; rounded?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderWidth: 0.75,
        borderColor: BOX,
        borderRadius: rounded,
      }}
    />
  );
}

function HabitHeaderCell({ plan }: { plan: HabitColumnPlan }) {
  const { habit, width, boxSize } = plan;
  const showSubLabels =
    habit.type === "multi-check" &&
    habit.subLabels &&
    habit.subLabels.length === (habit.count ?? 0);

  return (
    <View style={[styles.headerCell, { width }]}>
      <Text style={styles.headerText}>{habit.label}</Text>
      {showSubLabels && habit.subLabels ? (
        <View style={styles.subLabelRow}>
          {habit.subLabels.map((s, i) => (
            <Text
              key={`${s}-${i}`}
              style={[
                styles.subLabel,
                {
                  width: (boxSize ?? 10) + (BOX_GAP_FOR(habit) ?? 3),
                },
              ]}
            >
              {s}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function BOX_GAP_FOR(h: HabitConfig): number {
  return h.type === "multi-check" ? 3 : 2;
}

function HabitBodyCell({ plan }: { plan: HabitColumnPlan }) {
  const { habit, width, boxSize } = plan;

  let content: ReactNode = null;
  if (habit.type === "checkbox") {
    content = <Box size={Math.min(15, width - CELL_PAD * 2)} />;
  } else if (habit.type === "blank-line") {
    content = null; // the cell's own border is the writing rule
  } else {
    const n = habit.count ?? 1;
    const gap = BOX_GAP_FOR(habit);
    const size = boxSize ?? 10;
    content = (
      <View style={[styles.boxes, { gap }]}>
        {Array.from({ length: n }).map((_, i) => (
          <Box
            key={i}
            size={size}
            rounded={habit.type === "unit-blocks" ? 1.5 : 2}
          />
        ))}
      </View>
    );
  }

  return <View style={[styles.cell, { width }]}>{content}</View>;
}

// ---- Header + rows ---------------------------------------------------------

function HeaderRow({ layout }: { layout: ReturnType<typeof computeLayout> }) {
  const { columns } = layout;
  return (
    <View style={styles.headerRow}>
      <View style={[styles.headerCell, { width: columns.day }]}>
        <Text style={styles.headerText}>Day</Text>
      </View>
      <View style={[styles.headerCell, { width: columns.date }]}>
        <Text style={styles.headerText}>Date</Text>
      </View>
      {columns.habits.map((plan, i) => (
        <HabitHeaderCell key={i} plan={plan} />
      ))}
      <View style={[styles.headerCell, { width: columns.score }]}>
        <Text style={styles.headerText}>Score</Text>
      </View>
    </View>
  );
}

function DayRow({
  dayNumber,
  layout,
  startDate,
}: {
  dayNumber: number;
  layout: ReturnType<typeof computeLayout>;
  startDate?: string;
}) {
  const { columns } = layout;
  const dateText = startDate ? formatRowDate(startDate, dayNumber - 1) : "";
  return (
    <View style={styles.row} wrap={false}>
      <View style={[styles.cell, { width: columns.day }]}>
        <Text style={styles.dayText}>{dayNumber}</Text>
      </View>
      <View style={[styles.cell, { width: columns.date }]}>
        {dateText ? <Text style={styles.dateText}>{dateText}</Text> : null}
      </View>
      {columns.habits.map((plan, i) => (
        <HabitBodyCell key={i} plan={plan} />
      ))}
      <View style={[styles.cell, { width: columns.score }]} />
    </View>
  );
}

// ---- Document --------------------------------------------------------------

export function HabitTrackerDocument({ config }: { config: TrackerConfig }) {
  ensurePdfFonts();
  const layout = computeLayout(config);

  return (
    <Document
      title={`${config.challengeLength}-Day Habit Challenge`}
      author="Redef AI"
      creator="Redef AI — Habit Challenge Sheet Generator"
    >
      {layout.pages.map((pg, pageIndex) => {
        const isFirst = pageIndex === 0;
        return (
          <Page
            key={pageIndex}
            size="A4"
            orientation="landscape"
            style={styles.page}
          >
            {isFirst ? (
              <View style={styles.titleRow}>
                <Text style={styles.title}>
                  {config.challengeLength}-Day Habit Challenge
                </Text>
                <Text style={styles.titleMeta}>
                  Name: ____________________ | Month: ____________ | redef.ai
                </Text>
              </View>
            ) : null}

            <View style={styles.table}>
              <HeaderRow layout={layout} />
              {Array.from({ length: pg.count }).map((_, r) => (
                <DayRow
                  key={r}
                  dayNumber={pg.startDay + r}
                  layout={layout}
                  startDate={config.startDate}
                />
              ))}
            </View>

            <Text style={styles.brand} fixed>
              Made with Redef AI
            </Text>
            <Text
              style={styles.pageNumber}
              fixed
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} / ${totalPages}`
              }
            />
          </Page>
        );
      })}
    </Document>
  );
}

export default HabitTrackerDocument;
