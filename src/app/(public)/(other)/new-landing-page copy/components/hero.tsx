"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { AppleIcon, PlayIcon, PillButton, Sparkle } from "./shared";

/* ------------------------------------------------------------------ */
/* Floating wrapper for illustration bits                              */
/* ------------------------------------------------------------------ */

function Floaty({
  children,
  style,
  delay = 0,
  duration = 4.5,
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
      animate={{ y: [0, -amplitude, 0], rotate: [0, 1.4, 0] }}
      transition={{ repeat: Number.POSITIVE_INFINITY, duration, delay, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Illustration primitives                                             */
/* ------------------------------------------------------------------ */

function PaleBlob({ size = 124 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--graphic-yellow-pale)",
      }}
    />
  );
}

function Dot({ size = 22, color = "var(--graphic-blue)" }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", background: color }} />;
}

/* Fluffy flower-burst character with a face */
function FluffyChar({
  size = 150,
  color = "var(--graphic-blue)",
  faceColor = "var(--graphic-blue-alt)",
  petals = 9,
}: {
  size?: number;
  color?: string;
  faceColor?: string;
  petals?: number;
}) {
  const c = 60;
  const petalR = 26;
  const orbit = 34;
  const points = Array.from({ length: petals }, (_, i) => {
    const a = (i / petals) * Math.PI * 2;
    return { x: c + Math.cos(a) * orbit, y: c + Math.sin(a) * orbit };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {points.map((p) => (
        <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={petalR} fill={color} />
      ))}
      <circle cx={c} cy={c} r={38} fill={color} />
      <rect x={30} y={34} width={60} height={52} rx={14} fill={faceColor} />
      {/* eyes */}
      <ellipse cx={48} cy={58} rx={4.4} ry={5.4} fill="var(--graphic-black)" />
      <ellipse cx={72} cy={58} rx={4.4} ry={5.4} fill="var(--graphic-black)" />
      {/* smile */}
      <path
        d="M52 70 Q60 76 68 70"
        stroke="var(--graphic-black)"
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* Daisy flower */
function Flower({
  size = 96,
  petal = "var(--graphic-yellow)",
  center = "var(--graphic-orange)",
}: {
  size?: number;
  petal?: string;
  center?: string;
}) {
  const c = 50;
  const points = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { x: c + Math.cos(a) * 26, y: c + Math.sin(a) * 26 };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {points.map((p) => (
        <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={20} fill={petal} />
      ))}
      <circle cx={c} cy={c} r={15} fill={center} />
    </svg>
  );
}

/* Smiley coin */
function Coin({ size = 82 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 84 84" fill="none">
      <circle cx={42} cy={42} r={40} fill="var(--graphic-yellow)" />
      <path
        d="M12 58 A40 40 0 0 0 76 50"
        stroke="var(--graphic-gold)"
        strokeWidth={9}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />
      <ellipse cx={33} cy={38} rx={4} ry={5} fill="var(--graphic-black)" />
      <ellipse cx={53} cy={38} rx={4} ry={5} fill="var(--graphic-black)" />
      <path d="M35 50 Q43 56 51 50" stroke="var(--graphic-black)" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <circle cx={58} cy={22} r={6} fill="#ffffff" opacity={0.35} />
    </svg>
  );
}

/* Happy cloud */
function Cloud({ size = 110, color = "var(--graphic-stone)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={(size * 60) / 110} viewBox="0 0 110 60" fill="none">
      <circle cx={30} cy={38} r={20} fill={color} />
      <circle cx={55} cy={28} r={25} fill={color} />
      <circle cx={82} cy={40} r={18} fill={color} />
      <rect x={16} y={38} width={80} height={20} rx={10} fill={color} />
      <ellipse cx={47} cy={36} rx={3.4} ry={4.4} fill="var(--graphic-black)" />
      <ellipse cx={65} cy={36} rx={3.4} ry={4.4} fill="var(--graphic-black)" />
      <path d="M50 45 Q56 50 62 45" stroke="var(--graphic-black)" strokeWidth={3} strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* Bumbling bee */
function Bee({ size = 78 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 60) / 90} viewBox="0 0 90 60" fill="none">
      <ellipse cx={30} cy={16} rx={12} ry={9} fill="var(--graphic-gray)" opacity={0.85} />
      <ellipse cx={50} cy={12} rx={12} ry={9} fill="var(--graphic-gray)" opacity={0.85} />
      <rect x={12} y={18} width={62} height={34} rx={17} fill="var(--graphic-yellow)" />
      <rect x={30} y={18} width={10} height={34} fill="var(--graphic-black)" opacity={0.85} />
      <rect x={50} y={18} width={10} height={34} fill="var(--graphic-black)" opacity={0.85} />
      <circle cx={68} cy={32} r={5} fill="var(--graphic-black)" />
      <path d="M74 35 Q80 38 84 34" stroke="var(--graphic-black)" strokeWidth={3} strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Left / right hero clusters                                          */
/* ------------------------------------------------------------------ */

function LeftCluster() {
  return (
    <div className="f-hero-cluster" style={{ left: 0 }}>
      <Floaty style={{ left: 30, top: 30 }} duration={6}>
        <PaleBlob size={128} />
      </Floaty>
      <Floaty style={{ left: 220, top: 190 }} duration={7} delay={0.6}>
        <PaleBlob size={120} />
      </Floaty>
      <Floaty style={{ left: 10, top: 250 }} duration={6.5} delay={1.1}>
        <PaleBlob size={110} />
      </Floaty>

      <Floaty style={{ left: 120, top: 60 }} delay={0.2} amplitude={10}>
        <Flower size={100} />
      </Floaty>
      <Floaty style={{ left: 330, top: 40 }} delay={0.8} amplitude={12}>
        <FluffyChar size={170} />
      </Floaty>
      <Floaty style={{ left: 350, top: 250 }} delay={0.4}>
        <Cloud size={112} />
      </Floaty>
      <Floaty style={{ left: 140, top: 260 }} delay={1.3} amplitude={9}>
        <Coin size={78} />
      </Floaty>

      <Floaty style={{ left: 60, top: 170 }} delay={0.5}>
        <Sparkle size={26} color="var(--graphic-yellow)" />
      </Floaty>
      <Floaty style={{ left: 290, top: 150 }} delay={1.6}>
        <Sparkle size={18} color="var(--graphic-stone)" />
      </Floaty>
      <Floaty style={{ left: 260, top: 330 }} delay={0.9}>
        <Sparkle size={22} color="var(--graphic-yellow)" />
      </Floaty>
      <Floaty style={{ left: 30, top: 120 }} delay={2}>
        <Dot size={18} color="var(--graphic-blue)" />
      </Floaty>
      <Floaty style={{ left: 470, top: 300 }} delay={1.2}>
        <Dot size={14} color="var(--graphic-orange)" />
      </Floaty>
    </div>
  );
}

function RightCluster() {
  return (
    <div className="f-hero-cluster" style={{ right: 0 }}>
      <Floaty style={{ right: 40, top: 60 }} duration={6.4}>
        <PaleBlob size={126} />
      </Floaty>
      <Floaty style={{ right: 250, top: 210 }} duration={7} delay={0.9}>
        <PaleBlob size={116} />
      </Floaty>

      <Floaty style={{ right: 330, top: 30 }} delay={0.3} amplitude={12}>
        <FluffyChar size={165} color="var(--graphic-orange)" faceColor="#ffb198" petals={8} />
      </Floaty>
      <Floaty style={{ right: 140, top: 160 }} delay={0.7} amplitude={10}>
        <Bee size={86} />
      </Floaty>
      <Floaty style={{ right: 60, top: 270 }} delay={0.1}>
        <Flower size={92} petal="var(--graphic-blue)" center="var(--graphic-yellow)" />
      </Floaty>
      <Floaty style={{ right: 320, top: 260 }} delay={1.4} amplitude={9}>
        <Coin size={72} />
      </Floaty>

      <Floaty style={{ right: 250, top: 120 }} delay={0.5}>
        <Sparkle size={24} color="var(--graphic-yellow)" />
      </Floaty>
      <Floaty style={{ right: 40, top: 200 }} delay={1.8}>
        <Sparkle size={18} color="var(--graphic-stone)" />
      </Floaty>
      <Floaty style={{ right: 470, top: 190 }} delay={1.1}>
        <Sparkle size={20} color="var(--graphic-yellow)" />
      </Floaty>
      <Floaty style={{ right: 200, top: 330 }} delay={0.6}>
        <Dot size={16} color="var(--graphic-green)" />
      </Floaty>
      <Floaty style={{ right: 420, top: 320 }} delay={1.9}>
        <Dot size={20} color="var(--graphic-blue)" />
      </Floaty>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const line1 = ["Your", "favorite"];
const line2 = ["crypto", "wallet."];

function AnimatedWord({ word, index }: { word: string; index: number }) {
  return (
    <motion.span
      style={{ display: "inline-block", whiteSpace: "pre" }}
      initial={{ opacity: 0, y: "60%", rotate: 4 }}
      animate={{ opacity: 1, y: "0%", rotate: 0 }}
      transition={{ duration: 0.75, delay: 0.08 + index * 0.09, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {word}
    </motion.span>
  );
}

export function Hero() {
  return (
    <section id="top" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ textAlign: "center", padding: "4.5rem 1rem 2.4rem", position: "relative", zIndex: 3 }}>
        <h1 className="f-h1" style={{ overflow: "hidden", paddingBottom: 10 }}>
          {line1.map((w, i) => (
            <AnimatedWord key={w} word={i < line1.length - 1 ? `${w} ` : w} index={i} />
          ))}
          <br />
          {line2.map((w, i) => (
            <AnimatedWord key={w} word={i < line2.length - 1 ? `${w} ` : w} index={i + line1.length} />
          ))}
        </h1>
        <motion.p
          className="f-lede"
          style={{ maxWidth: 420, margin: "0.55rem auto 0" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          Explore Ethereum with the best wallet for iOS. Interacting with crypto has never been so simple.
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
          transition={{ duration: 0.7, delay: 0.62 }}
        >
          <PillButton variant="dark" href="https://family.co/download">
            <AppleIcon /> Download on iOS
          </PillButton>
          <PillButton variant="beige">
            <PlayIcon size={14} /> Watch the Video
          </PillButton>
        </motion.div>
      </div>

      {/* playful illustration strip */}
      <motion.div
        className="f-hero-strip"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35 }}
      >
        <LeftCluster />
        <RightCluster />
      </motion.div>

      <style>{`
        .family .f-hero-strip {
          position: relative;
          height: 430px;
          margin-top: -170px;
          pointer-events: none;
          z-index: 1;
        }
        .family .f-hero-cluster {
          position: absolute;
          top: 130px;
          width: 620px;
          height: 300px;
        }
        @media (max-width: 1350px) {
          .family .f-hero-cluster { transform: scale(0.82); transform-origin: top; width: 540px; }
          .family .f-hero-strip { height: 380px; }
        }
        @media (max-width: 1080px) {
          .family .f-hero-cluster { transform: scale(0.62); width: 420px; }
          .family .f-hero-strip { height: 300px; margin-top: -120px; }
        }
        @media (max-width: 780px) {
          .family .f-hero-strip { height: 250px; margin-top: 0; }
          .family .f-hero-cluster { top: 0; transform: scale(0.5); transform-origin: top left; }
          .family .f-hero-cluster:last-child { transform-origin: top right; }
        }
      `}</style>
    </section>
  );
}
