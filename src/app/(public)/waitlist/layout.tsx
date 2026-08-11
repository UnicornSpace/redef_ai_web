import type { Metadata } from "next";

const TITLE = "Join the Waitlist | Redef AI";
const DESCRIPTION =
  "Get early access to Redef AI — the voice-first productivity system for your calendar, tasks, habits, and deep work.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/waitlist" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/waitlist",
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
