import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NOINDEX_METADATA } from "@/lib/seo";
import "./family-theme.css";

import { BlogSection } from "./components/blog";
import { CtaSection } from "./components/cta";
import { DetailsSection } from "./components/details";
import { Explore } from "./components/explore";
import { FaqSection } from "./components/faq";
import { ActivitySection, NftSection, WatchSection } from "./components/feature-split";
import { FeaturesGrid } from "./components/features";
import { FamilyFooter } from "./components/footer";
import { Hero } from "./components/hero";
import { FamilyNav } from "./components/nav";
import { Onboarding, SendReceiveSwap } from "./components/phones";
import { SecuritySection } from "./components/security";
import { Divider } from "./components/shared";
import { Testimonials } from "./components/testimonials";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Family — Your favorite crypto wallet",
  description:
    "Explore Ethereum with the best wallet for iOS. Interacting with crypto has never been so simple. (Design experiment clone)",
  ...NOINDEX_METADATA,
};

export default function NewLandingPage() {
  return (
    <div className={`family family-root ${inter.className}`}>
      <FamilyNav />
      <main>
        <Hero />
        <Explore />
        <Divider />
        <SendReceiveSwap />
        <FeaturesGrid />
        <NftSection />
        <Divider />
        <WatchSection />
        <Divider />
        <ActivitySection />
        <Divider />
        <SecuritySection />
        <Onboarding />
        <Divider />
        <BlogSection />
        <Divider />
        <DetailsSection />
        <Divider />
        <Testimonials />
        <Divider />
        <FaqSection />
        <CtaSection />
      </main>
      <FamilyFooter />
    </div>
  );
}
