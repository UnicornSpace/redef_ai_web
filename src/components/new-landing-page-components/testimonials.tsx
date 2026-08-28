"use client";

import { ArrowIcon, Container, PillButton, Reveal } from "./shared";

type Quote = {
  name: string;
  role: string;
  image?: string;
  color: string;
  quote: string;
  width: number;
};

/* Real testimonials from the current Redef AI home page */
const quotes: Quote[] = [
  {
    name: "Jamie Marshall",
    role: "Founder, Tech Startup",
    color: "var(--rf-coral)",
    quote:
      "I've replaced five apps with one voice-first system. What used to be scattered across Notion, Calendar, and Todoist is now unified. I get my time back, my focus returns, and I actually trust my schedule again.",
    width: 540,
  },
  {
    name: "Faizan",
    role: "Founder — UnicornSpace",
    image: "/faizan-founder-unicornspace.png",
    color: "var(--rf-green)",
    quote:
      "The old way was manual chaos—juggling tools, losing track, burning out. This system gives me clarity. I say what matters, it handles the rest. It's not just productivity, it's peace of mind.",
    width: 500,
  },
  {
    name: "Marcus Rodriguez",
    role: "Serial Entrepreneur",
    color: "var(--rf-violet)",
    quote:
      "As a founder, I was drowning in missed opportunities and broken trust with my team. This voice-first system brought back control. I show up prepared, consistent, and trusted. It's the system I wish I had years ago.",
    width: 560,
  },
];

function Avatar({ q }: { q: Quote }) {
  if (q.image) {
    return (
      <img
        src={q.image}
        width={40}
        height={40}
        alt={q.name}
        style={{ borderRadius: 40, display: "block", objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      style={{
        width: 40,
        height: 40,
        borderRadius: 40,
        background: q.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: "1rem",
      }}
    >
      {q.name[0]}
    </span>
  );
}

function QuoteCard({ q }: { q: Quote }) {
  return (
    <div
      className="f-quote-card"
      style={{
        minWidth: q.width,
        maxWidth: q.width,
        background: "var(--paper)",
        borderRadius: 22,
        padding: "1.5rem 1.6rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        <Avatar q={q} />
        <div>
          <div
            style={{
              fontWeight: 750,
              fontSize: "0.98rem",
              color: "var(--ink)",
              letterSpacing: "-0.015em",
            }}
          >
            {q.name}
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--body-muted)",
            }}
          >
            {q.role}
          </div>
        </div>
      </div>
      <p
        className="f-body"
        style={{ paddingTop: "0.4rem", color: "rgba(74,68,63,0.78)" }}
      >
        {q.quote}
      </p>
    </div>
  );
}

export function Testimonials() {
  const row = [...quotes, ...quotes, ...quotes, ...quotes];
  return (
    <section style={{ padding: "5.5rem 0", overflow: "hidden" }}>
      <Container>
        <Reveal>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              paddingBottom: "3.2rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem",
              }}
            >
              <h2 className="f-h2">Friends of Redef</h2>
              <p className="f-lede">People who got their time back.</p>
            </div>
            <div style={{ paddingTop: "0.75rem" }}>
              <PillButton variant="beige" href="/waitlist">
                Join them <ArrowIcon size={14} />
              </PillButton>
            </div>
          </div>
        </Reveal>
      </Container>
      <div className="f-marquee">
        <div
          className="f-marquee-track"
          style={{
            gap: "1.5rem",
            paddingRight: "1.5rem",
            ["--f-marquee-duration" as string]: "70s",
          }}
        >
          {row.map((q, i) => (
            <QuoteCard key={`${q.name}-${i}`} q={q} />
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .redef .f-quote-card { min-width: 320px !important; max-width: 320px !important; }
        }
      `}</style>
    </section>
  );
}
