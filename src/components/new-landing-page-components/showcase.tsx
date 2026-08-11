"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Container, Reveal, springSnappy } from "./shared";

/* ------------------------------------------------------------------ */
/* Product screenshot trio — "Say it. See it. Done."                   */
/* ------------------------------------------------------------------ */

function ShowcaseColumn({
  image,
  alt,
  color,
  label,
  icon,
  delay = 0,
}: {
  image: string;
  alt: string;
  color: string;
  label: string;
  icon: ReactNode;
  delay?: number;
}) {
  return (
    <Reveal
      delay={delay}
      style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
    >
      <motion.div
        className="f-panel"
        style={{ padding: "2rem 2rem 0", minHeight: 300 }}
        whileHover={{ y: -6 }}
        transition={springSnappy}
      >
        <div
          style={{
            borderRadius: "18px 18px 0 0",
            overflow: "hidden",
            boxShadow: "0 -8px 30px rgba(55,50,47,0.1)",
            border: "1px solid rgba(55,50,47,0.07)",
            borderBottom: 0,
            lineHeight: 0,
            background: "#fff",
          }}
        >
          <img
            src={image}
            alt={alt}
            style={{
              width: "100%",
              aspectRatio: "4 / 3",
              objectFit: "cover",
              objectPosition: "top center",
              display: "block",
            }}
          />
        </div>
      </motion.div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 5,
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          {icon}
        </span>
        <p className="f-panel-title">{label}</p>
      </div>
    </Reveal>
  );
}

export function Showcase() {
  return (
    <Container>
      <section style={{ padding: "5.5rem 0" }}>
        <Reveal>
          <h2
            className="f-h2"
            style={{ maxWidth: 560, paddingBottom: "2.4rem" }}
          >
            Say it. See it. <span className="f-dim">Done.</span>
          </h2>
        </Reveal>
        <div className="f-showcase-grid">
          <ShowcaseColumn
            image="/images/calendar.png"
            alt="Redef AI calendar view"
            color="var(--rf-sky)"
            label="Calendar"
            icon={
              <svg
                aria-hidden="true"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect
                  x="3.5"
                  y="5"
                  width="17"
                  height="15.5"
                  rx="3"
                  stroke="#fff"
                  strokeWidth="2.6"
                />
                <path d="M3.5 10h17" stroke="#fff" strokeWidth="2.6" />
              </svg>
            }
          />
          <ShowcaseColumn
            image="/images/tasks.png"
            alt="Redef AI tasks view"
            color="var(--rf-green)"
            label="Tasks"
            delay={0.08}
            icon={
              <svg
                aria-hidden="true"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 13.5 9 18.5 20 6"
                  stroke="#fff"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <ShowcaseColumn
            image="/images/calendar_with_clouds.png"
            alt="Redef AI planning view"
            color="var(--rf-violet)"
            label="Your Day"
            delay={0.16}
            icon={
              <svg
                aria-hidden="true"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  stroke="#fff"
                  strokeWidth="2.6"
                />
                <path
                  d="M12 8v4.5l3 2"
                  stroke="#fff"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </div>
        <style>{`
          .redef .f-showcase-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.25rem;
            align-items: stretch;
          }
          @media (max-width: 900px) {
            .redef .f-showcase-grid { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; }
          }
        `}</style>
      </section>
    </Container>
  );
}
