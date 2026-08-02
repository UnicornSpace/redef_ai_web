import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "@/styles/redef-theme.css";

import { CtaSection } from "../components/new-landing-page-components/cta";
import { DetailsSection } from "../components/new-landing-page-components/details";
import { Explore } from "../components/new-landing-page-components/explore";
import { FaqSection } from "../components/new-landing-page-components/faq";
import {
  InsightSection,
  SpeakSection,
  UnifiedSection,
} from "../components/new-landing-page-components/feature-split";
import { FeaturesGrid } from "../components/new-landing-page-components/features";
import { RedefFooter } from "../components/new-landing-page-components/footer";
import { Hero } from "../components/new-landing-page-components/hero";
import { RedefNav } from "../components/new-landing-page-components/nav";
import { SecuritySection } from "../components/new-landing-page-components/security";
import { Divider, MotionProvider } from "../components/new-landing-page-components/shared";
import { Showcase } from "../components/new-landing-page-components/showcase";
import { StatsSection } from "../components/new-landing-page-components/stats";
import { Testimonials } from "../components/new-landing-page-components/testimonials";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Redef AI — Your desire to productivity ends here",
  description:
    "Voice-first AI powered productivity system for your daily life. Calendar, tasks, habits, and deep work — one brain, spoken.",
};

export default function NewLandingPage() {
  return (
    <div className={`redef redef-root ${manrope.className}`}>
      <MotionProvider>
        <RedefNav />
        <main>
          <Hero />
          <Explore />
          <Divider />
          <Showcase />
          <FeaturesGrid />
          <SpeakSection />
          <Divider />
          <UnifiedSection />
          <Divider />
          <InsightSection />
          <Divider />
          <SecuritySection />
          <StatsSection />
          <Divider />
          <DetailsSection />
          <Divider />
          <Testimonials />
          <Divider />
          <FaqSection />
          <CtaSection />
        </main>
        <RedefFooter />
      </MotionProvider>
    </div>
  );
}
