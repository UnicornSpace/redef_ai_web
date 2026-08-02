"use client";

import { Manrope } from "next/font/google";
import type { ToolConfig } from "@/lib/tools-config";
import "@/styles/redef-theme.css";

import { MotionProvider } from "@/components/new-landing-page-components/shared";
import { BenefitsGrid } from "./benefits-grid";
import { ExamplesSection } from "./examples-section";
import { FAQSection } from "./faq-section";
import { FeaturesGrid } from "./features-grid";
import { FinalCTA } from "./final-cta";
import { HeroSection } from "./hero-section";
import HowItWorksBlock from "./how-it-works";
import { ProblemSolution } from "./problem-solution";
import { RelatedTools } from "./related-tools";
import { SchemaMarkup } from "./schema-markup";
import { SocialProof } from "./social-proof";
import { UseCases } from "./use-cases";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

interface ToolLandingTemplateProps {
  tool: ToolConfig;
  children?: React.ReactNode; // For additional custom content sections
}

export function ToolLandingTemplate({
  tool,
  children,
}: ToolLandingTemplateProps) {
  return (
    <div className={`redef ${manrope.className}`}>
      {/* JSON-LD Schema Markup */}
      <SchemaMarkup tool={tool} />

      <MotionProvider>
        <main>
          <article
            className="f-container"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4.5rem",
              padding: "3.5rem 0 4.5rem",
            }}
          >
            {/* 1. Hero Section */}
            <HeroSection tool={tool} />

            {/* 2. Social Proof */}
            <SocialProof tool={tool} />
            {/* 7. Features Grid */}
            {/* <FeaturesGrid tool={tool} /> */}
            <HowItWorksBlock />

            {/* 3. Problem + Solution */}
            <ProblemSolution tool={tool} />

            {/* 4. Benefits Grid */}
            <BenefitsGrid tool={tool} />

            {/* 5. Examples (Before/After) */}
            {/* <ExamplesSection tool={tool} /> */}

            {/* 6. Use Cases */}
            <UseCases tool={tool} />

            {/* 8. Custom Content (if provided) */}
            {children}

            {/* 9. Related Tools */}
            <RelatedTools tool={tool} maxTools={3} />

            {/* 10. FAQ Section */}
            <FAQSection tool={tool} />

            {/* 11. Final CTA */}
            <FinalCTA tool={tool} />
          </article>
        </main>
      </MotionProvider>
    </div>
  );
}
