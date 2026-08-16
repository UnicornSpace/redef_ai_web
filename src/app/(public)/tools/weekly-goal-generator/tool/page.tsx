import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "@/styles/redef-theme.css";
import { WeeklyGoalBuilder } from "@/components/weekly-goal-tracker/weekly-goal-builder";
import { MotionProvider } from "@/components/new-landing-page-components/shared";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Build Your Weekly Goal Planner | Redef AI",
  description:
    "Add your goals, break them into tasks and subtasks, name the rows of a Monday–Sunday grid, and download a free, print-ready weekly planner PDF.",
  alternates: { canonical: "/tools/weekly-goal-generator/tool" },
};

export default function WeeklyGoalPlannerToolPage() {
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
                href="/tools/weekly-goal-generator"
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
                Build your weekly goal planner
              </h1>
              <p
                className="f-lede"
                style={{ maxWidth: 560, fontSize: "1.02rem" }}
              >
                Add your goals, tasks, and subtasks, name the rows of the
                weekly grid, and download a clean, print-ready PDF — or skip
                straight to a fully blank sheet. No account, no saved data.
              </p>
            </div>

            <WeeklyGoalBuilder />
          </div>
        </main>
      </MotionProvider>
    </div>
  );
}
