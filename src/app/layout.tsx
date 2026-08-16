import type { Metadata } from "next";
import { Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { CuelumeBind } from "@/components/cuelume-bind";
import { ReferralCapture } from "@/components/referral-capture";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { GoogleAnalytics } from "@next/third-parties/google";

const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });

const geistSans = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
});

// const geistMono = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
// });
// const geistMono = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
// });
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://redefai.app",
  ),
  // NOT using a title template ("%s | Redef AI") — most pages across the
  // site already hand-append " | Redef AI" themselves (see tool-metadata.ts,
  // /tools, /tools/pomodoro-timer). A template would double the brand
  // suffix on every one of them. Fix would be to strip the manual suffixes
  // site-wide and switch everyone to the template convention, but that's a
  // separate cleanup from what's addressed here.
  title: "Redef AI — Your desire to productivity ends here",
  description: "Voice-first AI powered productivity system for your daily life",
  applicationName: "Redef AI",
  // Sane defaults every page inherits unless it overrides them — most pages
  // in this app didn't set openGraph/twitter/robots at all before this, so
  // they fell back to nothing (no image, no card type) rather than to
  // something reasonable.
  openGraph: {
    type: "website",
    siteName: "Redef AI",
    locale: "en_US",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Redef AI" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@redefai",
    creator: "@redefai",
  },
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning on <html> and <body> silences hydration
    // mismatches for attributes that browser extensions inject BEFORE React
    // hydrates — Grammarly adds `data-new-gr-c-s-check-loaded` and
    // `data-gr-ext-installed`, ColorZilla adds `cz-shortcut-listen`, dark-
    // mode extensions add `data-theme`, etc. We can't stop the extensions
    // and none of these ever indicate a real bug. Critically,
    // `suppressHydrationWarning` only suppresses mismatches on the tagged
    // element itself — child components still surface real hydration bugs
    // normally (React docs: "It only works one level deep"). Both <html>
    // and <body> get it because different extensions target different ones.
    <html
      lang="en"
      className={cn(interHeading.variable)}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased  bg-[#F7F5F3]`}
        suppressHydrationWarning
      >
        <ReferralCapture />
        <CuelumeBind />
        {children}
        <GoogleAnalytics gaId="G-QYVV88TBCX" />

        <Toaster />
      </body>
    </html>
  );
}
