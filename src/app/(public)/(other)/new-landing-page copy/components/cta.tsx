"use client";

import { motion } from "motion/react";
import { ArrowIcon, Container, Reveal, Sparkle } from "./shared";

/* Playful green-hill illustration for the closing call to action */
function CtaIllustration() {
  return (
    <div style={{ position: "relative", maxWidth: 500, margin: "0 auto" }}>
      <svg viewBox="0 0 500 200" fill="none" style={{ width: "100%", height: "auto", display: "block" }}>
        <title>Explore Family</title>
        {/* ground */}
        <ellipse cx={310} cy={168} rx={175} ry={26} fill="var(--graphic-green)" />
        <ellipse cx={95} cy={172} rx={80} ry={16} fill="var(--graphic-green)" opacity={0.55} />

        {/* small cloud puff on the left */}
        <g>
          <circle cx={70} cy={140} r={20} fill="#ffffff" />
          <circle cx={95} cy={132} r={25} fill="#ffffff" />
          <circle cx={120} cy={142} r={18} fill="#ffffff" />
          <rect x={56} y={140} width={78} height={20} rx={10} fill="#ffffff" />
          <ellipse cx={88} cy={139} rx={3.2} ry={4.2} fill="var(--graphic-black)" />
          <ellipse cx={104} cy={139} rx={3.2} ry={4.2} fill="var(--graphic-black)" />
          <path d="M90 148 q6 5 12 0" stroke="var(--graphic-black)" strokeWidth={2.8} strokeLinecap="round" fill="none" />
        </g>

        {/* blue fluffy friend */}
        <g>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return (
              <circle
                key={`cta-petal-${a}`}
                cx={385 + Math.cos(a) * 34}
                cy={110 + Math.sin(a) * 34}
                r={20}
                fill="var(--graphic-blue)"
              />
            );
          })}
          <circle cx={385} cy={110} r={40} fill="var(--graphic-blue)" />
          <rect x={355} y={86} width={60} height={50} rx={13} fill="var(--graphic-blue-alt)" />
          <ellipse cx={373} cy={108} rx={4} ry={5} fill="var(--graphic-black)" />
          <ellipse cx={397} cy={108} rx={4} ry={5} fill="var(--graphic-black)" />
          <path d="M377 120 q8 7 16 0" stroke="var(--graphic-black)" strokeWidth={3.2} strokeLinecap="round" fill="none" />
        </g>

        {/* chick friend on the hill */}
        <g>
          <rect x={230} y={96} width={78} height={62} rx={24} fill="var(--graphic-yellow)" />
          <circle cx={292} cy={122} r={17} fill="#ffe5b6" />
          <ellipse cx={288} cy={122} rx={3.4} ry={4.2} fill="var(--graphic-black)" />
          <ellipse cx={302} cy={120} rx={3.4} ry={4.2} fill="var(--graphic-black)" />
          <path d="M240 96 q-6 -14 8 -12" stroke="var(--graphic-yellow)" strokeWidth={8} strokeLinecap="round" fill="none" />
          <path d="M236 132 q-12 4 -10 14" stroke="var(--graphic-orange)" strokeWidth={7} strokeLinecap="round" fill="none" />
        </g>

        {/* daisy */}
        <g>
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={`cta-daisy-${a}`}
                cx={168 + Math.cos(a) * 17}
                cy={112 + Math.sin(a) * 17}
                r={13}
                fill="var(--graphic-yellow)"
              />
            );
          })}
          <circle cx={168} cy={112} r={10} fill="var(--graphic-orange)" />
          <path d="M168 132 v 26" stroke="var(--graphic-green)" strokeWidth={7} strokeLinecap="round" />
        </g>
      </svg>

      {(
        [
          { left: "6%", top: "8%", size: 22, delay: 0.2 },
          { right: "4%", top: "18%", size: 18, delay: 1.1 },
          { left: "42%", top: "0%", size: 16, delay: 1.7 },
        ] as { left?: string; right?: string; top: string; size: number; delay: number }[]
      ).map((s) => (
        <motion.span
          key={`${s.left ?? s.right}-${s.top}`}
          style={{ position: "absolute", left: s.left, right: s.right, top: s.top }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.65, 1, 0.65] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, delay: s.delay, ease: "easeInOut" }}
        >
          <Sparkle size={s.size} color="var(--graphic-yellow)" />
        </motion.span>
      ))}
    </div>
  );
}

export function CtaSection() {
  return (
    <section style={{ background: "#e9f6ee", padding: "4.5rem 0 5rem", marginTop: "1rem" }}>
      <Container>
        <div className="f-cta-grid">
          <Reveal delay={0.08}>
            <CtaIllustration />
          </Reveal>
          <Reveal style={{ display: "flex", flexDirection: "column", gap: "1.6rem", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <h1 className="f-h2">Explore Family</h1>
              <p className="f-lede" style={{ maxWidth: 440 }}>
                Family is a beautiful self-custody Ethereum wallet designed to make crypto easy for everyone.
              </p>
            </div>
            <div>
              <a href="https://family.co/download" target="_blank" rel="noopener noreferrer" className="f-btn f-btn-white">
                Download for iOS <ArrowIcon size={15} />
              </a>
            </div>
          </Reveal>
        </div>
        <style>{`
          .family .f-cta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            align-items: center;
          }
          @media (max-width: 860px) {
            .family .f-cta-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </Container>
    </section>
  );
}
