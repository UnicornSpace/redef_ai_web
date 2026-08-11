import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://redefai.app";

/**
 * No sitemap existed at all before this. Lists only the pages that are
 * real, finished, and actually meant to be found — deliberately excludes
 * the orphaned/experimental/investor-only pages under (other) and (vc),
 * the broken /blog + /article/[slug] scaffolding, and /tools/pomodoro-timer
 * (duplicated metadata from the habit-tracker tool, not its own content).
 * Those all carry `noindex` directly (see their page files) rather than
 * just being left out here — omission alone doesn't stop indexing if
 * something links to them.
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
    {
      url: `${SITE_URL}/waitlist`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
