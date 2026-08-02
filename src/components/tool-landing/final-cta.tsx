import Link from "next/link";
import { Settings2, Download } from "lucide-react";
import type { ToolConfig } from "@/lib/tools-config";

interface FinalCTAProps {
  tool: ToolConfig;
}

export function FinalCTA({ tool }: FinalCTAProps) {
  return (
    <section
      className="f-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "1.5rem",
        padding: "2.5rem 2.5rem",
        borderRadius: "16px",
        background: "linear-gradient(135deg, var(--ink) 0%, rgba(55, 50, 47, 0.9) 100%)",
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.8rem",
        }}
      >
        <h2
          className="f-h2"
          style={{
            fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
            color: "#fff",
          }}
        >
          Ready to get started?
        </h2>
        <p
          className="f-body"
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "1.05rem",
          }}
        >
          {tool.heroCTA} in under a minute. No sign-up, no account needed.
        </p>
      </div>

      {/* CTA Buttons */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <Link
          href={tool.toolUrl}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.9rem 1.8rem",
            borderRadius: 999,
            background: "var(--rf-green)",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 600,
            transition: "transform 160ms ease, box-shadow 160ms ease",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Settings2 size={18} /> {tool.heroCTA}
        </Link>

        {tool.playStoreUrl && (
          <a
            href={tool.playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.9rem 1.8rem",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.15)",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 600,
              border: "1px solid rgba(255, 255, 255, 0.3)",
              transition: "all 160ms ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            }}
          >
            <Download size={18} /> Get Android App
          </a>
        )}
      </div>

      {/* Trust statement */}
      <p
        style={{
          fontSize: "0.85rem",
          color: "rgba(255, 255, 255, 0.6)",
          marginTop: "0.5rem",
        }}
      >
        ✓ Free forever · ✓ No sign-up · ✓ Your privacy matters
      </p>
    </section>
  );
}
