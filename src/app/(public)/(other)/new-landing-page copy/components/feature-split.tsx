"use client";

import type { ReactNode } from "react";
import { Box, Globe, Image as ImageIcon, Music, Scan, Video } from "lucide-react";
import { Container, DemoButton, Eyebrow, Phone, Reveal, TickList } from "./shared";

/* ------------------------------------------------------------------ */
/* Reusable split section: text one side, phone panel the other        */
/* ------------------------------------------------------------------ */

export function FeatureSplit({
  id,
  eyebrow,
  eyebrowColor,
  title,
  body,
  ticks,
  tickColumns = 1,
  extra,
  demo,
  screen,
  panelSide = "right",
  gapAfterTitle = 20,
}: {
  id?: string;
  eyebrow: string;
  eyebrowColor: string;
  title: ReactNode;
  body: string;
  ticks?: string[];
  tickColumns?: 1 | 2;
  extra?: ReactNode;
  demo?: { image: string; title: string };
  screen: string;
  panelSide?: "left" | "right";
  gapAfterTitle?: number;
}) {
  const text = (
    <Reveal style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: gapAfterTitle }}>
        <h1 className="f-h2">{title}</h1>
        <p className="f-lede" style={{ maxWidth: 460 }}>
          {body}
        </p>
      </div>
      {ticks ? <TickList items={ticks} color={eyebrowColor} columns={tickColumns} /> : null}
      {extra}
      {demo ? <DemoButton image={demo.image} title={demo.title} /> : null}
    </Reveal>
  );

  const panel = (
    <Reveal delay={0.1}>
      <div className="f-panel" style={{ padding: "2rem 3rem 0" }}>
        <div style={{ marginBottom: "-52%" }}>
          <Phone screen={screen} width={300} />
        </div>
      </div>
    </Reveal>
  );

  return (
    <Container>
      <section id={id} className="f-split" style={{ padding: "5.5rem 0" }}>
        {panelSide === "left" ? (
          <>
            <div className="f-split-panel">{panel}</div>
            {text}
          </>
        ) : (
          <>
            {text}
            <div className="f-split-panel">{panel}</div>
          </>
        )}
        <style>{`
          .family .f-split {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
          }
          @media (max-width: 900px) {
            .family .f-split { grid-template-columns: 1fr; gap: 2.5rem; }
            .family .f-split-panel { order: 2; }
          }
        `}</style>
      </section>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/* NFT media-type list                                                 */
/* ------------------------------------------------------------------ */

const nftMedia = [
  { label: "Images", icon: ImageIcon },
  { label: "Video", icon: Video },
  { label: "3D Models", icon: Box },
  { label: "Audio", icon: Music },
  { label: "Interactive Models", icon: Globe },
  { label: "AR Models", icon: Scan },
];

export function NftMediaList() {
  return (
    <ul
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem 1.25rem",
        color: "var(--gold)",
        margin: 0,
        padding: "0.75rem 0 0.375rem",
        listStyle: "none",
      }}
    >
      {nftMedia.map(({ label, icon: Icon }) => (
        <li key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20 }}>
            <Icon size={18} strokeWidth={1.9} />
          </span>
          <span style={{ fontSize: "1.04rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--foreground)" }}>
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* The three concrete sections                                         */
/* ------------------------------------------------------------------ */

export function NftSection() {
  return (
    <FeatureSplit
      eyebrow="Seamless"
      eyebrowColor="var(--gold)"
      title="The best way to experience NFTs."
      body="View NFTs in their ideal intended format. Full rich media support no matter the type, from video and audio, to images and interactive."
      extra={<NftMediaList />}
      demo={{ image: "https://family.co/videos/promo-collectibles.png", title: "Manage your collectibles" }}
      screen="https://family.co/videos/nft.png"
      panelSide="left"
      gapAfterTitle={26}
    />
  );
}

export function WatchSection() {
  return (
    <FeatureSplit
      eyebrow="Simple"
      eyebrowColor="var(--green)"
      title={
        <>
          Watch the wallets <span className="f-dim">you care about.</span>
        </>
      }
      body="Keep up to date with unlimited wallets in view-only mode by entering an address or ENS name, and get real-time notifications on any new activity."
      ticks={["Watch Any Wallet", "Rich Notifications", "Fully Customizable"]}
      demo={{ image: "https://family.co/videos/promo-watch.png", title: "Watching Wallets" }}
      screen="https://family.co/videos/watch.png"
      panelSide="right"
    />
  );
}

export function ActivitySection() {
  return (
    <FeatureSplit
      eyebrow="Understandable"
      eyebrowColor="var(--orange)"
      title={
        <>
          Wallet activity you <span className="f-dim">can understand.</span>
        </>
      }
      body="Your transactions and wallet history is readable at a glance. No more having to decipher what confusing events with weird names mean. We do that for you."
      ticks={["Human-Readable Activity", "Real-Time Monitoring", "Custom Filtering"]}
      demo={{ image: "https://family.co/videos/promo-activity.png", title: "Wallet Activity" }}
      screen="https://family.co/videos/activity.png"
      panelSide="left"
    />
  );
}
