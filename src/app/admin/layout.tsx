import { Manrope } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import "@/styles/redef-theme.css";

import { isCurrentUserAdmin } from "@/actions/admin";
import { createClient } from "@/lib/server";
import Image from "next/image";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

/**
 * A deliberately separate shell from /app — this is an internal tool, not a
 * product surface, so it skips the sidebar/mobile-tab-bar/FAB machinery
 * entirely. Not linked from anywhere in the product UI; reached only by
 * visiting /admin directly. Gated on BOTH being signed in and having a row
 * in public.admins (see the 20260809100000_admin.sql migration for how to
 * grant yourself access).
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/auth/login?redirect=%2Fadmin");
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/app");
  }

  return (
    <div className={`redef redef-surface ${manrope.className}`}>
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4 md:px-8">
          <Link
            href="/admin"
            className="text-sm flex items-center gap-2 font-extrabold tracking-tight text-ink"
          >
            <Image
              src="/logo.png"
              alt="Admin"
              width={24}
              height={24}
            />
            <span className="font-semibold">Admin</span>
          </Link>
          <Link
            href="/app"
            className="text-sm font-medium text-body-muted hover:text-ink"
          >
            {"<"} Back to app
          </Link>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
