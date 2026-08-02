import type { ToolConfig } from "@/lib/tools-config";
import { AspectRatio } from "../ui/aspect-ratio";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FeaturesGridProps {
  tool: ToolConfig;
}

export function FeaturesGrid({ tool }: FeaturesGridProps) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <div>
        <h2 className="f-h2" style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)" }}>
          Features
        </h2>
        <p className="f-body" style={{ marginTop: "0.5rem" }}>
          Everything you need, nothing you don't.
        </p>
      </div>

      <div className="space-y-10">
        {tool.features.map((feature, i) => (
          <div key={feature.title} className={cn(" flex gap-2 justify-between w-full p-4 max-h-72", i % 2 === 0 ? "flex-col md:flex-row" : "flex-col md:flex-row-reverse")}>
            <AspectRatio ratio={16 / 9} className="">
              <Image
                src="/feature_02.png"
                width={400}
                height={280}
                alt="Image"
                className="rounded-md object-cover"
              />
            </AspectRatio>
            <div className="">
              <h3
                className="f-panel-title"
                style={{ fontSize: "1rem", fontWeight: 700 }}
              >
                {feature.title}
              </h3>
              <p
                className="f-body"
                style={{
                  fontSize: "0.9rem",
                  color: "var(--body)",
                  lineHeight: 1.5,
                }}
              >
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
