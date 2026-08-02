"use client";

import { type ReactNode, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowIcon, Container, PillButton, Reveal } from "./shared";

const faqs = [
  {
    q: "Is Family safe?",
    a: (
      <>
        Yes, Family is safe. Only you have access to your credentials and, consequently, your wallet and its assets. In
        addition, we employ several other security measures including requiring 2FA via biometrics for sensitive
        actions, such as signing transactions. Family has also been{" "}
        <a href="https://family.co/media/family-wallet-audit-report-2024.pdf" target="_blank" rel="noopener noreferrer">
          audited by Zellic
        </a>
        , a leading security firm.
      </>
    ),
  },
  {
    q: "Can I switch from another wallet?",
    a: (
      <>
        Yes, you can easily switch to Family from another wallet. If you're using a non-custodial wallet like Phantom or
        MetaMask and want to keep your current wallet addresses, you can import your existing wallet(s) into Family
        using your Secret Recovery Phrase or Private Key. Check out our simple guides on how to{" "}
        <a href="https://family.co/support/import-a-wallet-from-metamask" target="_blank" rel="noopener noreferrer">
          Import from MetaMask
        </a>{" "}
        and how to{" "}
        <a href="https://family.co/support/import-a-wallet-from-phantom" target="_blank" rel="noopener noreferrer">
          Import from Phantom
        </a>
        .
      </>
    ),
  },
  {
    q: "What networks does Family support?",
    a: (
      <>
        Family currently supports Ethereum mainnet, as well as Layer 2 networks (L2s) including Optimism, Base,
        Arbitrum, Polygon, and zkSync, with more to come.
      </>
    ),
  },
];

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--gray-light)", width: "100%" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          width: "100%",
          padding: "1.6rem 0.25rem",
          background: "none",
          border: 0,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            position: "relative",
            width: 32,
            height: 32,
            minWidth: 32,
            borderRadius: "50%",
            background: "var(--beige)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--foreground)",
          }}
        >
          <span style={{ position: "absolute", width: 13, height: 2, borderRadius: 2, background: "currentColor" }} />
          <motion.span
            animate={{ rotate: open ? 90 : 0, scaleY: open ? 0 : 1 }}
            transition={{ duration: 0.25 }}
            style={{ position: "absolute", width: 2, height: 13, borderRadius: 2, background: "currentColor" }}
          />
        </span>
        <h4
          style={{
            margin: 0,
            fontSize: "1.16rem",
            fontWeight: 620,
            letterSpacing: "-0.02em",
            color: "var(--foreground)",
          }}
        >
          {q}
        </h4>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            style={{ overflow: "hidden" }}
          >
            <p className="f-body" style={{ padding: "0 0.25rem 1.6rem 3.6rem", maxWidth: 720, fontSize: "1rem" }}>
              {a}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Container>
      <section style={{ padding: "5.5rem 0" }}>
        <Reveal>
          <h1 className="f-h2" style={{ paddingBottom: "1.8rem", maxWidth: 520 }}>
            Frequently Asked Questions
          </h1>
        </Reveal>
        <Reveal style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ width: "100%", borderTop: "1px solid var(--gray-light)" }}>
            {faqs.map((faq, i) => (
              <FaqItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            ))}
          </div>
          <div style={{ paddingTop: "2rem" }}>
            <PillButton variant="beige" href="https://family.co/faqs">
              See More FAQs <ArrowIcon size={15} />
            </PillButton>
          </div>
        </Reveal>
      </section>
    </Container>
  );
}
