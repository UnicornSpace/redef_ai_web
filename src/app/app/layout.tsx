import { Manrope } from "next/font/google";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import "@/styles/redef-theme.css";

import { captureReferral } from "@/actions/chat";
import { getMyProfile } from "@/actions/profile";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileFabProvider } from "@/components/app-shell/mobile-fab-context";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { MobileTopHeader } from "@/components/app-shell/mobile-top-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DEFAULT_ENABLED_MODULES } from "@/lib/modules";
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
  const email = data.claims.user_metadata?.email as string | undefined;
  const avatarUrl = (data.claims.user_metadata?.avatar_url ??
    data.claims.user_metadata?.picture) as string | undefined;

  // Persist a ?ref= cookie the ReferralCapture component dropped earlier
  // (root layout, on first pageview) now that we know who's signed in.
  // Every /app/* page hits this layout, so this is the one place that's
  // guaranteed to run regardless of how the user signed in — waiting for
  // them to find the referral settings page on their own would miss almost
  // everyone. captureReferral is first-write-wins, so repeat visits are
  // free no-ops (cheap cookie check before any DB call).
  const cookieStore = await cookies();
  const referredCode = cookieStore.get("rf_ref")?.value;
  if (referredCode) {
    await captureReferral(referredCode);
  }

  const profile = await getMyProfile();
  if (!profile?.onboarded_at) {
    redirect("/onboarding");
  }
  const enabledModules = profile.enabled_modules ?? DEFAULT_ENABLED_MODULES;

  return (
    <div className={`redef redef-surface ${manrope.className}`}>
      <MobileFabProvider>
        <SidebarProvider>
          <AppSidebar enabledModules={enabledModules} />
          <main className="flex w-full flex-1 flex-col">
            <MobileTopHeader avatarUrl={avatarUrl} email={email} />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col pb-24 md:pb-0">
              {children}
            </div>
          </main>
          <MobileTabBar enabledModules={enabledModules} />
        </SidebarProvider>
      </MobileFabProvider>
    </div>
  );
}
