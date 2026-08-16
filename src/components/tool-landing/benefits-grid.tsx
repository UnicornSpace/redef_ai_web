import type { ToolConfig, ToolFeature } from "@/lib/tools-config";
import {
  Zap,
  Settings,
  Lock,
  TrendingUp,
  Layers,
  Clock,
  Heart,
  Lightbulb,
  ListChecks,
  Download,
} from "lucide-react";

interface BenefitsGridProps {
  tool: ToolConfig;
}
import type React from "react";
import { motion } from "motion/react";
import { GridPattern } from "@/components/ui/grid-pattern";
import { SectionShell, ContentRail } from "@/components/layout-contract";

// Map icon names to actual icons
const iconMap: Record<string, React.ReactNode> = {
  lightning: <Zap size={20} />,
  customize: <Settings size={20} />,
  private: <Lock size={20} />,
  chart: <TrendingUp size={20} />,
  grid: <Layers size={20} />,
  calendar: <Clock size={20} />,
  heart: <Heart size={20} />,
  lightbulb: <Lightbulb size={20} />,
  printer: <Zap size={20} />,
  checklist: <ListChecks size={20} />,
  download: <Download size={20} />,
};
function FeatureCard({
  feature,
  index,
}: {
  feature: ToolFeature;
  index: number;
}) {
  return (
    <motion.div
      className="relative overflow-hidden bg-background p-6 md:p-8"
      initial={{ opacity: 0, y: 16 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="pointer-events-none absolute inset-0 mask-[radial-gradient(farthest-side_at_top,white,transparent)]">
        <GridPattern
          className="absolute inset-0 size-full stroke-foreground/15"
          height={40}
          width={40}
          x={20}
        />
      </div>
      <div className="relative z-10 [&_svg]:size-5 [&_svg]:text-foreground/70">
        {feature.icon ? iconMap[feature.icon] : <Zap size={20} />}
      </div>
      <h3 className="relative z-10 mt-8 font-medium text-sm md:text-base">
        {feature.title}
      </h3>
      <p className="relative z-10 mt-2 text-muted-foreground text-xs md:text-sm">
        {feature.description}
      </p>
    </motion.div>
  );
}
export function BenefitsGrid({ tool }: BenefitsGridProps) {
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
          Why it works
        </h2>
      </div>
      <SectionShell spacingMode="section">
        <ContentRail maxWidth="max-w-" className="space-y-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-medium text-primary text-xs uppercase tracking-[0.25em]">
              Features
            </p>
            <h2 className="mt-3 text-balance font-medium text-2xl tracking-tight md:text-4xl lg:text-5xl">
              Built for teams that ship every week
            </h2>
            <p className="mt-4 text-muted-foreground text-sm md:text-base">
              Everything you need to plan, build, and launch — without switching
              between a dozen tools.
            </p>
          </div>
          <div className="overflow-hidden border border-border bg-border">
            <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
              {tool.benefits.map((feature, index) => (
                <FeatureCard
                  feature={feature}
                  index={index}
                  key={feature.title}
                />
              ))}
            </div>
          </div>
        </ContentRail>
      </SectionShell>
      {/* <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {tool.benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="f-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
              padding: "1.35rem",
              borderRadius: "12px",
              border: "1px solid var(--line)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "var(--ink)",
                color: "#fff",
              }}
            >
              {benefit.icon ? iconMap[benefit.icon] : <Zap size={20} />}
            </div>

            <h3 className="f-panel-title" style={{ fontSize: "1rem" }}>
              {benefit.title}
            </h3>

            <p className="f-body" style={{ fontSize: "0.9rem" }}>
              {benefit.description}
            </p>
          </div>
        ))}
      </div> */}
    </section>
  );
}
