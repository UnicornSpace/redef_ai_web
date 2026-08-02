"use client";

import { Container, Reveal } from "./shared";

const posts = [
  {
    href: "https://family.co/blog/why-family-accounts",
    image: "https://family.co/media/why-family-accounts.png",
    date: "Published 13 May, 2025",
    title: "The Crypto Wallet Problem – Why We Created Family Accounts",
    excerpt:
      "Traditional wallets rely on seed phrases and private keys, but this approach has fundamental flaws. Losing access to your bank account because you misplaced a single piece of information would be unthinkable—yet in crypto, this remains a common reality. Most users struggle with managing seed phrases and private keys, often resorting to insecure storage methods like screenshots or digital notes.",
  },
  {
    href: "https://family.co/blog/family-accounts",
    image: "https://family.co/media/family-accounts.png",
    date: "Published 2 April, 2025",
    title: "Making Family Simpler & Safer",
    excerpt:
      "We're thrilled to announce a major upgrade to Family—designed to make onboarding and navigating Ethereum simpler and safer than ever. Born from our own need for seamless yet secure crypto experiences, these features offer the easiest path to getting onchain.",
  },
];

export function BlogSection() {
  return (
    <Container>
      <section id="blog" style={{ padding: "5.5rem 0" }}>
        <Reveal>
          <h1 className="f-h2" style={{ paddingBottom: "2.4rem" }}>
            The latest from Family
          </h1>
        </Reveal>
        <div className="f-blog-grid">
          {posts.map((post, i) => (
            <Reveal key={post.href} delay={i * 0.1}>
              <a
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                className="f-blog-card"
                style={{ display: "flex", flexDirection: "column", gap: "1.1rem", textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.05)",
                    lineHeight: 0,
                  }}
                >
                  <img
                    src={post.image}
                    alt={post.title}
                    style={{ width: "100%", height: "auto", display: "block", aspectRatio: "2160 / 1140", objectFit: "cover" }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: "0.86rem", fontWeight: 500, color: "var(--body-muted)" }}>{post.date}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <h5
                    style={{
                      margin: 0,
                      fontSize: "1.28rem",
                      fontWeight: 650,
                      letterSpacing: "-0.02em",
                      color: "var(--foreground)",
                      lineHeight: 1.25,
                    }}
                  >
                    {post.title}
                  </h5>
                  <p
                    className="f-body"
                    style={{
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {post.excerpt}
                  </p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
        <style>{`
          .family .f-blog-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
          .family .f-blog-card img { transition: transform .5s ease; }
          .family .f-blog-card:hover img { transform: scale(1.025); }
          @media (max-width: 820px) {
            .family .f-blog-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </section>
    </Container>
  );
}
