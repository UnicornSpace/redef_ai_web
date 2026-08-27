"use client";

import { ArrowDown, ArrowUp, Flame, ListChecks, Timer, Wallet } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ReportMetric, WeeklyReportData } from "@/lib/types/reports";
import { cn } from "@/lib/utils";

// Matches finance-client.tsx's formatMoneyCompact — no currency symbol
// (the app never assumes one), locale-aware grouping, whole units.
function formatMoneyCompact(amount: number): string {
  return Math.round(amount).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

type Direction = "up" | "down" | "flat" | "new";

function direction(current: number, previous: number): Direction {
  if (previous === 0) return current > 0 ? "new" : "flat";
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return "flat";
  return pct > 0 ? "up" : "down";
}

function pctText(current: number, previous: number): string {
  if (previous === 0) return "New";
  const pct = Math.abs(((current - previous) / previous) * 100);
  return `${pct.toFixed(0)}%`;
}

// ---- narrative headline ----------------------------------------------------

interface Signal {
  good: boolean;
}

function buildInsight(report: WeeklyReportData): string | null {
  const signals: Signal[] = [];
  if (report.habits) signals.push({ good: report.habits.current >= report.habits.previous });
  if (report.tasks) signals.push({ good: report.tasks.current >= report.tasks.previous });
  if (report.deepWork) signals.push({ good: report.deepWork.current >= report.deepWork.previous });
  if (report.personalFinance) {
    signals.push({
      good: report.personalFinance.net.current >= report.personalFinance.net.previous,
    });
  }
  if (signals.length === 0) return null;

  const up = signals.filter((s) => s.good).length;
  const total = signals.length;

  if (up === total) return "You're up across the board this week.";
  if (up === 0) return "A quieter week than the one before — everything's ready for a rebound.";
  if (up > total / 2) return `Trending up in ${up} of ${total} areas this week.`;
  if (up < total / 2) return `Down in ${total - up} of ${total} areas — worth a look.`;
  return `A mixed week — ${up} up, ${total - up} down.`;
}

// ---- delta pill -------------------------------------------------------------

function DeltaPill({
  current,
  previous,
  higherIsGreen = true,
}: {
  current: number;
  previous: number;
  higherIsGreen?: boolean;
}) {
  const dir = direction(current, previous);
  if (dir === "flat" && previous === 0 && current === 0) return null;

  const good = dir === "new" || (dir === "up" ? higherIsGreen : dir === "down" ? !higherIsGreen : false);
  const styles =
    dir === "flat"
      ? "bg-[rgba(55,50,47,0.06)] text-body-muted"
      : good
        ? "bg-g-green-pale text-rf-green-deep"
        : "bg-[rgba(255,106,85,0.12)] text-rf-coral";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        styles,
      )}
    >
      {dir === "up" ? <ArrowUp size={11} /> : dir === "down" ? <ArrowDown size={11} /> : null}
      {dir === "new" ? "New this week" : dir === "flat" ? "Flat" : pctText(current, previous)}
      {dir !== "new" && dir !== "flat" ? " vs last week" : ""}
    </span>
  );
}

// ---- card ---------------------------------------------------------------

const cardVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

function MetricCard({
  href,
  icon,
  label,
  valueText,
  metric,
  monthAvgText,
  higherIsGreen = true,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  valueText: string;
  metric: ReportMetric;
  monthAvgText: string;
  higherIsGreen?: boolean;
}) {
  return (
    <motion.div variants={cardVariants} transition={{ duration: 0.35, ease: "easeOut" }}>
      <Link
        href={href}
        className={cn(
          "group flex flex-col gap-3 rounded-2xl bg-paper p-5 transition-[box-shadow,transform] duration-150 ease-out",
          "shadow-[0_0_0_1px_rgba(55,50,47,0.06),0_1px_2px_-1px_rgba(55,50,47,0.06),0_2px_4px_rgba(55,50,47,0.04)]",
          "hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(55,50,47,0.1),0_4px_10px_-2px_rgba(55,50,47,0.1),0_8px_20px_rgba(55,50,47,0.06)]",
          "active:scale-[0.98]",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-full bg-g-green-pale text-rf-green-deep transition-transform duration-150 group-hover:scale-105">
            {icon}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wide text-body-muted">
            {label}
          </span>
          <span className="tabular-nums text-3xl font-extrabold text-ink">{valueText}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <DeltaPill current={metric.current} previous={metric.previous} higherIsGreen={higherIsGreen} />
          <span className="text-xs text-body-muted">{monthAvgText} avg/week</span>
        </div>
      </Link>
    </motion.div>
  );
}

// ---- page -----------------------------------------------------------------

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function WeeklyReportView({
  report,
  sourceLabel,
}: {
  report: WeeklyReportData;
  sourceLabel: string;
}) {
  const hasAnySection =
    report.habits || report.tasks || report.deepWork || report.personalFinance;
  const insight = buildInsight(report);

  if (!hasAnySection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-4 flex flex-col gap-1 rounded-2xl border border-dashed border-line bg-paper/40 px-6 py-10 text-center md:mx-8"
      >
        <p className="text-sm font-semibold text-ink">Nothing to report yet.</p>
        <p className="text-sm text-body-muted">
          Turn on a module — Habits, Tasks, Deep Work, or Personal Finance — in
          Preferences and check back next week.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col gap-5 px-4 pb-10 md:px-8"
    >
      <motion.div variants={fadeUp} transition={{ duration: 0.3 }} className="flex flex-col gap-1">
        {insight ? (
          <p className="text-balance text-lg font-bold text-ink">{insight}</p>
        ) : null}
        <span className="text-sm text-body-muted">
          {report.windowLabel} · {sourceLabel} — vs the 7 days before and your
          trailing 4-week average
        </span>
      </motion.div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {report.habits ? (
          <MetricCard
            href="/app/habits"
            icon={<Flame size={16} />}
            label="Habit check-ins"
            valueText={String(report.habits.current)}
            metric={report.habits}
            monthAvgText={report.habits.monthAvgPerWeek.toFixed(1)}
          />
        ) : null}
        {report.tasks ? (
          <MetricCard
            href="/app/tasks"
            icon={<ListChecks size={16} />}
            label="Tasks completed"
            valueText={String(report.tasks.current)}
            metric={report.tasks}
            monthAvgText={report.tasks.monthAvgPerWeek.toFixed(1)}
          />
        ) : null}
        {report.deepWork ? (
          <MetricCard
            href="/app/deep-work"
            icon={<Timer size={16} />}
            label="Deep work"
            valueText={`${report.deepWork.current.toFixed(1)}h`}
            metric={report.deepWork}
            monthAvgText={`${report.deepWork.monthAvgPerWeek.toFixed(1)}h`}
          />
        ) : null}
        {report.personalFinance ? (
          <>
            <MetricCard
              href="/app/personal-finance"
              icon={<Wallet size={16} />}
              label="Spent"
              valueText={formatMoneyCompact(report.personalFinance.spent.current)}
              metric={report.personalFinance.spent}
              monthAvgText={formatMoneyCompact(report.personalFinance.spent.monthAvgPerWeek)}
              higherIsGreen={false}
            />
            <MetricCard
              href="/app/personal-finance"
              icon={<Wallet size={16} />}
              label="Income"
              valueText={formatMoneyCompact(report.personalFinance.income.current)}
              metric={report.personalFinance.income}
              monthAvgText={formatMoneyCompact(report.personalFinance.income.monthAvgPerWeek)}
            />
            <MetricCard
              href="/app/personal-finance"
              icon={<Wallet size={16} />}
              label="Net"
              valueText={formatMoneyCompact(report.personalFinance.net.current)}
              metric={report.personalFinance.net}
              monthAvgText={formatMoneyCompact(report.personalFinance.net.monthAvgPerWeek)}
            />
          </>
        ) : null}
      </motion.div>

      {report.habits ? (
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex items-center justify-between rounded-2xl bg-paper px-5 py-4",
            "shadow-[0_0_0_1px_rgba(55,50,47,0.06),0_1px_2px_-1px_rgba(55,50,47,0.06),0_2px_4px_rgba(55,50,47,0.04)]",
          )}
        >
          <span className="text-sm text-body-muted">
            {report.habits.activeHabits} active habit
            {report.habits.activeHabits === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Flame size={16} className="text-rf-coral" />
            {report.habits.bestStreak}d best streak
          </span>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
