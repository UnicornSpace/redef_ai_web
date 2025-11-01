import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/header";

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
  title: "Redef AI",
  description: "Voice-first AI powered productivity system for your daily life",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F1EDE7]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
