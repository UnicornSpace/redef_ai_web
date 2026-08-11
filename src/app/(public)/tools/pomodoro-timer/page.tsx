import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

// This page was wrongly using habitTrackerConfig's title/description —
// that's a duplicate-title bug against /tools/habit-challenge-sheet-generator,
// which uses the same config correctly. There's no separate pomodoroConfig
// in tools-config.ts and the body below is a placeholder ("hi"), not the
// actual tool. Noindexed until a real Pomodoro tool config + landing page
// exist — see https://bundui.io/motion/components/countdown for the timer
// component this was presumably scaffolded around.
export const metadata: Metadata = {
  title: "Pomodoro Timer | Redef AI",
  description: "A free Pomodoro timer tool — coming soon.",
  ...NOINDEX_METADATA,
};

export default function PomodoroTimerLandingPage() {
  return <div>

    hi
  </div>;
}
