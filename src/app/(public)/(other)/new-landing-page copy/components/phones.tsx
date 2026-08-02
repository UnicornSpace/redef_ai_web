"use client";

import type { ReactNode } from "react";
import { Container, PhonePanel, Reveal } from "./shared";

/* ------------------------------------------------------------------ */
/* Shared trio column                                                  */
/* ------------------------------------------------------------------ */

function TrioColumn({
  screen,
  crop,
  color,
  label,
  icon,
  iconShape = "circle",
  delay = 0,
}: {
  screen: string;
  crop: "top" | "bottom";
  color: string;
  label: string;
  icon: ReactNode;
  iconShape?: "circle" | "square";
  delay?: number;
}) {
  return (
    <Reveal
      delay={delay}
      style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "1.15rem" }}
    >
      <PhonePanel screen={screen} crop={crop} phoneWidth={272} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
        <span
          style={{
            width: iconShape === "circle" ? 15 : 16,
            height: iconShape === "circle" ? 15 : 16,
            borderRadius: iconShape === "circle" ? "50%" : 4,
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </span>
        <p className="f-panel-title">{label}</p>
      </div>
    </Reveal>
  );
}

function TrioGrid({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="f-trio-grid">{children}</div>
      <style>{`
        .family .f-trio-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) {
          .family .f-trio-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
        }
      `}</style>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Send, receive, swap.                                                */
/* ------------------------------------------------------------------ */

export function SendReceiveSwap() {
  return (
    <Container>
      <section style={{ padding: "5.5rem 0" }}>
        <Reveal>
          <h1 className="f-h2" style={{ maxWidth: 560, paddingBottom: "2.4rem" }}>
            Send, receive, swap. <span className="f-dim">All in one place.</span>
          </h1>
        </Reveal>
        <TrioGrid>
          <TrioColumn
            screen="https://family.co/videos/send.png"
            crop="bottom"
            color="var(--app-blue)"
            label="Send"
            icon={
              <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                <path
                  d="M10.07 4.54C10.25 4.04 9.77 3.55 9.26 3.73L3.54 5.73C3 5.93 2.96 6.68 3.49 6.92L5.16 7.66L7.34 6.27C7.55 6.12 7.8 6.38 7.65 6.58L6.27 8.44L6.89 10.32C7.12 10.84 7.88 10.81 8.07 10.27L10.07 4.54Z"
                  fill="#fff"
                  transform="translate(-1.5 -1.5) scale(1.25)"
                />
              </svg>
            }
          />
          <TrioColumn
            screen="https://family.co/videos/receive.png"
            crop="top"
            color="var(--app-green)"
            label="Receive"
            delay={0.08}
            icon={
              <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                <path d="M7 3.9v5.7m0 0 2.2-2.2M7 9.6 4.9 7.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <TrioColumn
            screen="https://family.co/videos/swap.png"
            crop="bottom"
            color="var(--gray)"
            label="Swap"
            delay={0.16}
            icon={
              <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                <path d="M3.5 5h6m0 0L7.7 3.2M9.5 5 7.7 6.8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.5 9h-6m0 0 1.8-1.8M4.5 9l1.8 1.8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        </TrioGrid>
      </section>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/* Effortless onboarding.                                              */
/* ------------------------------------------------------------------ */

export function Onboarding() {
  return (
    <Container>
      <section style={{ padding: "5.5rem 0" }}>
        <Reveal>
          <h1 className="f-h2" style={{ maxWidth: 620, paddingBottom: "2.4rem" }}>
            <span className="f-dim">Effortless onboarding.</span> Masterful management.
          </h1>
        </Reveal>
        <TrioGrid>
          <TrioColumn
            screen="https://family.co/videos/onboarding.png"
            crop="bottom"
            color="var(--app-green)"
            label="Onboarding"
            iconShape="square"
            icon={
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M4.47 0.6c.22-.42.84-.42 1.06 0l1.04 1.98c.09.16.25.28.43.31l2.2.38c.48.08.67.66.33 1.01L8 5.89c-.13.13-.19.32-.16.5l.32 2.21c.07.48-.43.84-.86.63L5.26 8.24a.62.62 0 0 0-.53 0L2.73 9.23c-.43.21-.93-.15-.86-.63l.32-2.21a.62.62 0 0 0-.16-.5L.47 4.29c-.34-.35-.15-.93.33-1.01l2.2-.38c.18-.03.34-.15.43-.31L4.47.6Z"
                  fill="#fff"
                />
              </svg>
            }
          />
          <TrioColumn
            screen="https://family.co/videos/missioncontrol.png"
            crop="bottom"
            color="var(--yellow)"
            label="Mission Control"
            iconShape="square"
            delay={0.08}
            icon={
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="0.2" width="4.4" height="2.8" rx="0.8" fill="#fff" />
                <rect x="5.4" width="4.4" height="2.8" rx="0.8" fill="#fff" />
                <rect x="0.2" y="3.6" width="4.4" height="2.8" rx="0.8" fill="#fff" />
                <rect x="5.4" y="3.6" width="4.4" height="2.8" rx="0.8" fill="#fff" />
                <rect x="0.2" y="7.2" width="4.4" height="2.8" rx="0.8" fill="#fff" />
              </svg>
            }
          />
          <TrioColumn
            screen="https://family.co/videos/dragdropdone.png"
            crop="bottom"
            color="var(--orange)"
            label="Drag and Drop"
            iconShape="square"
            delay={0.16}
            icon={
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <rect x="2" y="4.8" width="8" height="4.8" rx="1.2" fill="#fff" stroke="var(--orange)" strokeWidth="0.8" />
                <rect x="1.2" y="2.8" width="9.6" height="4.8" rx="1.2" fill="#fff" stroke="var(--orange)" strokeWidth="0.8" />
                <rect x="0.4" y="0.8" width="11.2" height="4.8" rx="1.2" fill="#fff" stroke="var(--orange)" strokeWidth="0.8" />
              </svg>
            }
          />
        </TrioGrid>
      </section>
    </Container>
  );
}
