import Link from "next/link";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getToolConfig, getAllTools } from "@/lib/tools-config";
import type { ToolConfig } from "@/lib/tools-config";

interface RelatedToolsProps {
  tool: ToolConfig;
  maxTools?: number;
}

export function RelatedTools({ tool, maxTools = 3 }: RelatedToolsProps) {
  // Get related tools by ID or return other tools
  let relatedTools: ToolConfig[] = [];

  if (tool.relatedToolIds && tool.relatedToolIds.length > 0) {
    relatedTools = tool.relatedToolIds
      .map((id) => getToolConfig(id))
      .filter((t) => t !== null) as ToolConfig[];
  } else {
    // Get all tools except current one
    relatedTools = getAllTools().filter((t) => t.id !== tool.id);
  }

  // Limit to maxTools
  relatedTools = relatedTools.slice(0, maxTools);

  if (relatedTools.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <div>
        <h2
          className="f-h2"
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)" }}
        >
          Related tools
        </h2>
        <p className="f-body" style={{ marginTop: "0.5rem" }}>
          Explore other free productivity tools.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {relatedTools.map((relatedTool) => (
          <Link
            key={relatedTool.id}
            href={relatedTool.canonicalUrl}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              padding: "1.2rem",
              borderRadius: "12px",
              background: "var(--paper)",
              border: "1px solid var(--line)",
              textDecoration: "none",
              transition: "all 160ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.borderColor = "var(--body-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "var(--line)";
            }}
          >
            {/* Tool thumbnail */}
            <AspectRatio ratio={16 / 9}>
              <Image
                src={relatedTool.thumbnailUrl}
                alt={relatedTool.name}
                fill
                quality={75}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                style={{
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </AspectRatio>

            {/* Tool info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <h3
                className="f-panel-title"
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {relatedTool.name}
              </h3>
              <p
                className="f-body"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--body-muted)",
                  lineHeight: 1.4,
                }}
              >
                {relatedTool.tagline}
              </p>
            </div>

            {/* Arrow indicator */}
            <div
              style={{
                fontSize: "1.1rem",
                color: "var(--body-muted)",
                marginTop: "auto",
              }}
            >
              →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
