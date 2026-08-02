"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";
import {
  ArrowIcon,
  Container,
  PillButton,
  Reveal,
  springSmooth,
} from "./shared";

/* FAQ content from the current Redef AI home page */
const faqs: { q: string; a: ReactNode }[] = [
  {
    q: "What is this and who is it for?",
    a: "We're building the first voice-native productivity companion for busy professionals, founders, and creators who are tired of juggling fragmented tools. If you're scattered across calendars, task apps, and habit trackers, we're here to bring it all into one integrated flow.",
  },
  {
    q: "How does voice-first productivity work?",
    a: "Instead of manually clicking and typing into multiple apps, you simply speak what matters. Your companion understands your intent, manages your calendar, tracks your tasks and habits, and provides insights—all through natural conversation. It's productivity that works for you, not against you.",
  },
  {
    q: "What makes this different from other productivity tools?",
    a: "While other tools like Notion, Todoist, or Google Calendar require manual input across separate apps, we're voice-first and fully integrated. Everything—calendar, tasks, habits, deep work—lives in one unified brain. We're not another tool to manage; we're the system that manages itself for you.",
  },
  {
    q: "Do I need to replace my existing calendar or task apps?",
    a: "Not immediately. Our free tier lets you test the value without commitment. Many users start by using our voice logging alongside their existing tools, then gradually transition as they see the time saved and clarity gained. You're in control of how fast you adopt the new system.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use enterprise-grade security measures including end-to-end encryption and secure data storage. Your productivity data is private and protected. We're building trust, not just a product.",
  },
  {
    q: "How do I get started?",
    a: "Getting started is simple! Sign up for our free tier, start using voice logging for your tasks and calendar, and see how it feels. Our system helps you understand your patterns, track progress, and get back control of your time—no credit card required to start.",
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
    <div style={{ borderBottom: "1px solid var(--line)", width: "100%" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          width: "100%",
          padding: "1.55rem 0.25rem",
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
            background: "var(--secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink)",
          }}
        >
          <span
            style={{
              position: "absolute",
              width: 13,
              height: 2,
              borderRadius: 2,
              background: "currentColor",
            }}
          />
          <motion.span
            animate={{ rotate: open ? 90 : 0, scaleY: open ? 0 : 1 }}
            transition={springSmooth}
            style={{
              position: "absolute",
              width: 2,
              height: 13,
              borderRadius: 2,
              background: "currentColor",
            }}
          />
        </span>
        <h4
          style={{
            margin: 0,
            fontSize: "1.14rem",
            fontWeight: 750,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
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
            transition={springSmooth}
            style={{ overflow: "hidden" }}
          >
            <p
              className="f-body"
              style={{
                padding: "0 0.25rem 1.55rem 3.6rem",
                maxWidth: 720,
                fontSize: "1rem",
              }}
            >
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
      <section id="faq" style={{ padding: "5.5rem 0" }}>
        <Reveal>
          <h1
            className="f-h2"
            style={{ paddingBottom: "0.9rem", maxWidth: 560 }}
          >
            Frequently Asked Questions
          </h1>
          <p className="f-lede" style={{ paddingBottom: "1.8rem" }}>
            Everything you need to know about our voice-first productivity
            system.
          </p>
        </Reveal>
        <Reveal
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div style={{ width: "100%", borderTop: "1px solid var(--line)" }}>
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
            <PillButton variant="beige" href="/waitlist">
              Still curious? Join the waitlist <ArrowIcon size={14} />
            </PillButton>
          </div>
        </Reveal>
      </section>
    </Container>
  );
}
