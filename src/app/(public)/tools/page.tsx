import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Link from "next/link";
import "@/styles/redef-theme.css";
import { MotionProvider } from "@/components/new-landing-page-components/shared";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getAllTools } from "@/lib/tools-config";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

const TITLE = "Free Productivity Tools | Redef AI";
const DESCRIPTION =
  "Free, no-sign-up tools for building better habits and routines — starting with a fully custom printable habit tracker and challenge sheet generator.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/tools",
  },
};

const TOOLS = getAllTools().map((tool) => ({
  href: tool.canonicalUrl,
  title: tool.name,
  blurb: tool.tagline,
  thumbnail: tool.thumbnailUrl,
  tag: "Live",
}));

export default function ToolsPage() {
  return (
    <div className={`redef ${manrope.className}`}>
      <MotionProvider>
        <main>
          <div className="f-container" style={{ padding: "3.5rem 0 4rem" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.9rem",
                maxWidth: 640,
              }}
            >
              {/* <p
                className="f-eyebrow"
                style={{ color: "var(--rf-green-deep)" }}
              >
                Free tools
              </p> */}
              <h1
                className="f-h1"
                style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}
              >
                Tools to help your day run itself.
              </h1>
              <p className="f-lede">
                No sign-up, no catch. Small, focused tools that pair well with a
                voice-first productivity system — starting with a fully
                customizable habit tracker.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group bg-paper rounded-lg flex flex-col bg-card border border-line overflow-hidden transition-all hover:shadow-md hover:border-body-muted"
                >
                  <AspectRatio ratio={16 / 9} className="overflow-hidden">
                    <Image
                      src={tool.thumbnail}
                      alt={`${tool.title} screenshot`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      quality={80}
                    />
                  </AspectRatio>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      flex: 1,
                      padding: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                      }}
                    >
                      <span className="f-panel-title font-bold text-lg">
                        {tool.title}
                      </span>
                      <span className="tool-card-tag">{tool.tag}</span>
                    </div>
                    <span className="f-body text-sm">{tool.blurb}</span>
                  </div>
                  <span
                    className="tool-card-arrow text-lg mr-4 mb-4"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </MotionProvider>
      <style>{`
        .tools-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.1rem;
        }
        .tool-card {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          padding: 1.6rem;
          border-radius: 24px;
          background: var(--paper);
          text-decoration: none;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        a.tool-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 32px rgba(55, 50, 47, 0.1);
        }
        .tool-card-soon {
          opacity: 0.6;
          cursor: default;
        }
        .tool-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          min-width: 46px;
          border-radius: 14px;
        }
        .tool-card-arrow {
          align-self: center;
          font-size: 1.2rem;
          color: var(--body-muted);
        }
        .tool-card-tag {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--rf-green-deep);
          background: var(--g-green-pale);
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
        }
        .tool-card-tag-soon {
          color: var(--body-muted);
          background: rgba(55, 50, 47, 0.06);
        }
      `}</style>
    </div>
  );
}
