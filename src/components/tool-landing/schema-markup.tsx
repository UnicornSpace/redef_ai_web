import type { ToolConfig } from "@/lib/tools-config";

interface SchemaMarkupProps {
  tool: ToolConfig;
  baseUrl?: string;
}

export function SchemaMarkup({ tool, baseUrl = "https://redefai.app" }: SchemaMarkupProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // Breadcrumb schema
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Tools",
            item: `${baseUrl}/tools`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tool.name,
            item: `${baseUrl}${tool.canonicalUrl}`,
          },
        ],
      },

      // SoftwareApplication schema
      {
        "@type": "SoftwareApplication",
        name: tool.title,
        description: tool.description,
        applicationCategory: "ProductivityApplication",
        operatingSystem: "Web",
        ...(tool.playStoreUrl && {
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            url: tool.playStoreUrl,
          },
        }),
      },

      // FAQ schema
      {
        "@type": "FAQPage",
        mainEntity: tool.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },

      // Article/WebPage schema (for SEO content)
      {
        "@type": "WebPage",
        name: tool.title,
        description: tool.description,
        url: `${baseUrl}${tool.canonicalUrl}`,
        isPartOf: {
          "@type": "WebSite",
          name: "Redef AI",
          url: baseUrl,
        },
        inLanguage: "en-US",
        mainEntity: {
          "@type": "SoftwareApplication",
          name: tool.title,
        },
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
