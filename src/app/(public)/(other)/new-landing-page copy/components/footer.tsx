"use client";

import { Container, FamilyLogo, XIcon } from "./shared";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "Wallet", href: "https://family.co" },
      { label: "Download", href: "https://family.co/download" },
      { label: "FamilyKit", href: "https://family.co" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Blog", href: "https://family.co/blog" },
      { label: "Support", href: "https://family.co/support" },
      { label: "FAQs", href: "https://family.co/faqs" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Twitter", href: "https://twitter.com/family" },
      { label: "Contact", href: "https://family.co" },
      { label: "Press Kit", href: "https://family.co" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "https://family.co/privacy" },
      { label: "Terms of Service", href: "https://family.co/terms" },
    ],
  },
];

export function FamilyFooter() {
  return (
    <footer style={{ background: "var(--background)", borderTop: "1px solid var(--gray-light)" }}>
      <Container>
        <div className="f-footer-grid" style={{ padding: "3.6rem 0 2.4rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 260 }}>
            <span style={{ color: "#262626" }}>
              <FamilyLogo height={20} />
            </span>
            <p className="f-body" style={{ fontSize: "0.9rem" }}>
              The friendliest way to explore Ethereum, on iOS.
            </p>
            <a
              href="https://twitter.com/family"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Family on X"
              style={{ color: "rgba(28,27,26,0.45)", width: "fit-content" }}
            >
              <XIcon size={16} />
            </a>
          </div>
          {columns.map((col) => (
            <div key={col.heading} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 650, letterSpacing: "0.02em", color: "var(--body-muted)", textTransform: "uppercase" }}>
                {col.heading}
              </span>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.94rem",
                    fontWeight: 550,
                    color: "var(--foreground)",
                    textDecoration: "none",
                    width: "fit-content",
                  }}
                  className="f-footer-link"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid var(--gray-light)",
            padding: "1.4rem 0 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 500, color: "var(--body-muted)" }}>
            © 2026 Family. All rights reserved. — UI experiment clone for internal design research.
          </p>
          <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 500, color: "var(--body-muted)" }}>
            Made with care, and a lot of tiny details.
          </p>
        </div>
      </Container>
      <style>{`
        .family .f-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr repeat(4, 1fr);
          gap: 2rem;
        }
        .family .f-footer-link:hover { color: var(--blue); }
        @media (max-width: 900px) {
          .family .f-footer-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </footer>
  );
}
