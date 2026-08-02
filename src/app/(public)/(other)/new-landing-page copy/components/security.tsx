"use client";

import { motion } from "motion/react";
import { Container, Eyebrow, Reveal, Sparkle, TickList } from "./shared";

/* Cute fluffy guardian character sitting on clouds */
function GuardianIllustration() {
  return (
    <div style={{ position: "relative", maxWidth: 460, margin: "0 auto", padding: "2.5rem 0 1rem" }}>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 5, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 440 400" fill="none" style={{ width: "100%", height: "auto", display: "block" }}>
          <title>Family security guardian</title>
          {/* petals */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <circle
                key={`petal-${a}`}
                cx={220 + Math.cos(a) * 92}
                cy={165 + Math.sin(a) * 92}
                r={54}
                fill="var(--graphic-blue)"
              />
            );
          })}
          <circle cx={220} cy={165} r={108} fill="var(--graphic-blue)" />
          {/* face card */}
          <rect x={142} y={102} width={156} height={128} rx={26} fill="var(--graphic-blue-alt)" />
          {/* closed happy eyes */}
          <path d="M182 158 q8 12 20 0" stroke="var(--graphic-black)" strokeWidth={8} strokeLinecap="round" fill="none" />
          <path d="M238 158 q8 12 20 0" stroke="var(--graphic-black)" strokeWidth={8} strokeLinecap="round" fill="none" />
          {/* smile */}
          <path d="M204 188 q16 14 32 0" stroke="var(--graphic-black)" strokeWidth={8} strokeLinecap="round" fill="none" />
          {/* little arms */}
          <path d="M120 232 q-24 18 -38 8" stroke="var(--graphic-black)" strokeWidth={13} strokeLinecap="round" fill="none" />
          <path d="M320 232 q24 18 38 8" stroke="var(--graphic-black)" strokeWidth={13} strokeLinecap="round" fill="none" />
          {/* clouds it rests on */}
          <ellipse cx={150} cy={318} rx={62} ry={26} fill="var(--graphic-black)" opacity={0.9} />
          <ellipse cx={252} cy={330} rx={78} ry={30} fill="#585858" />
          <ellipse cx={340} cy={316} rx={48} ry={22} fill="var(--graphic-black)" opacity={0.9} />
          <ellipse cx={228} cy={352} rx={165} ry={16} fill="var(--graphic-blue)" opacity={0.35} />
        </svg>
      </motion.div>

      {/* twinkling accents */}
      {(
        [
          { left: "4%", top: "18%", size: 26, delay: 0 },
          { right: "8%", top: "10%", size: 20, delay: 0.7 },
          { right: "0%", top: "42%", size: 26, delay: 1.3 },
          { left: "10%", top: "58%", size: 18, delay: 1.9 },
        ] as { left?: string; right?: string; top: string; size: number; delay: number }[]
      ).map((s) => (
        <motion.span
          key={`${s.left ?? s.right}-${s.top}`}
          style={{ position: "absolute", left: s.left, right: s.right, top: s.top }}
          animate={{ scale: [1, 1.35, 1], rotate: [0, 18, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.4, delay: s.delay, ease: "easeInOut" }}
        >
          <Sparkle size={s.size} color="var(--graphic-blue)" />
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
          <GuardianIllustration />
        </Reveal>
        <Reveal style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
          <Eyebrow color="var(--blue)">Secure</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h1 className="f-h2">
              Relentless protection. <span className="f-dim">Restful ease.</span>
            </h1>
            <p className="f-lede" style={{ maxWidth: 460 }}>
              Family is fully self-custodial, meaning only you have access to your wallet and its private keys. We have
              no control over your crypto, nor do we want any.
            </p>
          </div>
          <div style={{ paddingTop: "0.5rem" }}>
            <TickList
              items={["Self-Custody", "Own Your Keys", "No Name Required", "No Lock-In", "Fully Audited"]}
              color="var(--blue)"
              columns={2}
            />
          </div>
        </Reveal>
        <style>{`
          .family .f-security {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
          }
          @media (max-width: 900px) {
            .family .f-security { grid-template-columns: 1fr; gap: 2rem; }
            .family .f-security-illo { order: 2; }
          }
        `}</style>
      </section>
    </Container>
  );
}
