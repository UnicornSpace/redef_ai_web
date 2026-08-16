import type { ToolConfig } from "@/lib/tools-config";

interface UseCasesProps {
  tool: ToolConfig;
}

export function UseCases({ tool }: UseCasesProps) {
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
          Use cases
        </h2>
        <p className="f-body" style={{ marginTop: "0.5rem" }}>
          Built for people, not templates.
        </p>
      </div>
      <SectionShell spacingMode="section">
        <ContentRail maxWidth="max-w-6xl" className="space-y-10">
          <div className="max-w-2xl">
            <p className="font-medium text-primary text-xs uppercase tracking-[0.25em]">
              Who it's for
            </p>
            <h2 className="mt-3 text-balance font-medium text-2xl tracking-tight md:text-4xl">
              {tool.tagline}
            </h2>
            <p className="mt-4 text-muted-foreground text-sm md:text-base">
              {tool.problemStatement}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-4 md:grid-rows-2">
            <div className="relative overflow-hidden bg-background p-6 md:col-span-2 md:row-span-2 md:p-8">
              <DecorIcon position="bottom-left" />
              <DecorIcon position="bottom-right" />
              <GridPattern
                className="absolute inset-0 stroke-foreground/[0.05]"
                height={32}
                width={32}
              />
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative flex h-full min-h-56 flex-col justify-between">
                <div>
                  <div className="mb-4 flex size-10 items-center justify-center rounded-[var(--radius-md)] border bg-background/80 text-foreground/80">
                    <SparklesIcon className="size-5" />
                  </div>
                  <p className="font-medium text-primary text-xs uppercase tracking-[0.2em]">
                    {tool.name}
                  </p>
                  <h3 className="mt-3 font-medium text-xl md:text-2xl">
                    {tool.heroTagline}
                  </h3>
                  <p className="mt-3 max-w-md text-muted-foreground text-sm leading-relaxed">
                    {tool.solutionStatement}
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-px bg-border min-[20rem]:grid-cols-3">
                  <div className="space-y-2 bg-background p-3">
                    <p className="font-medium text-lg tracking-tight">
                      {tool.userCount ?? "Free"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tool.userCount ? "People using it" : "No sign-up"}
                    </p>
                  </div>
                  <div className="space-y-2 bg-background p-3">
                    <p className="font-medium text-lg tracking-tight">
                      {tool.rating ? `${tool.rating}★` : "$0"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tool.rating ? "Average rating" : "Forever"}
                    </p>
                  </div>
                  <div className="space-y-2 bg-background p-3">
                    <p className="font-medium text-lg tracking-tight">100%</p>
                    <p className="text-[10px] text-muted-foreground">
                      Print-ready
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {tool.useCases.slice(0, 4).map((feature, index) => (
              <FeatureCard
                description={feature.description}
                icon={features[index % features.length].icon}
                key={feature.audience}
                title={feature.description}
              />
            ))}
          </div>
        </ContentRail>
      </SectionShell>
      {/* <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {tool.useCases.map((useCase) => (
          <div
            key={useCase.audience}
            className="f-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              padding: "1.35rem",
              borderRadius: "12px",
              border: "1px solid var(--line)",
            }}
          >
            <h3
              className="f-panel-title"
              style={{ fontSize: "1.05rem", fontWeight: 700 }}
            >
              {useCase.audience}
            </h3>

            <p
              className="f-body"
              style={{
                fontSize: "0.9rem",
                color: "var(--body)",
                lineHeight: 1.5,
              }}
            >
              {useCase.description}
            </p>

            {useCase.examples && useCase.examples.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                  marginTop: "0.5rem",
                }}
              >
                {useCase.examples.map((example) => (
                  <span
                    key={example}
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "6px",
                      background: "var(--paper)",
                      color: "var(--body-muted)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {example}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div> */}
    </section>
  );
}
function FeatureCard({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative bg-background p-6", className)}>
      <DecorIcon position="top-left" />
      <DecorIcon position="top-right" />
      <div className="mb-4 flex size-10 items-center justify-center rounded-[var(--radius-md)] border bg-muted/50 text-foreground/80">
        {icon}
      </div>
      <h3 className="font-medium text-base">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

import type React from "react";
import {
  BarChart3Icon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";
import { SectionShell, ContentRail } from "@/components/layout-contract";
import { DecorIcon } from "../decor-icon";

const features = [
  {
    title: "Fast onboarding",
    description:
      "Get your team set up in minutes with guided setup and imports.",
    icon: <ZapIcon className="size-5" />,
  },
  {
    title: "Team workspaces",
    description:
      "Shared projects, roles, and permissions built for growing teams.",
    icon: <UsersIcon className="size-5" />,
  },
  {
    title: "Live analytics",
    description: "Track adoption, usage, and outcomes without switching tools.",
    icon: <BarChart3Icon className="size-5" />,
  },
  {
    title: "Enterprise security",
    description:
      "SSO, audit logs, and compliance controls your IT team expects.",
    icon: <ShieldCheckIcon className="size-5" />,
  },
];
