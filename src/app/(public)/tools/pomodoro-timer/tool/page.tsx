import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "@/styles/redef-theme.css";
import { HabitBuilder } from "@/components/habit-tracker/habit-builder";
import { MotionProvider } from "@/components/new-landing-page-components/shared";
import { NOINDEX_METADATA } from "@/lib/seo";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

// This route has no Pomodoro-specific content — it's a copy-paste of
// /tools/habit-challenge-sheet-generator/tool (same copy, same "Back to
// the guide" link, even the same canonical pointing at that other page).
// Noindexed until either a real Pomodoro tool is built here or the route
// is removed — leaving it live and indexable would put duplicate content
// under two URLs, one of which (this one) actively tells Google its
// canonical lives elsewhere.
export const metadata: Metadata = {
  title: "Build Your Habit Tracker Sheet | Redef AI",
  description:
    "Configure your challenge length and habits, then download a free, print-ready PDF habit tracker. Works for prayers, meals, water, deep work — any habit you type.",
  alternates: { canonical: "/tools/pomodoro-timer/tool" },
  ...NOINDEX_METADATA,
};

export default function HabitTrackerToolPage() {
  return (
    <div className={`redef ${manrope.className}`}>
      <MotionProvider>
        <main
          className="f-container"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1100,
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              padding: "2.5rem 0 4rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <a
                href="/tools/habit-challenge-sheet-generator"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  width: "fit-content",
                  fontSize: "0.9rem",
                  fontWeight: 650,
                  color: "var(--body-muted)",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={16} /> Back to the guide
              </a>
              <h1
                className="f-h2"
                style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)" }}
              >
                Build your habit tracker
              </h1>
              <p
                className="f-lede"
                style={{ maxWidth: 560, fontSize: "1.02rem" }}
              >
                Set the length, add the habits you want to track, and download a
                clean, print-ready PDF. Print it and fill it in by hand each day
                — no account, no filled-in data, just your template.
              </p>
            </div>

            <HabitBuilder />
          </div>
        </main>
      </MotionProvider>
    </div>
  );
}
