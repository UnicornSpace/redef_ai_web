"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Container,
  Reveal,
  springPlayful,
  springSmooth,
  springSnappy,
  VoiceWave,
} from "./shared";

/* ------------------------------------------------------------------ */
/* 1. Listening pill — transcribes, then becomes a task                */
/* ------------------------------------------------------------------ */

function ListeningGraphic() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setDone((d) => !d), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <motion.div
        layout
        transition={springSmooth}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          background: "#fff",
          borderRadius: 999,
          padding: "0.95rem 1.6rem",
          border: "1px solid rgba(55,50,47,0.05)",
          boxShadow: "0 6px 18px rgba(55,50,47,0.06)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={springPlayful}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--rf-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                aria-hidden="true"
                width="13"
                height="11"
                viewBox="0 0 13 11"
                fill="none"
              >
                <path
                  d="M1.5 5.6 4.8 9 11.5 1.5"
                  stroke="#fff"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key="wave"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={springSnappy}
              style={{ display: "flex" }}
            >
              <VoiceWave color="var(--rf-green)" height={18} />
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={done ? "added" : "listening"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            style={{
              fontWeight: 750,
              fontSize: "1.16rem",
              letterSpacing: "-0.02em",
              color: done ? "var(--rf-green-deep)" : "var(--ink)",
              whiteSpace: "nowrap",
            }}
          >
            {done ? "Task added" : "“Buy flowers for mom”"}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Streak stars — habit celebration                                 */
/* ------------------------------------------------------------------ */

function StreakGraphic() {
  const days = [
    { id: "mon", label: "M" },
    { id: "tue", label: "T" },
    { id: "wed", label: "W" },
    { id: "thu", label: "T" },
    { id: "fri", label: "F" },
    { id: "sat", label: "S" },
    { id: "sun", label: "S" },
  ];
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(55,50,47,0.05)",
        boxShadow: "0 6px 18px rgba(55,50,47,0.05)",
        padding: "1.1rem 1.3rem",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
        maxWidth: 380,
        margin: "0 auto",
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
            fontSize: "0.98rem",
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Morning run
        </span>
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 750,
            color: "var(--rf-amber)",
          }}
        >
          12-day streak 🔥
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {days.map(({ id, label }, i) => {
          const hit = i < 5;
          return (
            <motion.div
              key={id}
              initial={{ scale: 0, rotate: -30 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ ...springPlayful, delay: 0.1 + i * 0.07 }}
              style={{
                flex: 1,
                aspectRatio: "1",
                borderRadius: 11,
                background: hit ? "var(--rf-amber)" : "var(--paper)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {hit ? (
                <svg
                  aria-hidden="true"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2.6l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 16l-5.2 2.8 1-5.9-4.3-4.1 5.9-.9L12 2.6Z"
                    fill="#fff"
                  />
                </svg>
              ) : (
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 750,
                    color: "rgba(55,50,47,0.3)",
                  }}
                >
                  {label}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Focus ring — deep work timer                                     */
/* ------------------------------------------------------------------ */

function FocusGraphic() {
  const R = 44;
  const C = 2 * Math.PI * R;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
      }}
    >
      <div style={{ position: "relative", width: 116, height: 116 }}>
        <svg aria-hidden="true" width="116" height="116" viewBox="0 0 116 116">
          <circle
            cx="58"
            cy="58"
            r={R}
            stroke="var(--paper)"
            strokeWidth="11"
            fill="none"
          />
          <motion.circle
            cx="58"
            cy="58"
            r={R}
            stroke="var(--rf-violet)"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            whileInView={{ strokeDashoffset: C * 0.28 }}
            viewport={{ once: true }}
            transition={{ ...springSmooth, duration: 1.4, delay: 0.2 }}
            transform="rotate(-90 58 58)"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.28rem",
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            1:26
          </span>
          <span
            style={{
              fontSize: "0.66rem",
              fontWeight: 750,
              color: "rgba(55,50,47,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            focused
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {["Notifications muted", "Calendar protected", "Music playing"].map(
          (line, i) => (
            <motion.span
              key={line}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ...springSmooth, delay: 0.3 + i * 0.12 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.88rem",
                fontWeight: 650,
                color: "var(--body-muted)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--rf-violet)",
                }}
              />
              {line}
            </motion.span>
          ),
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Undo toast — forgiveness built in                                */
/* ------------------------------------------------------------------ */

function UndoGraphic() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
        maxWidth: 360,
        margin: "0 auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0.4, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={springSmooth}
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid rgba(55,50,47,0.05)",
          padding: "0.85rem 1.05rem",
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "line-through",
          color: "rgba(55,50,47,0.35)",
          fontWeight: 650,
          fontSize: "0.93rem",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 6,
            border: "2px solid rgba(55,50,47,0.2)",
          }}
        />
        Friday review meeting
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ ...springPlayful, delay: 0.35 }}
        style={{
          background: "var(--ink)",
          color: "#fff",
          borderRadius: 999,
          padding: "0.75rem 1.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 10px 26px rgba(55,50,47,0.22)",
        }}
      >
        <span style={{ fontSize: "0.9rem", fontWeight: 650 }}>
          Cancelled “Friday review”
        </span>
        <span
          style={{
            fontSize: "0.9rem",
            fontWeight: 800,
            color: "var(--g-amber)",
          }}
        >
          Undo
        </span>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const details = [
  {
    title: "Heard, Then Handled",
    body: "Watch your words become structure in real time. Redef transcribes as you speak and settles into a task, event, or habit the instant you finish — with a satisfying little snap.",
    graphic: <ListeningGraphic />,
  },
  {
    title: "Celebrate the Streak",
    body: "Habits deserve joy. Every day you keep a streak alive, Redef marks it with a spring-loaded star — small physical moments that make consistency feel rewarding, not like homework.",
    graphic: <StreakGraphic />,
  },
  {
    title: "Guarded Focus",
    body: "When you enter deep work, everything else steps aside. Notifications mute, your calendar defends the block, and a quiet ring keeps time without nagging you.",
    graphic: <FocusGraphic />,
  },
  {
    title: "Forgiveness Built In",
    body: "Said the wrong thing? Every voice action is instantly undoable. Redef confirms what it did in plain language and keeps an Undo within thumb's reach — no fear, no lock-in.",
    graphic: <UndoGraphic />,
  },
];

export function DetailsSection() {
  return (
    <Container>
      <section
        id="details"
        style={{ padding: "5.5rem 0", maxWidth: 640, margin: "0 auto" }}
      >
        <Reveal
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            paddingBottom: "3.4rem",
          }}
        >
          <h2 className="f-h2">Details that matter.</h2>
          <p className="f-lede">
            We sweat the small stuff, so your day feels effortless.
          </p>
        </Reveal>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "3.6rem" }}
        >
          {details.map((detail) => (
            <Reveal
              key={detail.title}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.3rem",
              }}
            >
              <div
                className="f-panel"
                style={{
                  minHeight: 210,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem 1.75rem",
                }}
              >
                {detail.graphic}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.45rem",
                }}
              >
                <p
                  className="f-eyebrow"
                  style={{ color: "var(--rf-green-deep)", fontSize: "1.06rem" }}
                >
                  {detail.title}
                </p>
                <p className="f-lede" style={{ fontSize: "1.02rem" }}>
                  {detail.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Container>
  );
}
