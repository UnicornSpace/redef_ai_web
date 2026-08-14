import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://redefai.app";

/**
 * Single source of truth for pages we deliberately KEEP OUT of the sitemap.
 * Each entry is the route path (no origin, no trailing slash) plus the
 * reason. Both this file and robots.ts should stay consistent with it;
 * the on-page `NOINDEX_METADATA` is still what actually blocks indexing.
 *
 * Add here when you add a new page that shouldn't be crawled — e.g. a
 * signup funnel step, an investor-only landing page, an internal tool.
 */
export const SITEMAP_IGNORED_ROUTES: {
  route: string;
  reason: string;
}[] = [
  { route: "/waitlist", reason: "Signup funnel — not a discovery page." },
  {
    route: "/blog",
    reason: "Unfinished CMS scaffolding, fetches from a stub API.",
  },
  {
    route: "/article/[slug]",
    reason: "Hardcoded placeholder content until CMS is wired.",
  },
  {
    route: "/tools/pomodoro-timer",
    reason:
      "Placeholder route with no real pomodoro tool (duplicates habit-tracker metadata).",
  },
  {
    route: "/tools/pomodoro-timer/tool",
    reason: "Same as parent — no real content.",
  },
  { route: "/old-landing-page", reason: "Retired homepage clone." },
  { route: "/new-landing-page copy", reason: "Off-brand design experiment." },
  { route: "/testing-page", reason: "Design/testing scratch." },
  { route: "/stats", reason: "Investor-only page." },
  { route: "/download-beta", reason: "Investor-only page." },
  { route: "/product-demo", reason: "Investor-only page." },
  { route: "/1-min-video", reason: "Investor-only page." },
  {
    route: "/whyproductivity",
    reason: "Empty stub, not linked from anywhere yet.",
  },
  {
    route: "/challenges/[challenge]",
    reason: "Empty stub, no real content.",
  },
  {
    route: "/app/**",
    reason: "Signed-in surface — not crawlable and not useful publicly.",
  },
  { route: "/auth/**", reason: "Login/callback flow." },
  { route: "/admin/**", reason: "Admin-only." },
  { route: "/api/**", reason: "API endpoints, not documents." },
  { route: "/onboarding", reason: "Post-signup flow, gated by auth." },
];

/**
 * Sitemap of pages that are real, finished, and meant to be found. If
 * you're about to add something here, first ask: does it belong in
 * SITEMAP_IGNORED_ROUTES above? Omission alone doesn't stop indexing if
 * something links to the page — the on-page `NOINDEX_METADATA` in the
 * ignored routes is the real gate; this list is just the invitation.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tools/habit-challenge-sheet-generator`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/tools/habit-challenge-sheet-generator/tool`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
