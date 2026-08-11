"use client";

import { Container, NavAvatar, PillButton, RedefLogo } from "./shared";

export function RedefNav({ user = null }: { user?: { email: string } | null }) {
  return (
    <header className="f-nav">
      <Container
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 66,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.6rem" }}>
          <a
            href="/"
            aria-label="Redef AI home"
            style={{ textDecoration: "none", display: "block" }}
          >
            <RedefLogo height={26} />
          </a>
          <nav
            className="f-nav-links"
            style={{ display: "flex", alignItems: "center", gap: "0.1rem" }}
          >
            <a className="f-nav-link" href="#explore">
              Product
            </a>
            <a className="f-nav-link" href="#why">
              Why Redef
            </a>
            <a className="f-nav-link" href="#faq">
              FAQ
            </a>
            <a className="f-nav-link" href="/tools">
              Tools
            </a>
            <a className="f-nav-link" href="/pricing">
              Pricing
            </a>
            <a className="f-nav-link" href="/app/challenges">
              Challenges
            </a>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          {user ? (
            <>
              <NavAvatar seed={user.email} size={28} />
              <PillButton variant="dark" href="/app" className="f-nav-cta">
                Dashboard
              </PillButton>
            </>
          ) : (
            <>
              <a
                className="f-nav-link"
                href="/app/talk"
                style={{ color: "var(--ink)" }}
              >
                Log in
              </a>
              <PillButton variant="dark" href="/app/talk" className="f-nav-cta">
                Start for free
              </PillButton>
            </>
          )}
        </div>
      </Container>
      <style>{`
        @media (max-width: 760px) {
          .redef .f-nav-links { display: none !important; }
        }
        .redef .f-nav-cta { padding: 0.58rem 1.15rem; font-size: 0.92rem; }
      `}</style>
    </header>
  );
}
