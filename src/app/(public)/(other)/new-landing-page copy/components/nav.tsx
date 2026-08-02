"use client";

import { ChevronDown, Container, FamilyLogo, PillButton } from "./shared";

export function FamilyNav() {
  return (
    <header className="f-nav">
      <Container
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
          <a href="#top" aria-label="Family home" style={{ color: "#262626", display: "block" }}>
            <FamilyLogo height={19} />
          </a>
          <nav className="f-nav-links" style={{ display: "flex", alignItems: "center", gap: "0.1rem" }}>
            <a className="f-nav-link" href="#explore">
              Products <ChevronDown />
            </a>
            <a className="f-nav-link" href="#details">
              Resources <ChevronDown />
            </a>
            <a className="f-nav-link" href="#blog">
              Blog
            </a>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <a
            className="f-nav-link"
            href="https://family.co"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--foreground)" }}
          >
            Log in
          </a>
          <PillButton
            variant="dark"
            href="https://family.co/download"
            className="f-nav-cta"
          >
            Get Started
          </PillButton>
        </div>
      </Container>
      {/* small-screen tweaks */}
      <style>{`
        @media (max-width: 760px) {
          .family .f-nav-links { display: none !important; }
        }
        .family .f-nav-cta { padding: 0.55rem 1.1rem; font-size: 0.92rem; }
      `}</style>
    </header>
  );
}
