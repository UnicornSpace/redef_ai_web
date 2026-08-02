"use client";

import { Container, Reveal } from "./shared";

const features = [
  {
    title: "Send & Receive",
    body: "Flawless essentials. Easily send tokens and collectibles with the fewest taps, or share your wallet address by simply scanning a personalized QR code to receive new assets.",
  },
  {
    title: "Decentralized Swaps",
    body: "Trade thousands of tokens with minimal fees, 24/7. Family ensures optimal prices from various exchanges so you can acquire the tokens you want, whenever you want them.",
  },
  {
    title: "Full NFT Support",
    body: "Experience NFTs in their intended format with our full rich media support. Interact with everything, including video, audio, images, and interactive content. The best collectors manage their collections in Family.",
  },
  {
    title: "WalletConnect Enabled",
    body: "Easily access decentralized apps with WalletConnect in Family. Simply pair your wallet with the built-in scanner, and enjoy seamless connectivity to a range of powerful applications across web3.",
  },
  {
    title: "Self-Custody",
    body: "Family is committed to delivering robust security with flexibility to suit your preferences. The self-custodial wallet prioritizes your control, giving you direct access to your private keys and sensitive data at all times.",
  },
  {
    title: "Maximum Privacy",
    body: "Explore web3 on your own terms, with no compromises on privacy or revealing more than you’re comfortable with. Family works with or without an email or phone number, letting you choose the experience that’s right for you.",
  },
];

export function FeaturesGrid() {
  return (
    <section style={{ background: "var(--beige)", padding: "5.5rem 0", margin: "1rem 0" }}>
      <Container>
        <div className="f-features-grid">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.07} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <h5 className="f-eyebrow" style={{ color: "var(--blue)" }}>
                {feature.title}
              </h5>
              <p className="f-body">{feature.body}</p>
            </Reveal>
          ))}
        </div>
        <style>{`
          .family .f-features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3rem 2.5rem;
          }
          @media (max-width: 980px) {
            .family .f-features-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 640px) {
            .family .f-features-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </Container>
    </section>
  );
}
