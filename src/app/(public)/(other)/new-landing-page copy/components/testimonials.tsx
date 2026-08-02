"use client";

import { Container, PillButton, Reveal, XIcon } from "./shared";

type Tweet = {
  name: string;
  handle: string;
  avatar: string;
  url: string;
  quote: string;
  width: number;
};

const avatar = (file: string) => `https://family.co/avatars/${file}`;

const rowOne: Tweet[] = [
  {
    name: "floguo",
    handle: "@floguo",
    avatar: avatar("floguo.jpeg"),
    url: "https://twitter.com/floguo/status/1645597339955118080",
    quote:
      "One of the best mobile apps *ever* is going to drop soon, and it's a crypto wallet. @family is building beautifully friendly crypto software & I haven't been this giddy in ages",
    width: 540,
  },
  {
    name: "Daniel Feodoroff",
    handle: "@mrdanielfeo",
    avatar: avatar("mrdanielfeo.jpeg"),
    url: "https://twitter.com/mrdanielfeo/status/1646371918965260289",
    quote:
      "The family app has some of the best UI and UX of a crypto app I’ve ever seen. Every snippet just blows my mind more and more",
    width: 475,
  },
  {
    name: "emm",
    handle: "@web3emm",
    avatar: avatar("web3emm.jpeg"),
    url: "https://twitter.com/web3emm/status/1650912133402722310",
    quote:
      "Got in on the @family beta and first impression is that THIS is the web2 delightful UI/UX that web3 has been missing",
    width: 475,
  },
  {
    name: "skytracker.lens(🌸, 🌿)",
    handle: "@Skytrackr",
    avatar: avatar("Skytrackr.jpeg"),
    url: "https://twitter.com/Skytrackr/status/1656698593703776256",
    quote: "This wallet is absolutely amazing! 🔥🔥",
    width: 390,
  },
  {
    name: "Ilya Komolkin",
    handle: "@dappdesigner",
    avatar: avatar("dappdesigner.png"),
    url: "https://twitter.com/dappdesigner/status/1651952932848295937",
    quote:
      "It is one of the best UX in Web3 space. Onboarding, watching wallets, sorting, wallets management and micro-animations are on the whole another level 👏 Keep building!",
    width: 540,
  },
  {
    name: "miguel piedrafita",
    handle: "@m1guelpf",
    avatar: avatar("m1guelpf.jpeg"),
    url: "https://twitter.com/m1guelpf/status/1644490929430986753",
    quote: "@family is the best ethereum wallet I have ever used",
    width: 475,
  },
  {
    name: "Shiv",
    handle: "@shivnull",
    avatar: avatar("shivnull.jpeg"),
    url: "https://twitter.com/shivnull/status/1650977326111358977",
    quote: "Wow @family wallet is incredible, these are the type of interfaces we need to propel this space forward",
    width: 475,
  },
];

const rowTwo: Tweet[] = [
  {
    name: "Zora Zine",
    handle: "@____zine____",
    avatar: avatar("____zine____.jpeg"),
    url: "https://twitter.com/____zine____/status/1653088998645022726",
    quote: "Best wallet to experience our text NFTs",
    width: 400,
  },
  {
    name: "liquid density",
    handle: "@liquiddensity",
    avatar: avatar("liquiddensity.jpeg"),
    url: "https://twitter.com/liquiddensity/status/1647032880709730308",
    quote:
      "This is absolutely mind blowing from an onboarding perspective. Never have I seen such an approachable and beautiful flow for anything ever.",
    width: 470,
  },
  {
    name: "Tani",
    handle: "@tanishqxyz",
    avatar: avatar("tanishqxyz.jpeg"),
    url: "https://twitter.com/tanishqxyz/status/1650912960456409111",
    quote:
      "I spent the last 5 mins scrubbing left and right on the price chart, watching those numbers animate beautifully. It shows",
    width: 390,
  },
  {
    name: "Maxim Bogun",
    handle: "@i_bogun",
    avatar: avatar("i_bogun.jpeg"),
    url: "https://twitter.com/i_bogun/status/1647222064615415811",
    quote: "I’d create one more wallet just to go through this whole interface and test interactions. Excited!",
    width: 475,
  },
  {
    name: "artiom",
    handle: "@artignatyev",
    avatar: avatar("artignatyev.jpeg"),
    url: "https://twitter.com/artignatyev/status/1652081272443883521",
    quote:
      "Been playing with the family beta for a while and it's the best self-custodial wallet experience I've ever had — details matter — it could def become the gateway for the next wave of new-to-crypto people",
    width: 620,
  },
  {
    name: "Clayo",
    handle: "@ClayOglesby",
    avatar: avatar("ClayOglesby.jpeg"),
    url: "https://twitter.com/ClayOglesby/status/1649263199097700353",
    quote:
      '@family has some pretty incredible ui and micro interactions that make the app seem very approachable for something as complex as a crypto wallet for "normies".',
    width: 540,
  },
  {
    name: "Guillermo Torres",
    handle: "@g1sh",
    avatar: avatar("g1sh.jpeg"),
    url: "https://twitter.com/g1sh/status/1646955057697677312",
    quote:
      "Wallet creation can be cumbersome, Family takes a interesting approach that instead of making it easier/faster, it tries to add meaning and delight with a snappy experience.",
    width: 540,
  },
  {
    name: "Adam Waterhouse",
    handle: "@AdamWaterhous10",
    avatar: avatar("AdamWaterhous10.jpeg"),
    url: "https://twitter.com/AdamWaterhous10/status/1658481310288195592",
    quote: "Love this! The UX around creating a #web3 wallet has needed an overhaul for a long time.",
    width: 475,
  },
];

function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <div
      style={{
        minWidth: tweet.width,
        maxWidth: tweet.width,
        background: "var(--beige)",
        borderRadius: 22,
        padding: "1.5rem 1.6rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
      className="f-tweet-card"
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <img
            src={tweet.avatar}
            width={40}
            height={40}
            alt={tweet.name}
            style={{ borderRadius: 40, display: "block" }}
          />
          <div>
            <div style={{ fontWeight: 650, fontSize: "0.98rem", color: "var(--foreground)", letterSpacing: "-0.015em" }}>
              {tweet.name}
            </div>
            <div style={{ fontSize: "0.86rem", fontWeight: 500, color: "var(--body-muted)" }}>{tweet.handle}</div>
          </div>
        </div>
        <a
          href={tweet.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(28,27,26,0.3)", padding: 4 }}
          aria-label="View on X"
        >
          <XIcon size={16} />
        </a>
      </div>
      <p className="f-body" style={{ paddingTop: "0.4rem", color: "rgba(71,70,69,0.78)" }}>
        {tweet.quote}
      </p>
    </div>
  );
}

function MarqueeRow({ tweets, reverse = false }: { tweets: Tweet[]; reverse?: boolean }) {
  const doubled = [...tweets, ...tweets];
  return (
    <div className="f-marquee">
      <div
        className={`f-marquee-track${reverse ? " f-reverse" : ""}`}
        style={{ gap: "1.5rem", paddingRight: "1.5rem", ["--f-marquee-duration" as string]: "95s" }}
      >
        {doubled.map((tweet, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: duplicated marquee list
          <TweetCard key={`${tweet.handle}-${i}`} tweet={tweet} />
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section style={{ padding: "5.5rem 0", overflow: "hidden" }}>
      <Container>
        <Reveal>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              paddingBottom: "3.4rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <h1 className="f-h2">Friends of Family</h1>
              <p className="f-lede">See what people are saying.</p>
            </div>
            <div style={{ paddingTop: "0.75rem" }}>
              <PillButton variant="beige" href="https://twitter.com/family">
                <XIcon size={15} /> Follow Family
              </PillButton>
            </div>
          </div>
        </Reveal>
      </Container>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <MarqueeRow tweets={rowOne} />
        <MarqueeRow tweets={rowTwo} reverse />
      </div>
      <style>{`
        @media (max-width: 640px) {
          .family .f-tweet-card { min-width: 320px !important; max-width: 320px !important; }
        }
      `}</style>
    </section>
  );
}
