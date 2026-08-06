import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import "@/styles/redef-theme.css";
import { EchoMascot, RedefLogo } from "@/components/new-landing-page-components/shared";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

/**
 * Shared chrome for every /auth/* page — same redef background, logo, and
 * card language as the marketing home page, so signing in doesn't feel
 * like landing on a different, generic product. Pages only own their
 * heading/subtitle/fields; this owns the page-level look.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className={`redef redef-root ${manrope.className}`}>
      <div className="flex min-h-full w-full flex-col items-center justify-center px-4 py-12">
        <a href="/" aria-label="Redef AI home" className="mb-8">
          <RedefLogo height={26} />
        </a>

        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-line bg-paper p-8 shadow-[0_1px_2px_rgba(55,50,47,0.06)] sm:p-10">
          <EchoMascot size={64} />
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm text-body-muted">{subtitle}</p>
            ) : null}
          </div>
          <div className="w-full">{children}</div>
        </div>

        <p className="mt-8 text-center text-xs text-body-muted">
          Voice-first AI productivity — calendar, tasks, habits, and deep
          work, one brain, spoken.
        </p>
      </div>
    </div>
  );
}
