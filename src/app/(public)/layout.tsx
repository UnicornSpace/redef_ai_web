import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/header";

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
    <div>
      <Navbar />

      {children}
      <Toaster />
    </div>
  );
}
