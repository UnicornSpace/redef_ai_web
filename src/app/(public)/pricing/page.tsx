import type { Metadata } from "next";
import FAQSection from "@/components/landingpage/faq-section";
import PricingSection from "@/components/landingpage/pricing-section";
import { PricingSchema } from "@/components/landingpage/pricing-schema";
import React from "react";

const TITLE = "Pricing | Redef AI";
const DESCRIPTION =
  "Redef AI pricing — start free, no credit card required. Voice-first calendar, tasks, habits, and deep work in one plan.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/pricing",
  },
};

const page = () => {
  return (
    <div>
      <PricingSchema />
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />
    </div>
  );
};

export default page;
