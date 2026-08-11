"use client";

import { Coolshape } from "coolshapes-react";
import { motion } from "motion/react";
import {
  Container,
  Daisy,
  EchoMascot,
  MicIcon,
  PillButton,
  PlayStoreIcon,
  Reveal,
  Sparkle,
} from "./shared";

/* Closing scene: Echo and the shape buddies on a green hill */
function CtaScene() {
  return (
    <div style={{ position: "relative", maxWidth: 500, margin: "0 auto" }}>
      <svg
        viewBox="0 0 500 90"
        fill="none"
        style={{ width: "100%", position: "absolute", bottom: 0, left: 0 }}
      >
        <title>hill</title>
        <ellipse
          cx="300"
          cy="62"
          rx="185"
          ry="27"
          fill="var(--g-green)"
          opacity={0.85}
        />
        <ellipse cx="92" cy="70" rx="85" ry="17" fill="var(--g-green-soft)" />
      </svg>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 26,
          padding: "1.6rem 0 2.2rem",
        }}
      >
        <motion.div
          animate={{ y: [0, -7, 0], rotate: [0, -2, 0] }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 4.6,
            ease: "easeInOut",
          }}
        >
          <Coolshape type="star" index={4} size={86} noise />
        </motion.div>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 5.2,
            ease: "easeInOut",
            delay: 0.4,
          }}
        >
          <EchoMascot size={150} />
        </motion.div>
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [0, 3, 0] }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 4.2,
            ease: "easeInOut",
            delay: 0.8,
          }}
        >
          <Daisy
            size={72}
            petal="var(--g-violet-soft)"
            center="var(--g-amber)"
          />
        </motion.div>
      </div>

      {(
        [
          { left: "4%", top: "10%", size: 22, delay: 0.2 },
          { right: "6%", top: "16%", size: 18, delay: 1.1 },
          { left: "44%", top: "0%", size: 15, delay: 1.7 },
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
          animate={{ scale: [1, 1.3, 1], opacity: [0.65, 1, 0.65] }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 3,
            delay: s.delay,
            ease: "easeInOut",
          }}
        >
          <Sparkle size={s.size} color="var(--g-amber)" />
        </motion.span>
      ))}
    </div>
  );
}

export function CtaSection() {
  return (
    <section
      style={{
        background: "var(--g-green-pale)",
        padding: "4.5rem 0 5rem",
        marginTop: "1rem",
      }}
    >
      <Container>
        <div className="f-cta-grid">
          <Reveal delay={0.08}>
            <CtaScene />
          </Reveal>
          <Reveal
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.6rem",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem",
              }}
            >
              <h2 className="f-h2">
                Ready to take control of your productivity?
              </h2>
              <p className="f-lede" style={{ maxWidth: 460 }}>
                Join professionals who've replaced fragmented tools with one
                voice-first system that brings clarity, focus, and trust back to
                their work.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.8rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <PillButton variant="dark" href="/app/talk">
                <MicIcon size={16} /> Start for free
              </PillButton>
              <PillButton
                variant="white"
                href="https://play.google.com/store/apps/details?id=com.redefai.app"
              >
                <PlayStoreIcon size={14} /> Get it on Google Play
              </PillButton>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.84rem",
                fontWeight: 650,
                color: "var(--body-muted)",
              }}
            >
              iOS coming soon · Free tier, no credit card required
            </p>
          </Reveal>
        </div>
        <style>{`
          .redef .f-cta-grid {
            display: grid;
            grid-template-columns: 1fr 1.1fr;
            gap: 3rem;
            align-items: center;
          }
          @media (max-width: 860px) {
            .redef .f-cta-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </Container>
    </section>
  );
}
