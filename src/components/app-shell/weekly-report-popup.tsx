"use client";

import { BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  hasUnseenWeeklyReport,
  markWeeklyReportsSeen,
} from "@/actions/reports";

/**
 * Mounted once in /app/layout.tsx, so it fires when someone lands on ANY
 * /app page (not just home) — checks once per app session whether the
 * Sunday cron generated a report they haven't seen yet, and surfaces it as
 * a toast rather than a modal so it doesn't block whatever they came here
 * to do.
 */
export function WeeklyReportPopup() {
  const router = useRouter();
  // StrictMode/fast-refresh mounts effects twice in dev — guard against
  // firing the same toast twice, not just against re-fetching.
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;

    hasUnseenWeeklyReport().then((hasUnseen) => {
      if (!hasUnseen) return;
      toast("Your weekly report is ready", {
        description: "See how this week compared to last week and your monthly average.",
        icon: <BarChart3 size={18} />,
        duration: 15000,
        action: {
          label: "View report",
          onClick: () => router.push("/app/reports"),
        },
        onDismiss: () => {
          markWeeklyReportsSeen();
        },
        onAutoClose: () => {
          markWeeklyReportsSeen();
        },
      });
    });
  }, [router]);

  return null;
}
