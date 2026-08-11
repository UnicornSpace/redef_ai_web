import { SITE_FAQS } from "@/lib/site-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://redefai.app";

/**
 * Homepage structured data — Organization + WebSite (for brand/entity
 * recognition and sitelinks search box eligibility), SoftwareApplication
 * (this is a product, not a blog), and FAQPage (mirrors the on-page FAQ
 * section; the ai-seo/seo-geo skills both flag FAQ schema as one of the
 * highest-leverage additions for AI-answer-engine citation, +40% in the
 * Princeton GEO study).
 */
export function HomepageSchema() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "Redef AI",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        name: "Redef AI",
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: "Redef AI",
        description:
          "Voice-first AI powered productivity system for your daily life. Calendar, tasks, habits, and deep work — one brain, spoken.",
        applicationCategory: "ProductivityApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: SITE_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
