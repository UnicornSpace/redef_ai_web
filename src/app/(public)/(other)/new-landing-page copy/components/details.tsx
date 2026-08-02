"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Container, Reveal } from "./shared";

/* ------------------------------------------------------------------ */
/* Small token logos                                                    */
/* ------------------------------------------------------------------ */

function EthLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <circle cx={22} cy={22} r={22} fill="#25292E" />
      <path d="M22 7l-.2.7v19.8l.2.2 9.2-5.4L22 7Z" fill="#fff" />
      <path d="M22 7l-9.2 15.3L22 27.7V7Z" fill="#fff" opacity={0.9} />
      <path d="M22 29.5l-9.2-5.5L22 37l9.2-13-9.2 5.5Z" fill="#fff" opacity={0.85} />
      <path d="M22 27.7l9.2-5.4L22 18.1v9.6Z" fill="#fff" opacity={0.65} />
    </svg>
  );
}

function UsdcLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <circle cx={22} cy={22} r={22} fill="#2775CA" />
      <path
        d="M28 25.5c0-3.2-1.9-4.3-5.7-4.8-2.8-.4-3.3-1.1-3.3-2.4 0-1.3.9-2.1 2.7-2.1 1.7 0 2.6.6 3 2 .1.3.4.5.7.5h1.5c.4 0 .6-.3.6-.6v-.1c-.4-2-2-3.6-4.1-3.8V12c0-.4-.3-.6-.7-.7h-1.4c-.4 0-.6.3-.7.7v2.1c-2.8.4-4.5 2.1-4.5 4.4 0 3 1.8 4.2 5.7 4.7 2.6.4 3.4 1 3.4 2.5 0 1.4-1.3 2.4-3 2.4-2.4 0-3.2-1-3.5-2.4-.1-.4-.4-.5-.7-.5h-1.5c-.4 0-.6.3-.6.6v.1c.4 2.3 1.8 4 4.9 4.4v2.2c0 .4.3.6.7.7h1.4c.4 0 .6-.3.7-.7v-2.2c2.7-.4 4.4-2.3 4.4-4.8Z"
        fill="#fff"
      />
      <path
        d="M17.3 35.1c-7.1-2.6-10.8-10.5-8.1-17.6 1.4-3.9 4.4-6.8 8.1-8.2.4-.2.6-.5.6-.9v-1.3c0-.4-.2-.6-.6-.7-.1 0-.3 0-.4.1-8.7 2.7-13.5 12-10.7 20.7 1.6 5.1 5.6 9.1 10.7 10.7.4.2.7 0 .8-.4v-1.5c0-.3-.2-.6-.4-.9Zm9.7-28.6c-.4-.2-.7 0-.8.4v1.4c0 .4.3.7.5.9 7.1 2.6 10.8 10.5 8.1 17.6-1.4 3.8-4.4 6.8-8.1 8.1-.4.2-.6.5-.6.9v1.3c0 .4.2.6.6.7.1 0 .3 0 .4-.1 8.7-2.7 13.5-12 10.7-20.7-1.6-5.2-5.7-9.2-10.8-10.5Z"
        fill="#fff"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Monitor In Real-Time — stacked live transaction cards            */
/* ------------------------------------------------------------------ */

const monitorRows = [
  { icon: <UsdcLogo size={34} />, title: "Send USDC", meta: "To benji.eth", right: "− 1,000 USDC" },
  { icon: <EthLogo size={34} />, title: "Swap ETH", meta: "1.2 ETH → USDC", right: "Pending…" },
  { icon: <UsdcLogo size={34} />, title: "Received", meta: "From jacob.eth", right: "+ 340 USDC" },
];

function MonitorGraphic() {
  const [front, setFront] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFront((f) => (f + 1) % monitorRows.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: "relative", height: 168, width: "100%", maxWidth: 420, margin: "0 auto" }}>
      {monitorRows.map((row, i) => {
        const pos = (i - front + monitorRows.length) % monitorRows.length; // 0=front
        return (
          <motion.div
            key={row.title}
            animate={{
              y: pos === 0 ? 48 : pos === 1 ? 22 : 0,
              scale: pos === 0 ? 1 : pos === 1 ? 0.94 : 0.88,
              opacity: pos === 0 ? 1 : pos === 1 ? 0.6 : 0.35,
              zIndex: 3 - pos,
            }}
            transition={{ type: "spring", stiffness: 210, damping: 26 }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              background: "#fff",
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.05)",
              boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
              padding: "0.85rem 1.1rem",
              display: "flex",
              alignItems: "center",
              gap: 13,
            }}
          >
            {row.icon}
            <span style={{ display: "flex", flexDirection: "column", flex: 1, gap: 1 }}>
              <span style={{ fontWeight: 620, fontSize: "0.96rem", color: "#222", letterSpacing: "-0.015em" }}>
                {row.title}
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(0,0,0,0.4)" }}>{row.meta}</span>
            </span>
            <span
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                color: row.right.startsWith("+") ? "var(--app-green)" : row.right.startsWith("−") ? "#222" : "var(--app-blue)",
              }}
            >
              {row.right}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Protect Your Assets — analyzing → safe pill                      */
/* ------------------------------------------------------------------ */

function ProtectGraphic() {
  const [safe, setSafe] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setSafe((s) => !s), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
      <motion.div
        layout
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          background: "#fff",
          borderRadius: 999,
          padding: "0.95rem 1.6rem",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {safe ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 20 }}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--app-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                <path d="M1.5 5.6 4.8 9 11.5 1.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key="spin"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="f-spinner"
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "3.5px solid rgba(77,175,255,0.3)",
                borderTopColor: "var(--app-blue)",
                display: "block",
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={safe ? "safe" : "analyzing"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              fontWeight: 650,
              fontSize: "1.2rem",
              letterSpacing: "-0.02em",
              color: safe ? "var(--app-green)" : "var(--app-blue)",
              whiteSpace: "nowrap",
            }}
          >
            {safe ? "Transaction Safe" : "Analyzing Transaction"}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Organise Your Wallet — starred favorites                         */
/* ------------------------------------------------------------------ */

function StarBadge({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      animate={{ rotate: [-8, 8, -8], scale: [1, 1.12, 1] }}
      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.6, delay, ease: "easeInOut" }}
      style={{
        position: "absolute",
        left: -9,
        top: -9,
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: "var(--yellow)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
        zIndex: 2,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.6l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 16l-5.2 2.8 1-5.9-4.3-4.1 5.9-.9L12 2.6Z"
          fill="#fff"
        />
      </svg>
    </motion.span>
  );
}

const starredRows = [
  { logo: <EthLogo size={40} />, name: "Ethereum", amount: "1.54 ETH", value: "$3,080.00", change: "0.00%" },
  { logo: <UsdcLogo size={40} />, name: "USDC", amount: "41.00 USDC", value: "$41.00", change: "0.00%" },
];

function OrganiseGraphic() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 400, margin: "0 auto" }}>
      {starredRows.map((row, i) => (
        <div
          key={row.name}
          style={{
            position: "relative",
            background: "#fff",
            borderRadius: 14,
            border: "1px solid rgba(254,190,68,0.45)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            padding: "0.8rem 1.05rem",
            display: "flex",
            alignItems: "center",
            gap: 13,
          }}
        >
          <StarBadge delay={i * 0.5} />
          {row.logo}
          <span style={{ display: "flex", flexDirection: "column", flex: 1, gap: 2 }}>
            <span style={{ fontWeight: 620, fontSize: "0.97rem", color: "#2e2e2e", letterSpacing: "-0.015em" }}>
              {row.name}
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "#adadad" }}>{row.amount}</span>
          </span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ fontWeight: 620, fontSize: "0.95rem", color: "#2e2e2e" }}>{row.value}</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--app-green)" }}>{row.change}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. See Everything Clearly — wallet groups                           */
/* ------------------------------------------------------------------ */

const groups = [
  {
    label: "Trading",
    sub: "3 wallets",
    colors: ["#0ea5e9", "#eab308", "#4dafff", "#6366f1"],
  },
  {
    label: "Savings",
    sub: "4 wallets",
    colors: ["#f97316", "#006351", "#4dafff", "#a45ff9"],
  },
];

function ClarityGraphic() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 400, margin: "0 auto" }}>
      {groups.map((group) => (
        <div
          key={group.label}
          style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            padding: "0.85rem 1.05rem",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              width: 48,
              height: 48,
              minWidth: 48,
              borderRadius: 12,
              background: "#f7f8f9",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
              padding: 8,
            }}
          >
            {group.colors.map((c) => (
              <span key={`${group.label}-${c}`} style={{ borderRadius: "50%", background: c }} />
            ))}
          </span>
          <span style={{ display: "flex", flexDirection: "column", flex: 1, gap: 2 }}>
            <span style={{ fontWeight: 620, fontSize: "0.97rem", color: "#222", letterSpacing: "-0.015em" }}>
              {group.label}
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "rgba(0,0,0,0.4)" }}>{group.sub}</span>
          </span>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--app-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
              <path d="M1.5 5.2 4.4 8 10.5 1.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const details = [
  {
    title: "Monitor In Real-Time",
    body: "Track the status of all your transactions in real-time, with live updates, detailed information, notifications, and seamless animations between states. You’ll be the first to know when your transactions go through.",
    graphic: <MonitorGraphic />,
  },
  {
    title: "Protect Your Assets",
    body: "Understand your transactions before you send them and receive warnings about potentially harmful actions. Get full protection over all of your assets, with help from advanced simulations and suggested actions.",
    graphic: <ProtectGraphic />,
  },
  {
    title: "Organise Your Wallet",
    body: "Take full control over your wallet with powerful organization across all assets. Rearrange your tokens and collectibles, star your favorites, or move things to the trash when you want to do some spring-cleaning.",
    graphic: <OrganiseGraphic />,
  },
  {
    title: "See Everything Clearly",
    body: "Alleviate all confusion with crystal clear breakdowns of your wallets and their respective grouping. Whether you have two wallets or two hundred, Family provides a birds eye view into your entire setup with unmatched clarity.",
    graphic: <ClarityGraphic />,
  },
];

export function DetailsSection() {
  return (
    <Container>
      <section id="details" style={{ padding: "5.5rem 0", maxWidth: 640, margin: "0 auto" }}>
        <Reveal style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: "3.4rem" }}>
          <h1 className="f-h2">Details that matter.</h1>
          <p className="f-lede">We sweat the details, no matter how small.</p>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: "3.6rem" }}>
          {details.map((detail) => (
            <Reveal key={detail.title} style={{ display: "flex", flexDirection: "column", gap: "1.3rem" }}>
              <div
                className="f-panel"
                style={{
                  minHeight: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem 1.75rem",
                }}
              >
                {detail.graphic}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <p className="f-eyebrow" style={{ color: "var(--blue)", fontSize: "1.06rem" }}>
                  {detail.title}
                </p>
                <p className="f-lede" style={{ fontSize: "1.02rem" }}>
                  {detail.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Container>
  );
}
