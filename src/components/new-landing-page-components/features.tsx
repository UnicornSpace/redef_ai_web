"use client";

import { Container, Reveal } from "./shared";

const features = [
  {
    title: "Voice Logging",
    body: "Instead of manually clicking and typing into multiple apps, you simply speak what matters. Your companion understands your intent and captures it — tasks, events, habits, notes — through natural conversation.",
  },
  {
    title: "Unified Calendar",
    body: "Your schedule lives in one brain, not five tabs. Redef manages your calendar for you: creating, moving, and protecting events by voice, so you show up prepared and consistent.",
  },
  {
    title: "Tasks & Habits",
    body: "Everything you need to do and everything you're building — tracked in one integrated flow. Log a habit streak or add a task the moment you think of it, without breaking stride.",
  },
  {
    title: "Deep Work Mode",
    body: "Block focus time with a sentence, and let the system guard it. Redef keeps distractions out of protected hours and helps you build a real deep-work practice, week over week.",
  },
  {
    title: "Insights That Speak",
    body: "Track your patterns with precision and turn raw activity into confident decisions. See where your time goes, what's working, and what to change — beautifully organized, without the clutter.",
  },
  {
    title: "Private by Design",
    body: "Enterprise-grade security with end-to-end encryption and secure data storage. Your productivity data is private and protected — we're building trust, not just a product.",
  },
];

export function FeaturesGrid() {
  return (
    <section
      id="why"
      style={{
        background: "var(--paper)",
        padding: "5.5rem 0",
        margin: "1rem 0",
      }}
    >
      <Container>
        <div className="f-features-grid">
          {features.map((feature, i) => (
            <Reveal
              key={feature.title}
              delay={(i % 3) * 0.07}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <h5
                className="f-eyebrow"
                style={{ color: "var(--rf-green-deep)" }}
              >
                {feature.title}
              </h5>
              <p className="f-body">{feature.body}</p>
            </Reveal>
          ))}
        </div>
        <style>{`
          .redef .f-features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3rem 2.5rem;
          }
          @media (max-width: 980px) {
            .redef .f-features-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 640px) {
            .redef .f-features-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </Container>
    </section>
  );
}
