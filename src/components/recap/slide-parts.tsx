"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { RECAP, RECAP_ACCENTS, RECAP_DELTA } from "./recap-theme";

/** Deterministic pseudo-random in [0,1) — same seed, same confetti every
    time, so a slide doesn't reshuffle its decoration on re-render. */
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const CONFETTI_SHAPES = ["circle", "bar", "squiggle"] as const;
const CONFETTI_COLORS = [
  RECAP_ACCENTS.amber,
  RECAP_ACCENTS.violet,
  RECAP_ACCENTS.coral,
  RECAP_ACCENTS.green,
];

/**
 * Scattered celebration particles behind a slide's content. Purely
 * decorative, hence aria-hidden and pointer-events-none.
 */
export function Confetti({ count = 26 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: count }).map((_, i) => {
        const left = seeded(i + 1) * 100;
        const top = seeded(i + 101) * 100;
        const shape = CONFETTI_SHAPES[Math.floor(seeded(i + 201) * 3)];
        const color = CONFETTI_COLORS[Math.floor(seeded(i + 301) * 4)];
        const rotate = seeded(i + 401) * 360;
        const size = 6 + seeded(i + 501) * 8;
        return (
          <motion.span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative set
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: shape === "bar" ? size * 1.8 : size,
              height: shape === "squiggle" ? size * 0.5 : size,
              borderRadius: shape === "circle" ? "50%" : size,
              background: color,
              rotate: `${rotate}deg`,
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{
              duration: 0.45,
              delay: 0.05 + seeded(i + 601) * 0.5,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}

/** Percent change, coloured by whether it's the good direction. */
export function DeltaText({
  current,
  previous,
  higherIsGood = true,
}: {
  current: number;
  previous: number;
  higherIsGood?: boolean;
}) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return (
      <span
        style={{ color: RECAP_DELTA.good }}
        className="text-sm font-semibold"
      >
        New this week
      </span>
    );
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const flat = Math.abs(pct) < 0.5;
  const good = pct > 0 ? higherIsGood : !higherIsGood;
  return (
    <span
      className="text-sm font-semibold"
      style={{
        color: flat
          ? RECAP_DELTA.flat
          : good
            ? RECAP_DELTA.good
            : RECAP_DELTA.bad,
      }}
    >
      {flat
        ? "About the same as"
        : `${pct > 0 ? "+" : ""}${pct.toFixed(0)}% from`}{" "}
      previous week
    </span>
  );
}

/** Big headline with optional accent-coloured fragment, as in the IG recap. */
export function SlideHeading({ children }: { children: ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight"
      style={{ color: RECAP.text }}
    >
      {children}
    </motion.h2>
  );
}

export function SlideBody({ children }: { children: ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
      className="text-pretty text-base leading-relaxed"
      style={{ color: RECAP.textMuted }}
    >
      {children}
    </motion.p>
  );
}

/** A labelled number with its week-over-week delta underneath. */
export function StatBlock({
  value,
  label,
  current,
  previous,
  higherIsGood = true,
  delay = 0,
}: {
  value: string;
  label: string;
  current: number;
  previous: number;
  higherIsGood?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex flex-col gap-0.5"
    >
      <span
        className="tabular-nums text-4xl font-extrabold leading-none"
        style={{ color: RECAP.text }}
      >
        {value}
      </span>
      <span className="text-sm" style={{ color: RECAP.textMuted }}>
        {label}
      </span>
      <DeltaText
        current={current}
        previous={previous}
        higherIsGood={higherIsGood}
      />
    </motion.div>
  );
}
