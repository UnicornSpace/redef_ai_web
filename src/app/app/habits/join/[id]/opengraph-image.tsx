import { ImageResponse } from "next/og";
import { getPublicHabit } from "@/actions/habits";
import { initialsOf } from "@/lib/avatar";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT_HEX = ["#3e9a35", "#ffb332", "#8b5cf6", "#ff6a55"];
function accentFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return ACCENT_HEX[hash % ACCENT_HEX.length];
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const habit = await getPublicHabit(id);
  const ownerName = habit?.owner_display_name ?? "A friend";
  const habitName = habit?.name ?? "a habit";
  const accent = accentFor(ownerName);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#F7F5F3",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: accent,
            color: "#fff",
            fontSize: 40,
            fontWeight: 800,
          }}
        >
          {initialsOf(ownerName)}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "rgba(74,68,63,0.7)",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          Habit invite from
          <span style={{ color: "#37322F", fontSize: 34 }}>{ownerName}</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 800,
          color: "#37322F",
          lineHeight: 1.15,
          maxWidth: 980,
        }}
      >
        Start “{habitName}” together
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 32,
          fontSize: 28,
          color: "rgba(74,68,63,0.7)",
          fontWeight: 600,
        }}
      >
        Redef AI · track it side by side, compare streaks
      </div>
    </div>,
    { ...size },
  );
}
