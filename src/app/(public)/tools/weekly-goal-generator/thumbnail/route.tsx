import { ImageResponse } from "next/og";

export const runtime = "edge";

const INK = "#37322f";
const MUTED = "rgba(74,68,63,0.6)";
const PAPER = "#f7f5f3";
const LINE = "#dcd7cf";
const GREEN = "#3e9a35";
const GREEN_PALE = "#eaf5e7";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Checkbox({ size = 14 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `1.5px solid ${INK}`,
        borderRadius: 3,
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Dynamic OG/thumbnail image for the Weekly Goal Planner tool — a small
 * code-drawn mockup of the sheet itself (checklist + grid), so the card on
 * /tools and the social preview both show something true to the product
 * instead of a generic logo, without needing a hand-designed asset.
 */
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: PAPER,
        fontFamily: "sans-serif",
      }}
    >
      {/* Left: brand + copy */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "42%",
          padding: "0 56px",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: GREEN,
              display: "flex",
            }}
          />
          <span style={{ fontSize: 22, fontWeight: 700, color: INK }}>
            Redef AI
          </span>
        </div>
        <span
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: INK,
            lineHeight: 1.08,
            display: "flex",
          }}
        >
          Weekly Goal Planner
        </span>
        <span style={{ fontSize: 19, color: MUTED, display: "flex" }}>
          Goals, tasks & a printable weekly grid
        </span>
      </div>

      {/* Right: mock sheet preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "58%",
          padding: "40px 56px 40px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 480,
            height: 540,
            background: "#ffffff",
            borderRadius: 14,
            boxShadow: "0 20px 60px rgba(55,50,47,0.22)",
            padding: 28,
            gap: 14,
          }}
        >
          {/* header row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderBottom: `2px solid ${INK}`,
              paddingBottom: 10,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: INK }}>
              Ship v2 launch
            </span>
            <span style={{ fontSize: 26, fontWeight: 800, color: INK }}>
              2026
            </span>
          </div>

          {/* goals checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: MUTED,
                letterSpacing: 1,
              }}
            >
              GOALS
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Checkbox />
              <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>
                Launch the new website
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginLeft: 22,
              }}
            >
              <Checkbox size={11} />
              <span style={{ fontSize: 13, color: INK }}>Final QA pass</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Checkbox />
              <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>
                Deep work — 20 hours
              </span>
            </div>
          </div>

          {/* grid preview */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "auto",
              border: `1.5px solid ${LINE}`,
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", background: GREEN_PALE }}>
              <div style={{ width: 88, display: "flex" }} />
              {DAYS.map((d) => (
                <div
                  key={d}
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    padding: "6px 0",
                    fontSize: 10,
                    fontWeight: 700,
                    color: INK,
                    borderLeft: `1px solid ${LINE}`,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            {["Work Hours", "", ""].map((label, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  borderTop: `1px solid ${LINE}`,
                  height: 26,
                }}
              >
                <div
                  style={{
                    width: 88,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 8,
                    fontSize: 9,
                    fontWeight: 600,
                    color: INK,
                  }}
                >
                  {label}
                </div>
                {DAYS.map((d) => (
                  <div
                    key={d}
                    style={{
                      flex: 1,
                      display: "flex",
                      borderLeft: `1px solid ${LINE}`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
