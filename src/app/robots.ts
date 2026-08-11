import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://redefai.app";

/**
 * No robots.txt existed at all before this — crawlers (including AI
 * crawlers) had zero guidance on what to index and no sitemap pointer.
 *
 * Explicitly allowing the AI-search crawlers (GPTBot, ChatGPT-User,
 * PerplexityBot, ClaudeBot/anthropic-ai, Google-Extended) matters even
 * though the default rule already allows everyone — some of these bots
 * are new enough that being named explicitly (rather than relying on a
 * bare wildcard) is the safer signal per current AI-SEO guidance.
 *
 * Disallowed:
 * - /app, /auth, /admin, /api — gated or non-content routes, no SEO value
 * - The handful of orphaned/experimental/investor-only public pages that
 *   currently carry a `noindex` meta tag (see those pages for why) — listed
 *   here too as defense in depth, though the meta tag is what actually
 *   keeps them out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/app/",
    "/auth/",
    "/admin/",
    "/api/",
    "/onboarding",
    // Orphaned experiments / investor-only / unfinished stubs — not linked
    // from anywhere in the product, kept noindex on-page as the primary
    // control (see NOINDEX_ROBOTS in src/lib/seo.ts).
    "/new-landing-page*",
    "/old-landing-page",
    "/testing-page",
    "/stats",
    "/download-beta",
    "/product-demo",
    "/1-min-video",
    "/whyproductivity",
    "/blog",
    "/article/",
    "/tools/pomodoro-timer",
    "/challenges/",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Explicit AI-crawler allow rules — same disallow list, named
      // out so blocking them isn't an accident of a future wildcard change.
      {
        userAgent: ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "Bingbot"],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
