import { SITE_FAQS } from "@/lib/site-faqs";

/**
 * FAQPage schema for /pricing — reuses the same FAQ content shown on the
 * page (faq-section.tsx), which is identical to the homepage's FAQ. See
 * homepage-schema.tsx for the equivalent on /.
 */
export function PricingSchema() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SITE_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
