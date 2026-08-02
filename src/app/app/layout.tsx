import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import "@/styles/redef-theme.css";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/server";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export default async function AppLayout({ children }: { children: ReactNode }) {
  const hdrs = await headers();
  const pathname =
    hdrs.get("x-invoke-path") ??
    hdrs.get("next-url") ??
    hdrs.get("x-pathname") ??
    "";

  // Habit invite landing pages must stay reachable without a session — chat
  // apps fetch this URL to build a link preview (title/description/OG
  // image), and a forced login redirect would blank that out. The page
  // itself still gates the actual "accept" action on being signed in.
  const isPublicInvite = /^\/app\/habits\/join\//.test(pathname);
  if (isPublicInvite) {
    return (
      <div className={`redef redef-surface ${manrope.className}`}>
        {children}
      </div>
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    // preserve the path the user was trying to reach so login can bounce
    // them back to it — mirrors what middleware does for other routes,
    // but this layout runs before middleware finalizes on the /app subtree
    const url = pathname.startsWith("/")
      ? `/auth/login?redirect=${encodeURIComponent(pathname)}`
      : "/auth/login";
    redirect(url);
  }
  return (
    <div className={`redef redef-surface ${manrope.className}`}>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex w-full flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center border-b border-line px-4 md:hidden">
            <SidebarTrigger className="-ml-1" />
          </header>
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
