"use client";

import { motion } from "motion/react";
import { Container, Eyebrow, Reveal, Sparkle, TickList } from "./shared";

/* The Redef vault buddy — a rounded-square keeper with a shield chest,
   closed happy eyes, and little arms hugging your data. */
function VaultBuddy() {
  return (
    <div
      style={{
        position: "relative",
        maxWidth: 440,
        margin: "0 auto",
        padding: "2rem 0 1rem",
      }}
    >
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 5.2,
          ease: "easeInOut",
        }}
      >
        <svg
          viewBox="0 0 440 380"
          fill="none"
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <title>Redef privacy guardian</title>
          {/* soft shadow */}
          <ellipse
            cx="220"
            cy="342"
            rx="150"
            ry="18"
            fill="var(--g-green-pale)"
          />

          {/* body — big friendly squircle */}
          <path
            d="M220 40C320 40 350 78 350 190C350 288 316 330 220 330C124 330 90 288 90 190C90 78 120 40 220 40Z"
            fill="var(--g-green)"
          />
          {/* face plate */}
          <path
            d="M220 74C288 74 312 100 312 168C312 230 288 258 220 258C152 258 128 230 128 168C128 100 152 74 220 74Z"
            fill="#ffffff"
            opacity={0.22}
          />
          {/* closed happy eyes */}
          <path
            d="M172 150 q11 14 24 0"
            stroke="var(--g-ink)"
            strokeWidth={9}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M244 150 q11 14 24 0"
            stroke="var(--g-ink)"
            strokeWidth={9}
            strokeLinecap="round"
            fill="none"
          />
          {/* smile */}
          <path
            d="M198 184 q22 18 44 0"
            stroke="var(--g-ink)"
            strokeWidth={9}
            strokeLinecap="round"
            fill="none"
          />
          {/* blush */}
          <circle cx="152" cy="176" r="9" fill="#ffffff" opacity={0.4} />
          <circle cx="288" cy="176" r="9" fill="#ffffff" opacity={0.4} />

          {/* shield chest badge with keyhole */}
          <path
            d="M220 236 l34 12 v26 c0 22 -14 34 -34 42 c-20 -8 -34 -20 -34 -42 v-26 Z"
            fill="var(--g-amber)"
            stroke="#ffffff"
            strokeWidth={6}
          />
          <circle cx="220" cy="278" r="8" fill="var(--g-ink)" />
          <rect
            x="216.5"
            y="282"
            width="7"
            height="14"
            rx="3.5"
            fill="var(--g-ink)"
          />

          {/* little hugging arms */}
          <path
            d="M96 210 q-26 16 -20 42"
            stroke="var(--g-ink)"
            strokeWidth={13}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M344 210 q26 16 20 42"
            stroke="var(--g-ink)"
            strokeWidth={13}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </motion.div>

      {(
        [
          { left: "6%", top: "12%", size: 26, delay: 0 },
          { right: "8%", top: "6%", size: 20, delay: 0.7 },
          { right: "0%", top: "44%", size: 24, delay: 1.3 },
          { left: "8%", top: "58%", size: 18, delay: 1.9 },
        ] as {
          left?: string;
          right?: string;
          top: string;
          size: number;
          delay: number;
        }[]
      ).map((s) => (
        <motion.span
          key={`${s.left ?? s.right}-${s.top}`}
          style={{
            position: "absolute",
            left: s.left,
            right: s.right,
            top: s.top,
          }}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 16, 0],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 3.4,
            delay: s.delay,
            ease: "easeInOut",
          }}
        >
          <Sparkle size={s.size} color="var(--g-green-soft)" />
        </motion.span>
      ))}
    </div>
  );
}

export function SecuritySection() {
  return (
    <Container>
      <section className="f-security" style={{ padding: "5.5rem 0" }}>
        <Reveal delay={0.08} className="f-security-illo">
          <VaultBuddy />
        </Reveal>
        <Reveal
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            justifyContent: "center",
          }}
        >
          <Eyebrow color="var(--rf-green-deep)">Trusted</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h1 className="f-h2">
              Your life stays <span className="f-dim">your life.</span>
            </h1>
            <p className="f-lede" style={{ maxWidth: 460 }}>
              Redef uses enterprise-grade security with end-to-end encryption
              and secure data storage. Your productivity data is private and
              protected — we're building trust, not just a product.
            </p>
          </div>
          <div style={{ paddingTop: "0.5rem" }}>
            <TickList
              items={[
                "End-to-end encryption",
                "Secure data storage",
                "Private by default",
                "You own your data",
              ]}
              color="var(--rf-green-deep)"
              columns={2}
            />
          </div>
        </Reveal>
        <style>{`
          .redef .f-security {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
          }
          @media (max-width: 900px) {
            .redef .f-security { grid-template-columns: 1fr; gap: 2rem; }
            .redef .f-security-illo { order: 2; }
          }
        `}</style>
      </section>
    </Container>
  );
}
