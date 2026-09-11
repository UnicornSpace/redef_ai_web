"use client";

import { Flame, ListChecks, Sparkles, Timer, Wallet } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { ReportMetric, WeeklyReportData } from "@/lib/types/reports";
import { ComparisonChart } from "./comparison-chart";
import { RECAP, RECAP_ACCENTS } from "./recap-theme";
import { Confetti, SlideBody, SlideHeading, StatBlock } from "./slide-parts";

function compactNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return Math.round(n).toLocaleString();
}

/** Slide shell — consistent vertical rhythm and top offset for every slide. */
function Slide({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex min-h-full flex-col gap-5 pt-8 ${className}`}
    >
      {children}
    </div>
  );
}

function Eyebrow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
      style={{ color: RECAP.textMuted }}
    >
      {icon}
      {label}
    </span>
  );
}

/** Footer insight line — the "what caused this" note under the chart. */
function InsightNote({ children }: { children: ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="flex items-start gap-2 text-sm leading-relaxed"
      style={{ color: RECAP.textMuted }}
    >
      <Sparkles size={15} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </motion.p>
  );
}

function pctChange(m: ReportMetric): number | null {
  if (m.previous === 0) return null;
  return ((m.current - m.previous) / Math.abs(m.previous)) * 100;
}

/**
 * Turns a report into the ordered slide deck.
 *
 * Only modules that are enabled AND have something to show get a slide —
 * an empty recap of zeroes is worse than a short one. Every slide's copy
 * is derived from the numbers rather than fixed, so a down week reads
 * honestly instead of falsely congratulating.
 */
export function buildRecapSlides(report: WeeklyReportData): ReactNode[] {
  const slides: ReactNode[] = [];

  // ---- 1. cover ----------------------------------------------------------
  slides.push(
    <Slide key="cover" className="justify-center pb-16">
      <Confetti count={30} />
      <div className="relative flex flex-col gap-3">
        <Eyebrow icon={<Sparkles size={13} />} label="Your week, recapped" />
        <SlideHeading>{report.windowLabel}</SlideHeading>
        <SlideBody>
          Here is how the last seven days went, next to the seven before them.
        </SlideBody>
      </div>
    </Slide>,
  );

  // ---- 2. streak celebration --------------------------------------------
  if (report.habits && report.habits.bestStreak > 1) {
    const streak = report.habits.bestStreak;
    slides.push(
      <Slide key="streak" className="justify-center pb-16">
        <Confetti count={34} />
        <div className="relative flex flex-col items-center gap-8">
          {/* The tilted white chip is lifted from the reference — it is the
              one bright object on a dark slide, so it carries the moment. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 shadow-lg"
          >
            <Flame size={26} style={{ color: RECAP_ACCENTS.coral }} />
            <span className="text-3xl font-extrabold tracking-tight text-[#151312]">
              {streak} {streak === 1 ? "day" : "days"}
            </span>
          </motion.div>
          <div className="flex flex-col gap-3 self-stretch">
            <SlideHeading>
              Your longest streak is {streak} days in a row.
            </SlideHeading>
            <SlideBody>
              Showing up on consecutive days is what turns a habit from
              something you decide into something you just do.
            </SlideBody>
          </div>
        </div>
      </Slide>,
    );
  }

  // ---- 3. habits ---------------------------------------------------------
  if (
    report.habits &&
    (report.habits.current > 0 || report.habits.previous > 0)
  ) {
    const h = report.habits;
    const pct = pctChange(h);
    const up = h.current >= h.previous;
    slides.push(
      <Slide key="habits">
        <Eyebrow icon={<Flame size={13} />} label="Habits" />
        <SlideHeading>
          {pct === null
            ? `${h.current} check-ins this week`
            : up
              ? "Your check-ins are up"
              : "Fewer check-ins than last week"}
        </SlideHeading>
        <SlideBody>
          You logged {h.current} habit check-in{h.current === 1 ? "" : "s"}
          {pct !== null
            ? ` — ${Math.abs(pct).toFixed(0)}% ${up ? "more than" : "less than"} the week before.`
            : "."}
        </SlideBody>
        <ComparisonChart series={h.series} accent="green" />
        <InsightNote>
          {h.activeHabits} active habit{h.activeHabits === 1 ? "" : "s"},
          averaging {h.monthAvgPerWeek.toFixed(1)} check-ins a week over the
          last month.
        </InsightNote>
      </Slide>,
    );
  }

  // ---- 4. deep work ------------------------------------------------------
  if (
    report.deepWork &&
    (report.deepWork.current > 0 || report.deepWork.previous > 0)
  ) {
    const d = report.deepWork;
    const pct = pctChange(d);
    const up = d.current >= d.previous;
    slides.push(
      <Slide key="deep-work">
        <Eyebrow icon={<Timer size={13} />} label="Deep work" />
        <SlideHeading>
          {up ? "You went deeper this week" : "A lighter week of focus"}
        </SlideHeading>
        <SlideBody>
          {d.current.toFixed(1)} hours of focused work
          {pct !== null
            ? `, ${Math.abs(pct).toFixed(0)}% ${up ? "up on" : "down from"} last week.`
            : "."}
        </SlideBody>
        <ComparisonChart
          series={d.series}
          accent="violet"
          formatValue={(n) => `${n.toFixed(0)}h`}
        />
        <InsightNote>
          Your trailing four-week average is {d.monthAvgPerWeek.toFixed(1)}{" "}
          hours a week.
        </InsightNote>
      </Slide>,
    );
  }

  // ---- 5. tasks ----------------------------------------------------------
  if (report.tasks && (report.tasks.current > 0 || report.tasks.previous > 0)) {
    const t = report.tasks;
    const up = t.current >= t.previous;
    slides.push(
      <Slide key="tasks">
        <Eyebrow icon={<ListChecks size={13} />} label="Tasks" />
        <SlideHeading>
          You finished {t.current} task{t.current === 1 ? "" : "s"}
        </SlideHeading>
        <SlideBody>
          {up
            ? "Ahead of last week's pace."
            : "A little behind last week — no drama, weeks differ."}
        </SlideBody>
        <ComparisonChart series={t.series} accent="amber" />
      </Slide>,
    );
  }

  // ---- 6. money ----------------------------------------------------------
  if (report.personalFinance) {
    const f = report.personalFinance;
    const hasAny =
      f.spent.current > 0 || f.income.current > 0 || f.spent.previous > 0;
    if (hasAny) {
      const spentDown = f.spent.current <= f.spent.previous;
      slides.push(
        <Slide key="money">
          <Eyebrow icon={<Wallet size={13} />} label="Money" />
          <SlideHeading>
            {spentDown
              ? "You spent less this week"
              : "Spending was up this week"}
          </SlideHeading>
          <div className="flex flex-col gap-5 pt-1">
            <StatBlock
              value={compactNumber(f.spent.current)}
              label="Spent"
              current={f.spent.current}
              previous={f.spent.previous}
              higherIsGood={false}
              delay={0.05}
            />
            <StatBlock
              value={compactNumber(f.income.current)}
              label="Income"
              current={f.income.current}
              previous={f.income.previous}
              delay={0.12}
            />
            <StatBlock
              value={compactNumber(f.net.current)}
              label="Net"
              current={f.net.current}
              previous={f.net.previous}
              delay={0.19}
            />
          </div>
          <div className="pt-1">
            <ComparisonChart
              series={f.spent.series}
              accent="coral"
              formatValue={compactNumber}
            />
          </div>
        </Slide>,
      );
    }
  }

  // ---- 7. outro ----------------------------------------------------------
  slides.push(
    <Slide key="outro" className="justify-center pb-16">
      <Confetti count={22} />
      <div className="relative flex flex-col gap-3">
        <SlideHeading>That is your week.</SlideHeading>
        <SlideBody>
          Next week's recap starts building the moment you log your first thing.
          Keep the streak alive.
        </SlideBody>
      </div>
    </Slide>,
  );

  return slides;
}
