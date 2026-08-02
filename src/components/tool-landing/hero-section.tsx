import { Settings2, Download, ShieldCheckIcon, UsersIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { ToolConfig } from "@/lib/tools-config";

interface HeroSectionProps {
  tool: ToolConfig;
}

export function HeroSection({ tool }: HeroSectionProps) {
  return (
    <header
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "1.3rem",
      }}
    >
      {/* Badge with trust indicators */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          borderRadius: 999,
          background: "var(--paper)",
          padding: "0.35rem 0.85rem",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "var(--body-muted)",
        }}
      >
        ✓ {tool.trustBadges?.[0] || "Free · No sign-up"}
      </span>

      {/* H1 with primary keyword */}
      <h1 className="f-h1" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
        {tool.title}
      </h1>

      {/* Value proposition */}
      <p className="f-lede" style={{ maxWidth: 580 }}>
        {tool.description}
      </p>

      {/* CTA Buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <Link
          href={tool.toolUrl}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: 999,
            background: "var(--ink)",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 600,
            transition: "transform 160ms ease, box-shadow 160ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Settings2 size={17} /> {tool.heroCTA}
        </Link>

        {tool.heroCTASecondary && (
          <Link
            href="#how-it-works"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: 999,
              background: "var(--paper)",
              color: "var(--ink)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 600,
              border: "1px solid var(--line)",
              transition: "all 160ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--line)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--paper)";
            }}
          >
            {tool.heroCTASecondary}
          </Link>
        )}

        {tool.playStoreUrl && (
          <a
            href={tool.playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: 999,
              background: "var(--paper)",
              color: "var(--ink)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 600,
              border: "1px solid var(--line)",
              transition: "all 160ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--line)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--paper)";
            }}
          >
            <Download size={17} /> Get Android App
          </a>
        )}
      </div>

      {/* Product screenshot */}
      <div style={{ width: "100%", marginTop: "1.5rem" }}>
        <AspectRatio ratio={16 / 9}>
          <Image
            src={tool.thumbnailUrl}
            alt={tool.title}
            fill
            priority
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1000px"
            style={{
              objectFit: "cover",
              borderRadius: "12px",
              border: "1px solid var(--line)",
            }}
          />
        </AspectRatio>
      </div>

      {/* Trust metrics */}
      {(tool.userCount || tool.rating || tool.testimonials?.length) && (
        <div
          style={{
            gap: "2rem",
            marginTop: "1rem",
            fontSize: "0.9rem",
            color: "var(--body-muted)",
            flexWrap: "wrap",
          }}
          className="flex items-center justify-center mx-auto"
        >
          {tool.userCount && <div> <UsersIcon size={20} className="inline-flex text-black"/> {tool.userCount} users</div>}
          {tool.rating && <div>⭐ {tool.rating.toFixed(1)} rating</div>}
          {tool.testimonials && tool.testimonials.length > 0 && (
            <div>
              <ShieldCheckIcon size={20} className="inline-flex text-black" />
              Trusted by creators
            </div>
          )}
        </div>
      )}
    </header>
  );
}
