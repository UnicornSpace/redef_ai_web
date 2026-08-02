import type { Metadata } from "next";
import { Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { ReferralCapture } from "@/components/referral-capture";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

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
  title: "Redef AI",
  description: "Voice-first AI powered productivity system for your daily life",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(interHeading.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased  bg-[#F7F5F3]`}
      >
        <ReferralCapture />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
