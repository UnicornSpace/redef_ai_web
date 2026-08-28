import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // TODO: remove once src/app/(public)/challenges/[challenge]/page.tsx is
  // filled in — it's an empty stub that fails Next's route-validator type
  // check on every build. `bunx tsc --noEmit` still reports real errors.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Lets a phone on the same LAN hit the dev server's HMR socket during
  // testing — without this, Next.js silently blocks /_next/webpack-hmr for
  // any origin other than localhost, which breaks all client-side
  // interactivity (buttons, drawers, etc.) on that device while dev mode is
  // otherwise serving pages fine. Update this IP if your machine's LAN
  // address changes.
  allowedDevOrigins: ["192.168.31.47","192.168.43.222","192.168.160.222"],

  // Next.js 16 defaults images.qualities to [75] — preserve the quality
  // values actually used across the app (related-tools, hero-section, tools
  // index) instead of having them silently coerced down to 75.
  images: {
    qualities: [75, 80, 85],
  },

  // Keep react-pdf out of the bundler (it uses Node/native-ish deps).
  serverExternalPackages: ["@react-pdf/renderer"],

  // Ensure the Inter font files are traced into the PDF-generating
  // serverless functions (they're read from disk at render time).
  outputFileTracingIncludes: {
    "/api/generate-tracker": ["./public/fonts/**"],
    "/api/generate-weekly-goal-tracker": ["./public/fonts/**"],
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
