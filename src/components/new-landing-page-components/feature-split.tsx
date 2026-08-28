"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  Container,
  Eyebrow,
  MicIcon,
  Reveal,
  springSmooth,
  TickList,
  VoiceWave,
} from "./shared";

/* ------------------------------------------------------------------ */
/* Reusable split section shell                                        */
/* ------------------------------------------------------------------ */

function Split({
  id,
  eyebrow,
  eyebrowColor,
  title,
  body,
  ticks,
  tickColumns = 1,
  tickColor,
  panel,
  panelSide = "right",
}: {
  id?: string;
  eyebrow: string;
  eyebrowColor: string;
  title: ReactNode;
  body: string;
  ticks: string[];
  tickColumns?: 1 | 2;
  tickColor?: string;
  panel: ReactNode;
  panelSide?: "left" | "right";
}) {
  const text = (
    <Reveal
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        justifyContent: "center",
      }}
    >
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 className="f-h2">{title}</h2>
        <p className="f-lede" style={{ maxWidth: 460 }}>
          {body}
        </p>
      </div>
      <TickList
        items={ticks}
        color={tickColor ?? eyebrowColor}
        columns={tickColumns}
      />
    </Reveal>
  );

  const graphic = (
    <Reveal delay={0.1}>
      <div
        className="f-panel"
        style={{
          padding: "2.6rem 2.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 380,
        }}
      >
        {panel}
      </div>
    </Reveal>
  );

  return (
    <Container>
      <section id={id} className="f-split" style={{ padding: "5.5rem 0" }}>
        {panelSide === "left" ? (
          <>
            <div className="f-split-panel">{graphic}</div>
            {text}
          </>
        ) : (
          <>
            {text}
            <div className="f-split-panel">{graphic}</div>
          </>
        )}
        <style>{`
          .redef .f-split {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
          }
          @media (max-width: 900px) {
            .redef .f-split { grid-template-columns: 1fr; gap: 2.5rem; }
            .redef .f-split-panel { order: 2; }
          }
        `}</style>
      </section>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/* Mock UI: voice conversation                                         */
/* ------------------------------------------------------------------ */

function VoiceChatMock() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 380,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* user voice bubble */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ ...springSmooth, delay: 0.15 }}
        style={{
          alignSelf: "flex-end",
          background: "var(--ink)",
          color: "#fff",
          borderRadius: "22px 22px 6px 22px",
          padding: "0.85rem 1.15rem",
          display: "flex",
          alignItems: "center",
          gap: 12,
          transformOrigin: "bottom right",
        }}
      >
        <VoiceWave height={15} />
        <span
          style={{
            fontWeight: 650,
            fontSize: "0.93rem",
            letterSpacing: "-0.01em",
          }}
        >
          “Plan my day around the investor call…”
        </span>
      </motion.div>

      {/* assistant reply card */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ ...springSmooth, delay: 0.4 }}
        style={{
          alignSelf: "flex-start",
          background: "#fff",
          border: "1px solid rgba(55,50,47,0.06)",
          borderRadius: "22px 22px 22px 6px",
          padding: "1rem 1.15rem",
          boxShadow: "0 8px 24px rgba(55,50,47,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          transformOrigin: "bottom left",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--rf-green-deep)",
            fontWeight: 750,
            fontSize: "0.85rem",
          }}
        >
          <MicIcon size={13} /> Done — 3 changes
        </span>
        {[
          {
            time: "10:00",
            label: "Investor call — prep notes attached",
            color: "var(--rf-coral)",
          },
          {
            time: "09:15",
            label: "Deep work moved before the call",
            color: "var(--rf-violet)",
          },
          {
            time: "13:00",
            label: "Lunch protected, no meetings",
            color: "var(--rf-amber)",
          },
        ].map((row) => (
          <span
            key={row.label}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <span
              style={{
                width: 4,
                height: 26,
                borderRadius: 3,
                background: row.color,
              }}
            />
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 750,
                color: "rgba(55,50,47,0.4)",
                width: 42,
              }}
            >
              {row.time}
            </span>
            <span
              style={{
                fontSize: "0.88rem",
                fontWeight: 650,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
              }}
            >
              {row.label}
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mock UI: unified day                                                */
/* ------------------------------------------------------------------ */

function UnifiedDayMock() {
  const blocks = [
    {
      time: "08:30",
      label: "Morning routine",
      tag: "habit · day 12",
      color: "var(--rf-amber)",
    },
    {
      time: "09:15",
      label: "Deep work — roadmap",
      tag: "focus · 2h",
      color: "var(--rf-violet)",
    },
    {
      time: "11:30",
      label: "Ship landing page",
      tag: "task",
      color: "var(--rf-green)",
    },
    {
      time: "14:00",
      label: "Team sync",
      tag: "calendar",
      color: "var(--rf-coral)",
    },
  ];
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        background: "#fff",
        borderRadius: 18,
        border: "1px solid rgba(55,50,47,0.06)",
        boxShadow: "0 10px 30px rgba(55,50,47,0.07)",
        padding: "1.15rem 1.2rem",
        display: "flex",
        flexDirection: "column",
        gap: 11,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Today
        </span>
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "rgba(55,50,47,0.35)",
          }}
        >
          4 of 6 done
        </span>
      </div>
      {blocks.map((block, i) => (
        <motion.div
          key={block.label}
          initial={{ opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ ...springSmooth, delay: 0.12 + i * 0.09 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--paper)",
            borderRadius: 13,
            padding: "0.65rem 0.85rem",
          }}
        >
          <span
            style={{
              width: 5,
              height: 34,
              borderRadius: 3,
              background: block.color,
            }}
          />
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 1,
            }}
          >
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "var(--ink)",
                letterSpacing: "-0.014em",
              }}
            >
              {block.label}
            </span>
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 650,
                color: "rgba(55,50,47,0.38)",
              }}
            >
              {block.tag}
            </span>
          </span>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 750,
              color: "rgba(55,50,47,0.4)",
            }}
          >
            {block.time}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mock UI: weekly insight                                             */
/* ------------------------------------------------------------------ */

function InsightMock() {
  const rows = [
    {
      label: "Deep work",
      value: "11h 20m",
      pct: 84,
      color: "var(--rf-violet)",
    },
    { label: "Meetings", value: "6h 45m", pct: 52, color: "var(--rf-coral)" },
    {
      label: "Habits kept",
      value: "18 / 21",
      pct: 86,
      color: "var(--rf-green)",
    },
    {
      label: "Context switches",
      value: "− 41%",
      pct: 30,
      color: "var(--rf-amber)",
    },
  ];
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        background: "#fff",
        borderRadius: 18,
        border: "1px solid rgba(55,50,47,0.06)",
        boxShadow: "0 10px 30px rgba(55,50,47,0.07)",
        padding: "1.2rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Weekly review
        </span>
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 750,
            color: "var(--rf-green-deep)",
          }}
        >
          Best week yet
        </span>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.label}
          style={{ display: "flex", flexDirection: "column", gap: 6 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "0.87rem",
                fontWeight: 700,
                color: "var(--ink)",
                letterSpacing: "-0.012em",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 750,
                color: "rgba(55,50,47,0.45)",
              }}
            >
              {row.value}
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 6,
              background: "var(--paper)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${row.pct}%` }}
              viewport={{ once: true }}
              transition={{
                ...springSmooth,
                duration: 0.9,
                delay: 0.15 + i * 0.1,
              }}
              style={{ height: "100%", borderRadius: 6, background: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The three concrete sections                                         */
/* ------------------------------------------------------------------ */

export function SpeakSection() {
  return (
    <Split
      eyebrow="Effortless"
      eyebrowColor="var(--rf-green-deep)"
      title={
        <>
          Speak it <span className="f-dim">into existence.</span>
        </>
      }
      body="Your companion understands your intent, manages your calendar, tracks your tasks and habits, and provides insights — all through natural conversation. Productivity that works for you, not against you."
      ticks={[
        "Natural conversation",
        "Hands-free capture",
        "Zero manual entry",
      ]}
      panel={<VoiceChatMock />}
      panelSide="right"
    />
  );
}

export function UnifiedSection() {
  return (
    <Split
      eyebrow="Unified"
      eyebrowColor="var(--rf-violet)"
      title={
        <>
          Your whole day, <span className="f-dim">one brain.</span>
        </>
      }
      body="Calendar, tasks, habits, and deep work live in one unified system — not scattered across Notion, Todoist, and Google Calendar. We're not another tool to manage; we're the system that manages itself for you."
      ticks={[
        "Everything in one place",
        "Syncs across your tools",
        "Adopt at your own pace",
      ]}
      panel={<UnifiedDayMock />}
      panelSide="left"
    />
  );
}

export function InsightSection() {
  return (
    <Split
      eyebrow="Clarity"
      eyebrowColor="var(--rf-amber)"
      tickColor="var(--rf-amber)"
      title={
        <>
          Know where <span className="f-dim">your time goes.</span>
        </>
      }
      body="Understand your patterns, track progress, and get back control of your time. Redef turns your week into readable insights so you can make confident decisions instead of guessing."
      ticks={[
        "Weekly reviews, spoken",
        "Habit streaks & trends",
        "Focus time analytics",
      ]}
      panel={<InsightMock />}
      panelSide="right"
    />
  );
}
