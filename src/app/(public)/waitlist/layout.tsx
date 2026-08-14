import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

// Kept title/description so shared links (Twitter, WhatsApp, iMessage)
// still render a proper preview when someone circulates the waitlist URL —
// noindex only tells search crawlers not to list the page, it doesn't
// break OG previews.
const TITLE = "Join the Waitlist | Redef AI";
const DESCRIPTION =
  "Get early access to Redef AI — the voice-first productivity system for your calendar, tasks, habits, and deep work.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/waitlist",
  },
  // The waitlist is a signup funnel step, not a discovery surface — see
  // SITEMAP_IGNORED_ROUTES in src/app/sitemap.ts. NOINDEX_METADATA spreads
  // last so its `robots: { index: false, follow: false }` wins.
  ...NOINDEX_METADATA,
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
