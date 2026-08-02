import { Download, ListChecks, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

type Step = {
  icon: typeof SlidersHorizontal;
  title: string;
  description: string;
  points: string[];
  Mock: () => ReactNode;
};

function MockFrame({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        borderRadius: 16,
        border: "1px solid rgba(55,50,47,0.12)",
        background: "#fff",
        padding: "1rem",
        boxShadow: "0 1px 3px rgba(55,50,47,0.08)",
      }}
    >
      {children}
    </div>
  );
}

// Step 1 — challenge length + a couple of habit rows being configured.
function ConfigureMock() {
  return (
    <MockFrame>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {["21 days", "50 days", "90 days"].map((label, i) => (
          <span
            key={label}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              color: i === 0 ? "#fff" : "var(--ink)",
              background: i === 0 ? "var(--rf-green-deep)" : "var(--paper)",
              border: i === 0 ? "none" : "1px solid rgba(55,50,47,0.14)",
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {["Namaz", "Water", "Exercise"].map((label) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(55,50,47,0.1)",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                border: "1.5px solid var(--rf-green-deep)",
              }}
            />
            <span
              style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

// Step 2 — the live A4-style preview grid.
function PreviewMock() {
  return (
    <MockFrame>
      <div
        style={{
          border: "1px solid rgba(55,50,47,0.16)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "var(--paper)",
            borderBottom: "1px solid rgba(55,50,47,0.2)",
          }}
        >
          {["Day", "Namaz", "Water", "Score"].map((h) => (
            <span
              key={h}
              style={{
                flex: 1,
                fontSize: 9,
                fontWeight: 700,
                textAlign: "center",
                padding: "6px 2px",
                color: "var(--ink)",
              }}
            >
              {h}
            </span>
          ))}
        </div>
        {[1, 2, 3].map((row) => (
          <div
            key={row}
            style={{
              display: "flex",
              borderTop: "1px solid rgba(55,50,47,0.08)",
            }}
          >
            {[row, "▢▢▢▢▢", "▢▢▢▢▢▢▢▢", ""].map((cell, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: static mock cells
                key={i}
                style={{
                  flex: 1,
                  fontSize: 9,
                  textAlign: "center",
                  padding: "6px 2px",
                  color: "var(--body-muted)",
                }}
              >
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

// Step 3 — the download button + printed page.
function DownloadMock() {
  return (
    <MockFrame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "297/210",
            borderRadius: 8,
            background: "var(--paper)",
            border: "1px solid rgba(55,50,47,0.12)",
          }}
        />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            background: "var(--rf-green-deep)",
            borderRadius: 999,
            padding: "8px 16px",
          }}
        >
          Download PDF
        </span>
      </div>
    </MockFrame>
  );
}

const steps: Step[] = [
  {
    icon: SlidersHorizontal,
    title: "Configure your challenge",
    description:
      "Pick a length (21, 50, 90 days, or custom) and type in the habits you want to track — prayers, meals, water, workouts, anything.",
    points: ["21/50/90-day presets or custom", "Any habit, your own labels"],
    Mock: ConfigureMock,
  },
  {
    icon: ListChecks,
    title: "See it update live",
    description:
      "The grid on the right updates as you type, so you know exactly what you'll get before you download — no surprises on paper.",
    points: ["Live A4-landscape preview", "Warns you if a column gets tight"],
    Mock: PreviewMock,
  },
  {
    icon: Download,
    title: "Download & print",
    description:
      "One click generates a print-ready PDF. Print it, pin it up, and fill it in by hand each day — no account, nothing saved.",
    points: ["Free, print-ready PDF", "No sign-up, nothing stored"],
    Mock: DownloadMock,
  },
];

function StepRow({ step, index }: { step: Step; index: number }) {
  const flipped = index % 2 === 1;
  const { Mock } = step;
  return (
    <div
      style={{
        display: "grid",
        gap: "2.5rem",
        alignItems: "center",
        gridTemplateColumns: "1fr",
      }}
      className="how-it-works-row"
    >
      <div style={{ order: flipped ? 2 : 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--g-green-pale)",
            color: "var(--rf-green-deep)",
          }}
        >
          <step.icon size={20} aria-hidden="true" />
        </div>
        <h3
          style={{
            marginTop: "1rem",
            fontSize: "1.3rem",
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            marginTop: "0.5rem",
            color: "var(--body-muted)",
            lineHeight: 1.6,
          }}
        >
          {step.description}
        </p>
        <ul
          style={{
            marginTop: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            listStyle: "none",
            padding: 0,
          }}
        >
          {step.points.map((point) => (
            <li
              key={point}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.92rem",
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              <ListChecks
                size={16}
                style={{ color: "var(--rf-green-deep)", flexShrink: 0 }}
                aria-hidden="true"
              />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ order: flipped ? 1 : 2 }}>
        <Mock />
      </div>
    </div>
  );
}

export default function HowItWorksBlock() {
  return (
    <section
      className="f-container"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "0.9rem",
        }}
      >
        <span className="f-eyebrow" style={{ color: "var(--rf-green-deep)" }}>
          How it works
        </span>
        <h2 className="f-h2" style={{ maxWidth: 640 }}>
          From blank page to printed habit tracker in three steps
        </h2>
        <p className="f-lede" style={{ maxWidth: 560 }}>
          No account, no setup — configure your sheet, watch it update live,
          then download and print.
        </p>
      </div>

      <div
        style={{
          marginTop: "3rem",
          display: "flex",
          flexDirection: "column",
          gap: "3.5rem",
        }}
      >
        {steps.map((step, index) => (
          <StepRow key={step.title} step={step} index={index} />
        ))}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .how-it-works-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}
