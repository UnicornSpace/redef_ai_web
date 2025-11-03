import FAQSection from "@/components/landingpage/faq-section";
import PricingSection from "@/components/landingpage/pricing-section";
import React from "react";

const page = () => {
  return (
    <div>
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />
    </div>
  );
};

export default page;
