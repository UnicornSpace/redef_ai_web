"use client";

import { Coolshape } from "coolshapes-react";
import type { ReactNode } from "react";
import { Container, MicIcon, Reveal } from "./shared";

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
      className="f-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "0.25rem",
        gridColumn: span ? "1 / -1" : undefined,
        minHeight: 330,
      }}
    >
      <div
        style={{
          pointerEvents: "none",
          userSelect: "none",
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        {children}
      </div>
      <div
        style={{
          padding: "0 1.9rem 1.7rem",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <h5 className="f-panel-title" style={{ fontSize: "1.12rem" }}>
          {title}
        </h5>
        <p
          className="f-body"
          style={{ color: "rgba(74,68,63,0.72)", maxWidth: 330 }}
        >
          {blurb}
        </p>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* "Spoken" — dark voice command sheet                                 */
/* ------------------------------------------------------------------ */

type CommandRow = {
  label: string;
  desc: string;
  color: string;
  highlight: boolean;
  icon: ReactNode;
};

const commandRows: CommandRow[] = [
  {
    label: "Capture",
    desc: "“Remind me to send the deck tomorrow at 9.”",
    color: "var(--rf-green)",
    highlight: false,
    icon: <MicIcon size={15} />,
  },
  {
    label: "Schedule",
    desc: "“Move my standup to after lunch.”",
    color: "var(--rf-sky)",
    highlight: true,
    icon: (
      <svg
        aria-hidden="true"
        width="15"
        height="15"
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
          strokeWidth="2.1"
        />
        <path
          d="M3.5 10h17M8 2.8v4M16 2.8v4"
          stroke="#fff"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Track",
    desc: "“Log my workout — day twelve done.”",
    color: "var(--rf-amber)",
    highlight: false,
    icon: (
      <svg
        aria-hidden="true"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4 13.5 9 18.5 20 6"
          stroke="#fff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Focus",
    desc: "“Block two hours of deep work this afternoon.”",
    color: "var(--rf-violet)",
    highlight: false,
    icon: (
      <svg
        aria-hidden="true"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="13" r="8" stroke="#fff" strokeWidth="2.2" />
        <path
          d="M12 13V9M12 2.5h0M9.5 2.5h5"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function SpokenGraphic() {
  return (
    <div style={{ width: "100%", margin: "1.6rem 0 1rem 1.6rem" }}>
      <div
        style={{
          background: "#171412",
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
        {commandRows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 16px",
              borderRadius: "19px 0 0 19px",
              background: row.highlight
                ? "rgba(255,255,255,0.09)"
                : "transparent",
              border: "1px solid",
              borderRight: 0,
              borderColor: row.highlight
                ? "rgba(255,255,255,0.1)"
                : "transparent",
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
                color: "#fff",
              }}
            >
              {row.icon}
            </span>
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.97rem",
                  letterSpacing: "-0.02em",
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  color: "#9a938d",
                  fontSize: "0.78rem",
                  fontWeight: 550,
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
/* "Private" — encrypting pill                                         */
/* ------------------------------------------------------------------ */

function PrivateGraphic() {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 0",
      }}
    >
      <div
        style={{
          border: "3px solid rgba(89,183,79,0.16)",
          borderRadius: 999,
          padding: 9,
        }}
      >
        <div
          style={{
            border: "3px solid rgba(89,183,79,0.4)",
            borderRadius: 999,
            padding: 7,
          }}
        >
          <div
            style={{
              background: "var(--rf-green)",
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
            <span
              style={{
                color: "#fff",
                fontWeight: 750,
                fontSize: "1.22rem",
                letterSpacing: "-0.02em",
              }}
            >
              Encrypting
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Instant" — heard → understood → done timeline                      */
/* ------------------------------------------------------------------ */

function InstantGraphic() {
  const rows = [
    { label: "Heard", meta: "0.2s", state: "done" },
    { label: "Understood", meta: "intent: schedule", state: "done" },
    { label: "Done", meta: "event created", state: "active" },
  ];
  return (
    <div style={{ width: "100%", padding: "1.6rem 0 0.6rem 1.9rem" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(55,50,47,0.05)",
          borderRadius: 15,
          padding: "1.15rem 1.2rem",
          width: "108%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {rows.map((row, i) => (
          <div key={row.label} style={{ display: "flex", gap: 14 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "var(--rf-green)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {row.state === "done" ? (
                  <svg
                    aria-hidden="true"
                    width="9"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                  >
                    <path
                      d="M1 4.2 3.6 6.8 9 1"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
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
                )}
              </span>
              {i < rows.length - 1 ? (
                <span
                  style={{
                    width: 3,
                    flex: 1,
                    minHeight: 22,
                    borderRadius: 2,
                    margin: "3px 0",
                    background: "var(--g-green-soft)",
                  }}
                />
              ) : null}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flex: 1,
                paddingBottom: i < rows.length - 1 ? 18 : 0,
              }}
            >
              <span
                style={{
                  fontWeight: 750,
                  fontSize: "0.95rem",
                  letterSpacing: "-0.015em",
                  color: "var(--rf-green-deep)",
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 550,
                  color: "rgba(55,50,47,0.35)",
                }}
              >
                {row.meta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Insightful" — weekly focus card                                    */
/* ------------------------------------------------------------------ */

function InsightfulGraphic() {
  const days = [
    { d: "M", v: 0.45 },
    { d: "T", v: 0.7 },
    { d: "W", v: 0.55 },
    { d: "T", v: 0.9 },
    { d: "F", v: 0.65 },
    { d: "S", v: 0.3 },
    { d: "S", v: 0.2 },
  ];
  return (
    <div
      style={{
        width: "100%",
        padding: "1.6rem 1.9rem 0.6rem 0",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(55,50,47,0.05)",
          borderRadius: 15,
          padding: "1.1rem 1.25rem",
          width: "104%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            paddingBottom: 12,
          }}
        >
          <span
            style={{
              fontWeight: 750,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            Deep work
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--rf-green-deep)",
            }}
          >
            +38% this week
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 9,
            height: 74,
          }}
        >
          {days.map((day, i) => (
            <div
              key={`${day.d}-${i}`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  width: "100%",
                  height: `${day.v * 100}%`,
                  borderRadius: 6,
                  background:
                    day.v > 0.8 ? "var(--rf-green)" : "var(--g-green-pale)",
                  border:
                    day.v > 0.8 ? "none" : "1px solid rgba(89,183,79,0.25)",
                }}
              />
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "rgba(55,50,47,0.35)",
                }}
              >
                {day.d}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Delightful" — coolshapes marquee                                   */
/* ------------------------------------------------------------------ */

const shapeCells: {
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
  big?: boolean;
}[] = [
  { type: "star", index: 0 },
  { type: "flower", index: 2, big: true },
  { type: "ellipse", index: 5 },
  { type: "moon", index: 9 },
  { type: "wheel", index: 4 },
  { type: "polygon", index: 3 },
  { type: "star", index: 11 },
  { type: "misc", index: 1 },
  { type: "triangle", index: 8 },
  { type: "flower", index: 7 },
];

function DelightfulGraphic() {
  const cells = [...shapeCells, ...shapeCells];
  return (
    <div
      className="f-marquee"
      style={{ width: "100%", padding: "2.3rem 0 1.3rem" }}
    >
      <div
        className="f-marquee-track"
        style={{
          gap: "1.4rem",
          alignItems: "center",
          ["--f-marquee-duration" as string]: "40s",
        }}
      >
        {cells.map((cell, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static duplicated marquee list
            key={i}
            style={{
              width: cell.big ? 88 : 70,
              minWidth: cell.big ? 88 : 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Coolshape
              type={cell.type}
              index={cell.index}
              size={cell.big ? 88 : 70}
              noise
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
          <h2
            className="f-h2"
            style={{ maxWidth: 640, paddingBottom: "2.4rem" }}
          >
            Your day, organized{" "}
            <span className="f-dim">in a whole new way.</span>
          </h2>
        </Reveal>
        <div className="f-explore-grid">
          <Panel
            title="Spoken"
            blurb="No forms, no clicking through five apps. Just say what matters and it's captured."
          >
            <SpokenGraphic />
          </Panel>
          <Panel
            title="Private"
            blurb={
              <>
                Your life stays yours.
                <br />
                End-to-end encrypted at every stage.
              </>
            }
          >
            <PrivateGraphic />
          </Panel>
          <Panel
            title="Instant"
            blurb={
              <>
                From voice to action in under a second.
                <br />
                No friction between thought and done.
              </>
            }
          >
            <InstantGraphic />
          </Panel>
          <Panel
            title="Insightful"
            blurb={
              <>
                See where your time really goes,
                <br />
                and get it back with confidence.
              </>
            }
          >
            <InsightfulGraphic />
          </Panel>
          <Panel
            span
            title="Delightful"
            blurb={
              <>
                Redef takes fun seriously.
                <br />
                Playful interactions with every word you say.
              </>
            }
          >
            <DelightfulGraphic />
          </Panel>
        </div>
        <style>{`
          .redef .f-explore-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
          }
          @media (max-width: 820px) {
            .redef .f-explore-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </section>
    </Container>
  );
}
