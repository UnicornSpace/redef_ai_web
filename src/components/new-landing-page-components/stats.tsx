"use client";

import { Coolshape } from "coolshapes-react";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Container, Reveal } from "./shared";

/* Spring-ish count up that starts when visible */
function CountUp({
  to,
  suffix = "",
  prefix = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3.2; // fast start, gentle settle
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

const stats: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  shape: {
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
  };
}[] = [
  {
    value: 5,
    suffix: "+",
    label: "apps replaced by one voice",
    shape: { type: "star", index: 6 },
  },
  {
    value: 2,
    suffix: "h",
    label: "reclaimed every single day",
    shape: { type: "moon", index: 3 },
  },
  {
    value: 90,
    suffix: "%",
    label: "less manual data entry",
    shape: { type: "flower", index: 12 },
  },
  {
    value: 1,
    label: "brain for your whole day",
    shape: { type: "wheel", index: 0 },
  },
];

export function StatsSection() {
  return (
    <Container>
      <section style={{ padding: "5.5rem 0" }}>
        <Reveal>
          <h2
            className="f-h2"
            style={{ maxWidth: 520, paddingBottom: "2.4rem" }}
          >
            Numbers that <span className="f-dim">speak.</span>
          </h2>
        </Reveal>
        <div className="f-stats-grid">
          {stats.map((stat, i) => (
            <Reveal
              key={stat.label}
              delay={i * 0.08}
              className="f-panel"
              style={{
                padding: "1.9rem 1.8rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.9rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -18,
                  top: -18,
                  opacity: 0.9,
                }}
              >
                <Coolshape
                  type={stat.shape.type}
                  index={stat.shape.index}
                  size={74}
                  noise
                />
              </div>
              <span
                style={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  letterSpacing: "-0.045em",
                  lineHeight: 1,
                  color: "var(--ink)",
                }}
              >
                <CountUp
                  to={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                />
              </span>
              <p className="f-body" style={{ maxWidth: 180, fontWeight: 650 }}>
                {stat.label}
              </p>
            </Reveal>
          ))}
        </div>
        <style>{`
          .redef .f-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.25rem;
          }
          @media (max-width: 980px) {
            .redef .f-stats-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 560px) {
            .redef .f-stats-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </section>
    </Container>
  );
}
