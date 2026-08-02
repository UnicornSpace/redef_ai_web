"use client";

import { Container, RedefLogo, VoiceWave } from "./shared";

const productLinks = [
  { label: "Tools", href: "/tools" },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Android app",
    href: "https://play.google.com/store/apps/details?id=com.redefai.app",
  },
];

const companyLinks = [
  { label: "Why productivity", href: "/whyproductivity" },
  { label: "Waitlist", href: "/waitlist" },
];

export function RedefFooter({
  user = null,
}: {
  user?: { email: string } | null;
}) {
  const columns = [
    {
      heading: "Product",
      links: user
        ? productLinks
        : [{ label: "Start for free", href: "/app/talk" }, ...productLinks],
    },
    { heading: "Company", links: companyLinks },
    {
      heading: "Account",
      links: user
        ? [{ label: "Dashboard", href: "/app" }]
        : [
            { label: "Log in", href: "/app/talk" },
            { label: "Dashboard", href: "/app" },
          ],
    },
  ];

  return (
    <footer
      style={{
        background: "var(--background)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <Container>
        <div className="f-footer-grid" style={{ padding: "3.6rem 0 2.4rem" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxWidth: 280,
            }}
          >
            <RedefLogo height={26} />
            <p className="f-body" style={{ fontSize: "0.9rem" }}>
              Voice-first AI powered productivity system for your daily life.
            </p>
            <span style={{ color: "var(--rf-green)" }}>
              <VoiceWave color="var(--rf-green)" height={14} bars={7} />
            </span>
          </div>
          {columns.map((col) => (
            <div
              key={col.heading}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: "var(--body-muted)",
                  textTransform: "uppercase",
                }}
              >
                {col.heading}
              </span>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="f-footer-link"
                  style={{
                    fontSize: "0.94rem",
                    fontWeight: 650,
                    color: "var(--ink)",
                    textDecoration: "none",
                    width: "fit-content",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid var(--line)",
            padding: "1.4rem 0 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.84rem",
              fontWeight: 600,
              color: "var(--body-muted)",
            }}
          >
            © 2026 Redef AI. All rights reserved.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.84rem",
              fontWeight: 600,
              color: "var(--body-muted)",
            }}
          >
            Say it once — it's handled.
          </p>
        </div>
      </Container>
      <style>{`
        .redef .f-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 2rem;
        }
        .redef .f-footer-link { transition: color 140ms ease; }
        .redef .f-footer-link:hover { color: var(--rf-green-deep); }
        @media (max-width: 860px) {
          .redef .f-footer-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </footer>
  );
}
