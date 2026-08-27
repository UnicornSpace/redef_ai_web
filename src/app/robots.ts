import type { MetadataRoute } from "next";

/**
 * This domain used to double as the marketing site — that content (home
 * page, /tools, /blog, /pricing, etc.) has moved to a separate site (see
 * src/middleware.ts). Everything left here is either gated behind auth
 * (/app, /admin, /onboarding) or a non-content API surface (/auth, /api),
 * and any other path just redirects to /app now — none of it has SEO
 * value, so there's nothing left worth crawling on this domain.
 *
 * If a future public route ever gets added back here, add it to
 * src/middleware.ts's ALLOWED_PREFIXES first — this file follows from
 * that, not the other way around.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
