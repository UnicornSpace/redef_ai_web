"use client";

import type { ReactNode } from "react";
import { Container, Reveal } from "./shared";

/* ------------------------------------------------------------------ */
/* Panel shell                                                         */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  blurb,
  children,
  span = false,
}: {
  title: string;
  blurb: ReactNode;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <Reveal
      className="f-panel f-explore-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "0.25rem",
        gridColumn: span ? "1 / -1" : undefined,
        minHeight: 330,
      }}
    >
      <div style={{ pointerEvents: "none", userSelect: "none", flex: 1, display: "flex", alignItems: "center" }}>
        {children}
      </div>
      <div style={{ padding: "0 1.9rem 1.7rem", display: "flex", flexDirection: "column", gap: 5 }}>
        <h5 className="f-panel-title" style={{ fontSize: "1.1rem" }}>
          {title}
        </h5>
        <p className="f-body" style={{ color: "rgba(71,70,69,0.7)", maxWidth: 320 }}>
          {blurb}
        </p>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* "Easy" — dark action sheet                                          */
/* ------------------------------------------------------------------ */

type EasyRow = {
  label: string;
  desc: string;
  color: string;
  highlight: boolean;
  badge?: string;
  icon: ReactNode;
};

const easyRows: EasyRow[] = [
  {
    label: "Send",
    desc: "Send tokens or collectibles to any address or ENS username.",
    color: "var(--app-blue)",
    highlight: false,
    icon: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path
          d="M10.07 4.54C10.25 4.04 9.77 3.55 9.26 3.73L3.54 5.73C3 5.93 2.96 6.68 3.49 6.92L5.16 7.66L7.34 6.27C7.55 6.12 7.8 6.38 7.65 6.58L6.27 8.44L6.89 10.32C7.12 10.84 7.88 10.81 8.07 10.27L10.07 4.54Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    label: "Swap",
    desc: "Swap your tokens without ever leaving your wallet.",
    color: "var(--app-gray)",
    highlight: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M4 8h13m0 0-3.2-3.2M17 8l-3.2 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 16H7m0 0 3.2-3.2M7 16l3.2 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Receive",
    desc: "Receive Ethereum based assets through your unique address.",
    color: "var(--app-green)",
    highlight: false,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 19" fill="none">
        <path d="M8 2v13m0 0 5-5m-5 5-5-5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Purchase",
    desc: "Purchase crypto instantly through your bank account.",
    color: "var(--app-pink)",
    highlight: false,
    badge: "ID Required",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M17 6.5c-.8-1.4-2.7-2.2-5-2.2-2.6 0-4.5 1.3-4.5 3.4 0 4.7 9.8 2.2 9.8 6.9 0 2.2-2 3.5-4.9 3.5-2.5 0-4.6-1-5.4-2.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

function EasyGraphic() {
  return (
    <div style={{ width: "100%", margin: "1.6rem 0 1rem 1.6rem" }}>
      <div
        style={{
          background: "#0d0d0d",
          borderRadius: "24px 0 0 24px",
          padding: "5px 0 5px 5px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          boxShadow: "0 0 24px rgba(0,0,0,0.15)",
          overflow: "hidden",
          width: "112%",
        }}
      >
        {easyRows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "13px 16px",
              borderRadius: "19px 0 0 19px",
              background: row.highlight ? "rgba(255,255,255,0.09)" : "transparent",
              border: "1px solid",
              borderRight: 0,
              borderColor: row.highlight ? "rgba(255,255,255,0.1)" : "transparent",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                borderRadius: "50%",
                background: row.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {row.icon}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.98rem", letterSpacing: "-0.02em" }}>
                  {row.label}
                </span>
                {row.badge ? (
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 600,
                      color: "#959697",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 99,
                      padding: "2px 8px",
                    }}
                  >
                    {row.badge}
                  </span>
                ) : null}
              </span>
              <span
                style={{
                  color: "#999",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {row.desc}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Secure" — backing up pill                                          */
/* ------------------------------------------------------------------ */

function SecureGraphic() {
  return (
    <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
      <div
        style={{
          border: "3px solid rgba(50,176,107,0.16)",
          borderRadius: 999,
          padding: 9,
        }}
      >
        <div style={{ border: "3px solid rgba(50,176,107,0.4)", borderRadius: 999, padding: 7 }}>
          <div
            style={{
              background: "var(--graphic-green)",
              borderRadius: 999,
              padding: "0.85rem 1.9rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              className="f-spinner"
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.4)",
                borderTopColor: "#fff",
                display: "block",
              }}
            />
            <span style={{ color: "#fff", fontWeight: 650, fontSize: "1.24rem", letterSpacing: "-0.02em" }}>
              Backing Up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Fast" — transaction timeline card                                  */
/* ------------------------------------------------------------------ */

function FastGraphic() {
  return (
    <div style={{ width: "100%", padding: "1.6rem 0 0.6rem 1.9rem" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.05)",
          borderRadius: 15,
          padding: "1.15rem 1.2rem",
          width: "108%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {[
          { label: "Submitted", meta: "Jul 20 2026 · 14:47", state: "done" },
          { label: "Pending", meta: "~ 30 Secs", state: "active" },
          { label: "Completed", meta: "", state: "todo" },
        ].map((row, i, arr) => (
          <div key={row.label} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: row.state === "todo" ? "#c1cad2" : "var(--app-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {row.state === "done" ? (
                  <svg width="9" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4.2 3.6 6.8 9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : row.state === "active" ? (
                  <span
                    className="f-spinner"
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "#fff",
                      display: "block",
                    }}
                  />
                ) : (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
                )}
              </span>
              {i < arr.length - 1 ? (
                <span
                  style={{
                    width: 3,
                    flex: 1,
                    minHeight: 22,
                    borderRadius: 2,
                    margin: "3px 0",
                    background: row.state === "done" ? "var(--app-blue)" : "#dde3e8",
                  }}
                />
              ) : null}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flex: 1, paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
              <span
                style={{
                  fontWeight: 620,
                  fontSize: "0.95rem",
                  letterSpacing: "-0.015em",
                  color: row.state === "todo" ? "#c1cad2" : "var(--app-blue)",
                }}
              >
                {row.label}
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "rgba(0,0,0,0.35)" }}>{row.meta}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Powerful" — network fee card                                       */
/* ------------------------------------------------------------------ */

function PowerfulGraphic() {
  return (
    <div style={{ width: "100%", padding: "1.6rem 1.9rem 0.6rem 0", display: "flex", justifyContent: "flex-end" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.05)",
          borderRadius: 15,
          padding: "1.05rem 1.2rem",
          width: "104%",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 650, fontSize: "1rem", letterSpacing: "-0.02em", color: "#222" }}>
              Network Fee
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "rgba(0,0,0,0.4)" }}>~ 30 Secs</span>
          </div>
          <div style={{ height: 1, background: "#f3f4f7" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 650, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--app-blue)" }}>
              Speed Up
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 550, color: "var(--app-green)" }}>Fast · ~ 12 Secs</span>
          </div>
          <div style={{ height: 1, background: "#f3f4f7" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 650, fontSize: "1rem", letterSpacing: "-0.02em", color: "#c1cad2" }}>
              Completed
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#c1cad2" }}>1000 USDC</span>
          </div>
        </div>
        {/* speed selector pill */}
        <div
          style={{
            border: "1.5px solid rgba(0,0,0,0.06)",
            borderRadius: 999,
            padding: "9px 7px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--app-blue)" }} />
          <svg width="13" height="15" viewBox="0 0 12 14" fill="none">
            <path
              d="M7 .9c.3.1.5.3.5.6V5h3c.3 0 .5.1.7.4.1.2.1.5-.1.7L5.9 12.8c-.2.2-.5.3-.8.2-.3-.1-.5-.3-.5-.6V9h-3c-.3 0-.5-.1-.7-.4-.1-.2-.1-.5.1-.7L6.2 1.1c.2-.2.5-.3.8-.2Z"
              fill="var(--yellow)"
            />
          </svg>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--red)" }} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Fun" — emoji marquee                                               */
/* ------------------------------------------------------------------ */

const emojiCells: { img: number; bg: string; big?: boolean }[] = [
  { img: 1, bg: "var(--purple)" },
  { img: 2, bg: "var(--app-green)", big: true },
  { img: 3, bg: "var(--app-blue)" },
  { img: 4, bg: "var(--app-blue)" },
  { img: 5, bg: "var(--red)" },
  { img: 6, bg: "var(--yellow)" },
  { img: 7, bg: "#f97316" },
  { img: 8, bg: "var(--app-pink)" },
  { img: 9, bg: "var(--app-blue)" },
];

function FunGraphic() {
  const cells = [...emojiCells, ...emojiCells, ...emojiCells];
  return (
    <div className="f-marquee" style={{ width: "100%", padding: "2.4rem 0 1.4rem" }}>
      <div className="f-marquee-track" style={{ gap: "1.25rem", alignItems: "center", ["--f-marquee-duration" as string]: "36s" }}>
        {cells.map((cell, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static duplicated marquee list
            key={i}
            style={{
              width: 72,
              height: 72,
              minWidth: 72,
              borderRadius: "50%",
              background: cell.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: cell.big ? "scale(1.22)" : undefined,
              margin: cell.big ? "0 8px" : undefined,
            }}
          >
            <img
              src={`https://family.co/assets/home/emoji-${cell.img}.png`}
              width={cell.big ? 66 : 56}
              height={cell.big ? 66 : 56}
              alt=""
              style={{ display: "block" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function Explore() {
  return (
    <Container>
      <section id="explore" style={{ padding: "3.5rem 0 5.5rem" }}>
        <Reveal>
          <h1 className="f-h2" style={{ maxWidth: 620, paddingBottom: "2.4rem" }}>
            Explore Ethereum <span className="f-dim">in a whole new way.</span>
          </h1>
        </Reveal>
        <div className="f-explore-grid">
          <Panel title="Easy" blurb="Whether you’re a beginner or seasoned pro, Family makes it easy.">
            <EasyGraphic />
          </Panel>
          <Panel
            title="Secure"
            blurb={
              <>
                Your crypto, your control.
                <br />
                Security at every stage.
              </>
            }
          >
            <SecureGraphic />
          </Panel>
          <Panel
            title="Fast"
            blurb={
              <>
                Uncompromising speed.
                <br />
                Optimal performance, all the time.
              </>
            }
          >
            <FastGraphic />
          </Panel>
          <Panel
            title="Powerful"
            blurb={
              <>
                Experience the full power of
                <br />
                Ethereum with advanced features.
              </>
            }
          >
            <PowerfulGraphic />
          </Panel>
          <Panel
            span
            title="Fun"
            blurb={
              <>
                Family takes fun seriously.
                <br />
                Delightful interactions with every tap.
              </>
            }
          >
            <FunGraphic />
          </Panel>
        </div>
        <style>{`
          .family .f-explore-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
          }
          @media (max-width: 820px) {
            .family .f-explore-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </section>
    </Container>
  );
}
