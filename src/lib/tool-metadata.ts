import type { Metadata } from "next";
import type { ToolConfig } from "./tools-config";

/**
 * Generate Next.js Metadata for tool landing pages
 * Includes title, description, Open Graph, Twitter cards, and canonical URLs
 */
export function generateToolMetadata(
  tool: ToolConfig,
  baseUrl = "https://redefai.app"
): Metadata {
  const fullTitle = `${tool.title} | Redef AI`;
  const fullUrl = `${baseUrl}${tool.canonicalUrl}`;
  const ogImage = tool.ogImage ? `${baseUrl}${tool.ogImage}` : `${baseUrl}/og-default.png`;

  return {
    title: fullTitle,
    description: tool.description,
    keywords: tool.keywords,
    authors: [{ name: "Redef AI" }],
    creator: "Redef AI",
    publisher: "Redef AI",

    // Canonical and alternate URLs
    alternates: {
      canonical: tool.canonicalUrl,
    },

    // OpenGraph (Facebook, LinkedIn, etc.)
    openGraph: {
      type: "website",
      url: fullUrl,
      title: fullTitle,
      description: tool.description,
      siteName: "Redef AI",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${tool.name} - ${tool.tagline}`,
          type: "image/png",
        },
      ],
      locale: "en_US",
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: tool.description,
      images: [ogImage],
      creator: tool.twitterHandle || "@redefai",
      site: "@redefai",
    },

    // Mobile Web App
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 5,
    },

    // Verification and robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    // Apple/Mobile specific
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: tool.name,
    },

    // Manifest for PWA
    manifest: "/manifest.json",

    // Additional metadata
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },

    // Verification tags (add your verification codes here)
    verification: {
      // google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
    },
  };
}

/**
 * Generate breadcrumb structured data for JSON-LD
 */
export function generateBreadcrumbSchema(tool: ToolConfig, baseUrl = "https://redefai.app") {
  return {
    "@context": "https://schema.org",
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
  };
}

/**
 * Generate SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema(
  tool: ToolConfig,
  baseUrl = "https://redefai.app"
) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    description: tool.description,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: `${baseUrl}${tool.canonicalUrl}`,
    ...(tool.playStoreUrl && {
      downloadUrl: tool.playStoreUrl,
    }),
    ...(tool.appStoreUrl && {
      downloadUrl: tool.appStoreUrl,
    }),
    ...(tool.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: tool.rating.toString(),
        ratingCount: "1000", // You can make this dynamic
      },
    }),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(tool: ToolConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

/**
 * Generate Article/WebPage schema for SEO
 */
export function generateArticleSchema(
  tool: ToolConfig,
  baseUrl = "https://redefai.app"
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}${tool.canonicalUrl}`,
    url: `${baseUrl}${tool.canonicalUrl}`,
    name: tool.title,
    description: tool.description,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}#website`,
      name: "Redef AI",
      url: baseUrl,
    },
    dateModified: new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "Redef AI",
      url: baseUrl,
    },
    inLanguage: "en-US",
    potentialAction: {
      "@type": "ReadAction",
      target: `${baseUrl}${tool.canonicalUrl}`,
    },
  };
}
