// biome-ignore-all lint/suspicious/noArrayIndexKey: fixed, non-reordering grid cells — index is a stable key here
/**
 * WeeklyGoalTrackerPDF — the print-ready weekly goal planner sheet.
 *
 * Server-only (imported by the API route). One A4-portrait page, three
 * stacked bands: a small header, a Goals → Tasks → Subtasks checklist that
 * takes up most of the page, and a fixed Mon–Sun grid pinned to the bottom
 * for anything the user wants to hand-track (hours, mood, whatever they
 * write into the row labels).
 *
 * React-pdf has no percentage-height layout, so the "6% / 44% / 50%" split
 * from the spec is approximated with a fixed header height + a flexGrow
 * goals section that eats whatever space the grid doesn't need — visually
 * equivalent for the realistic range of goal-list lengths this tool is
 * built for, and it degrades safely (auto-paginates) if someone fills in
 * the maximum number of goals/tasks/subtasks.
 */

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { GRID_DAYS } from "@/lib/weekly-goal-tracker/types";
import type { ValidatedWeeklyPlannerConfig } from "@/lib/weekly-goal-tracker/schema";
import { ensurePdfFonts } from "@/lib/pdf/fonts";

type PdfGoal = ValidatedWeeklyPlannerConfig["goals"][number];
type PdfConfig = ValidatedWeeklyPlannerConfig;

// A4 portrait, in points (72pt = 1in).
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 30;

const INK = "#1f2937";
const LINE = "#3f3f46";
const MUTED = "#6b7280";
const HEADER_BG = "#eceae4";
const GRID_LABEL_W = 110;
const GRID_ROW_H = 32;
const GRID_HEADER_H = 26;

const styles = StyleSheet.create({
  page: {
    paddingTop: MARGIN,
    paddingBottom: MARGIN + 12,
    paddingHorizontal: MARGIN,
    fontFamily: "Inter",
    color: INK,
    backgroundColor: "#ffffff",
    flexDirection: "column",
  },

  // ---- Header ---------------------------------------------------------
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 10,
    marginBottom: 12,
    borderBottom: `1.25pt solid ${LINE}`,
  },
  focusBlock: { flex: 1, paddingRight: 16 },
  focusLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  focusValue: { fontSize: 14, fontWeight: "semibold", color: INK },
  focusBlank: {
    fontSize: 14,
    color: "transparent",
    borderBottom: `0.75pt solid ${MUTED}`,
    minWidth: 260,
  },
  yearBlock: { alignItems: "flex-end" },
  yearLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  yearValue: { fontSize: 20, fontWeight: "bold", color: INK },
  yearBlank: {
    fontSize: 20,
    color: "transparent",
    borderBottom: `0.75pt solid ${MUTED}`,
    minWidth: 70,
    textAlign: "right",
  },

  // ---- Goals ------------------------------------------------------------
  goalsSection: { flexGrow: 1, flexDirection: "column" },
  goalsHeading: {
    fontSize: 11,
    fontWeight: "bold",
    color: INK,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  goalRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 5,
    marginLeft: 18,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    marginLeft: 36,
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 0.85,
    borderColor: "#52525b",
    borderRadius: 2,
    marginRight: 7,
    marginTop: 2,
  },
  checkboxSmall: {
    width: 7,
    height: 7,
    borderWidth: 0.75,
    borderColor: "#52525b",
    borderRadius: 1.5,
    marginRight: 6,
    marginTop: 2.5,
  },
  goalText: { fontSize: 11, fontWeight: "semibold", color: INK, flex: 1 },
  taskText: { fontSize: 10, color: INK, flex: 1 },
  subtaskText: { fontSize: 9, color: "#374151", flex: 1 },
  blankLine: {
    flex: 1,
    borderBottom: `0.6pt solid ${MUTED}`,
    marginTop: 2,
    height: 1,
  },

  // ---- Grid ---------------------------------------------------------------
  gridSection: { marginTop: 14 },
  gridTable: {
    borderTop: `0.75pt solid ${LINE}`,
    borderLeft: `0.75pt solid ${LINE}`,
  },
  gridHeaderRow: {
    flexDirection: "row",
    height: GRID_HEADER_H,
    backgroundColor: HEADER_BG,
  },
  gridRow: { flexDirection: "row", height: GRID_ROW_H },
  gridHeaderCell: {
    borderRight: `0.75pt solid ${LINE}`,
    borderBottom: `0.75pt solid ${LINE}`,
    justifyContent: "center",
    alignItems: "center",
  },
  gridHeaderText: { fontSize: 8.5, fontWeight: "bold", color: INK },
  gridLabelCell: {
    width: GRID_LABEL_W,
    borderRight: `0.75pt solid ${LINE}`,
    borderBottom: `0.75pt solid ${LINE}`,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  gridLabelText: { fontSize: 9, fontWeight: "semibold", color: INK },
  gridCell: {
    flex: 1,
    borderRight: `0.75pt solid ${LINE}`,
    borderBottom: `0.75pt solid ${LINE}`,
  },

  footer: {
    position: "absolute",
    bottom: 10,
    left: MARGIN,
    right: MARGIN,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#9ca3af", fontWeight: "medium" },
});

// ---- Header ---------------------------------------------------------------

function Header({ config }: { config: PdfConfig }) {
  const focus = config.blank ? "" : (config.focus ?? "").trim();
  const year = config.blank ? "" : (config.year ?? "").trim();
  return (
    <View style={styles.header}>
      <View style={styles.focusBlock}>
        <Text style={styles.focusLabel}>This week's focus</Text>
        {focus ? (
          <Text style={styles.focusValue}>{focus}</Text>
        ) : (
          <Text style={styles.focusBlank}>_</Text>
        )}
      </View>
      <View style={styles.yearBlock}>
        <Text style={styles.yearLabel}>Year</Text>
        {year ? (
          <Text style={styles.yearValue}>{year}</Text>
        ) : (
          <Text style={styles.yearBlank}>_</Text>
        )}
      </View>
    </View>
  );
}

// ---- Goals ------------------------------------------------------------

function GoalsFilled({ goals }: { goals: PdfGoal[] }) {
  return (
    <>
      {goals.map((goal, gi) => (
        <View key={gi} wrap={false}>
          <View style={styles.goalRow}>
            <View style={styles.checkbox} />
            <Text style={styles.goalText}>{goal.text}</Text>
          </View>
          {goal.tasks.map((task, ti) => (
            <View key={ti} wrap={false}>
              <View style={styles.taskRow}>
                <View style={styles.checkbox} />
                <Text style={styles.taskText}>{task.text}</Text>
              </View>
              {task.subtasks.map((sub, si) => (
                <View key={si} style={styles.subtaskRow} wrap={false}>
                  <View style={styles.checkboxSmall} />
                  <Text style={styles.subtaskText}>{sub.text}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

/** Blank print-and-fill placeholder shown when there's no goal content yet. */
function GoalsBlank() {
  return (
    <>
      {[0, 1, 2].map((g) => (
        <View key={g} wrap={false} style={{ marginBottom: 14 }}>
          <View style={styles.goalRow}>
            <View style={styles.checkbox} />
            <View style={styles.blankLine} />
          </View>
          {[0, 1].map((t) => (
            <View key={t} style={styles.taskRow} wrap={false}>
              <View style={styles.checkbox} />
              <View style={styles.blankLine} />
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

function GoalsSection({ config }: { config: PdfConfig }) {
  const goals = config.blank ? [] : config.goals;
  return (
    <View style={styles.goalsSection}>
      <Text style={styles.goalsHeading}>Goals</Text>
      {goals.length > 0 ? <GoalsFilled goals={goals} /> : <GoalsBlank />}
    </View>
  );
}

// ---- Grid ---------------------------------------------------------------

function GridSection({ config }: { config: PdfConfig }) {
  const rows = config.gridRows.length > 0 ? config.gridRows : ["Work Hours"];
  return (
    <View style={styles.gridSection}>
      <View style={styles.gridTable}>
        <View style={styles.gridHeaderRow}>
          <View style={[styles.gridHeaderCell, { width: GRID_LABEL_W }]} />
          {GRID_DAYS.map((day) => (
            <View key={day} style={[styles.gridHeaderCell, { flex: 1 }]}>
              <Text style={styles.gridHeaderText}>{day.slice(0, 3)}</Text>
            </View>
          ))}
        </View>
        {rows.map((label, i) => (
          <View key={i} style={styles.gridRow} wrap={false}>
            <View style={styles.gridLabelCell}>
              {!config.blank && label ? (
                <Text style={styles.gridLabelText}>{label}</Text>
              ) : null}
            </View>
            {GRID_DAYS.map((day) => (
              <View key={day} style={styles.gridCell} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ---- Document --------------------------------------------------------------

export function WeeklyGoalTrackerDocument({ config }: { config: PdfConfig }) {
  ensurePdfFonts();

  return (
    <Document
      title="Weekly Goal Planner"
      author="Redef AI"
      creator="Redef AI — Weekly Goal Planner Generator"
    >
      <Page size="A4" style={styles.page}>
        <Header config={config} />
        <GoalsSection config={config} />
        <GridSection config={config} />
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Made with Redef AI</Text>
          <Text style={styles.footerText}>redefai.app</Text>
        </View>
      </Page>
    </Document>
  );
}
