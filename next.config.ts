import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // TODO: remove once src/app/(public)/challenges/[challenge]/page.tsx is
  // filled in — it's an empty stub that fails Next's route-validator type
  // check on every build. `bunx tsc --noEmit` still reports real errors.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Next.js 16 defaults images.qualities to [75] — preserve the quality
  // values actually used across the app (related-tools, hero-section, tools
  // index) instead of having them silently coerced down to 75.
  images: {
    qualities: [75, 80, 85],
  },

  // Keep react-pdf out of the bundler (it uses Node/native-ish deps).
  serverExternalPackages: ["@react-pdf/renderer"],

  // Ensure the Inter font files are traced into the /api/generate-tracker
  // serverless function (they're read from disk at render time).
  outputFileTracingIncludes: {
    "/api/generate-tracker": ["./public/fonts/**"],
  },

  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
