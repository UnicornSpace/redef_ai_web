"use client";

import { Coolshape } from "coolshapes-react";
import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import {
  Daisy,
  EchoMascot,
  Face,
  MicIcon,
  PillButton,
  Sparkle,
  springSmooth,
} from "./shared";

/* ------------------------------------------------------------------ */
/* Floating wrapper for illustration bits                              */
/* ------------------------------------------------------------------ */

function Floaty({
  children,
  style,
  delay = 0,
  duration = 5,
  amplitude = 8,
}: {
  children: ReactNode;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
  amplitude?: number;
}) {
  return (
    <motion.div
      style={{ position: "absolute", ...style }}
      animate={{ y: [0, -amplitude, 0], rotate: [0, 1.2, 0] }}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration,
        delay,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

/* A coolshape with a face on top — the Redef shape buddies */
function ShapeBuddy({
  type,
  index,
  size = 110,
  mouth = "smile",
  faceScale = 0.85,
  faceOffsetY = 0,
}: {
  type:
    | "star"
    | "flower"
    | "ellipse"
    | "wheel"
    | "moon"
    | "misc"
    | "triangle"
    | "polygon"
    | "rectangle";
  index: number;
  size?: number;
  mouth?: "smile" | "open" | "wave";
  faceScale?: number;
  faceOffsetY?: number;
}) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <Coolshape type={type} index={index} size={size} noise />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${faceOffsetY}px)`,
        }}
      >
        <Face
          scale={(size / 110) * faceScale * 0.62}
          mouth={mouth}
          color="rgba(20,16,14,0.85)"
        />
      </div>
    </div>
  );
}

function Dot({
  size = 20,
  color = "var(--g-green)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
      }}
    />
  );
}

function PaleBlob({
  size = 120,
  color = "var(--g-amber-pale)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Hero clusters                                                       */
/* ------------------------------------------------------------------ */

function LeftCluster() {
  return (
    <div className="f-hero-cluster" style={{ left: 0 }}>
      <Floaty style={{ left: 30, top: 40 }} duration={6.5}>
        <PaleBlob size={130} />
      </Floaty>
      <Floaty style={{ left: 240, top: 200 }} duration={7} delay={0.6}>
        <PaleBlob size={112} color="var(--g-green-pale)" />
      </Floaty>

      <Floaty style={{ left: 320, top: 60 }} delay={0.8} amplitude={12}>
        <EchoMascot size={168} />
      </Floaty>
      <Floaty style={{ left: 110, top: 90 }} delay={0.2} amplitude={10}>
        <ShapeBuddy type="star" index={4} size={118} mouth="smile" />
      </Floaty>
      <Floaty style={{ left: 140, top: 270 }} delay={1.2} amplitude={9}>
        <Coolshape type="moon" index={7} size={84} noise />
      </Floaty>
      <Floaty style={{ left: 360, top: 265 }} delay={0.4}>
        <Daisy size={92} petal="var(--g-violet-soft)" center="var(--g-amber)" />
      </Floaty>

      <Floaty style={{ left: 60, top: 210 }} delay={0.5}>
        <Sparkle size={26} color="var(--g-amber)" />
      </Floaty>
      <Floaty style={{ left: 300, top: 190 }} delay={1.6}>
        <Sparkle size={18} color="var(--g-stone)" />
      </Floaty>
      <Floaty style={{ left: 30, top: 130 }} delay={2}>
        <Dot size={16} color="var(--g-sky)" />
      </Floaty>
      <Floaty style={{ left: 480, top: 300 }} delay={1.2}>
        <Dot size={13} color="var(--g-coral)" />
      </Floaty>
    </div>
  );
}

function RightCluster() {
  return (
    <div className="f-hero-cluster" style={{ right: 0 }}>
      <Floaty style={{ right: 50, top: 60 }} duration={6.2}>
        <PaleBlob size={124} color="var(--g-green-pale)" />
      </Floaty>
      <Floaty style={{ right: 260, top: 220 }} duration={7.2} delay={0.9}>
        <PaleBlob size={110} />
      </Floaty>

      <Floaty style={{ right: 320, top: 50 }} delay={0.3} amplitude={12}>
        <ShapeBuddy type="flower" index={3} size={150} mouth="wave" />
      </Floaty>
      <Floaty style={{ right: 140, top: 150 }} delay={0.7} amplitude={10}>
        <ShapeBuddy type="ellipse" index={6} size={104} mouth="open" />
      </Floaty>
      <Floaty style={{ right: 60, top: 280 }} delay={0.1} amplitude={9}>
        <Coolshape type="wheel" index={2} size={88} noise />
      </Floaty>
      <Floaty style={{ right: 340, top: 270 }} delay={1.4}>
        <Daisy size={82} petal="var(--g-amber)" center="var(--g-coral)" />
      </Floaty>

      <Floaty style={{ right: 250, top: 120 }} delay={0.5}>
        <Sparkle size={24} color="var(--g-amber)" />
      </Floaty>
      <Floaty style={{ right: 30, top: 190 }} delay={1.8}>
        <Sparkle size={18} color="var(--g-stone)" />
      </Floaty>
      <Floaty style={{ right: 470, top: 200 }} delay={1.1}>
        <Sparkle size={20} color="var(--g-green-soft)" />
      </Floaty>
      <Floaty style={{ right: 210, top: 330 }} delay={0.6}>
        <Dot size={15} color="var(--g-green)" />
      </Floaty>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function AnimatedWord({
  word,
  index,
  gradient,
}: {
  word: string;
  index: number;
  gradient?: boolean;
}) {
  return (
    <motion.span
      className={gradient ? "f-gradient-word" : undefined}
      style={{ display: "inline-block", whiteSpace: "pre" }}
      initial={{ opacity: 0, y: "58%", rotate: 3 }}
      animate={{ opacity: 1, y: "0%", rotate: 0 }}
      transition={{
        ...springSmooth,
        duration: 0.8,
        delay: 0.06 + index * 0.09,
      }}
    >
      {word}
    </motion.span>
  );
}

export function Hero() {
  return (
    <section id="top" style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          textAlign: "center",
          padding: "4.6rem 1rem 2.4rem",
          position: "relative",
          zIndex: 3,
        }}
      >
        <h1 className="f-h1" style={{ overflow: "hidden", paddingBottom: 10 }}>
          <AnimatedWord word="Your desire to" index={0} />
          <br />
          <AnimatedWord word="productivity " index={1} gradient />
          <AnimatedWord word="ends here." index={2} />
        </h1>
        <motion.p
          className="f-lede"
          style={{ maxWidth: 400, margin: "0.7rem auto 0" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSmooth, delay: 0.42 }}
        >
          Voice-first AI powered productivity system for your daily life. Say it
          once — it's handled.
        </motion.p>
        <motion.div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.8rem",
            flexWrap: "wrap",
            paddingTop: "1.9rem",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSmooth, delay: 0.54 }}
        >
          <PillButton variant="dark" href="/app/talk">
            <MicIcon size={16} /> Start for free
          </PillButton>
          <PillButton variant="beige" href="/waitlist">
            Join the waitlist
          </PillButton>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{
            margin: "0.9rem 0 0",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--body-muted)",
          }}
        >
          Free tier · No credit card required
        </motion.p>
      </div>

      {/* playful illustration strip */}
      <motion.div
        className="f-hero-strip"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSmooth, duration: 0.9, delay: 0.3 }}
      >
        <LeftCluster />
        <RightCluster />
      </motion.div>

      <style>{`
        .redef .f-hero-strip {
          position: relative;
          height: 440px;
          margin-top: -190px;
          pointer-events: none;
          z-index: 1;
        }
        .redef .f-hero-cluster {
          position: absolute;
          top: 140px;
          width: 620px;
          height: 300px;
        }
        @media (max-width: 1350px) {
          .redef .f-hero-cluster { transform: scale(0.82); transform-origin: top; width: 540px; }
          .redef .f-hero-strip { height: 390px; }
        }
        @media (max-width: 1080px) {
          .redef .f-hero-cluster { transform: scale(0.62); width: 420px; }
          .redef .f-hero-strip { height: 300px; margin-top: -130px; }
        }
        @media (max-width: 780px) {
          .redef .f-hero-strip { height: 250px; margin-top: 0; }
          .redef .f-hero-cluster { top: 0; transform: scale(0.5); transform-origin: top left; }
          .redef .f-hero-cluster:last-child { transform-origin: top right; }
        }
        @media (prefers-reduced-motion: reduce) {
          .redef .f-hero-strip * { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
