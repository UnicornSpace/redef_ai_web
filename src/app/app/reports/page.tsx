import { Sparkles } from "lucide-react";
import { Suspense } from "react";
import {
  getLatestWeeklyReportSnapshot,
  getWeeklyReport,
  markWeeklyReportsSeen,
} from "@/actions/reports";
import type { RecapEntry } from "@/components/recap/recap-client";
import { RecapClient } from "@/components/recap/recap-client";
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return <Skeleton className="h-20 w-full rounded-2xl" />;
}

async function RecapSections() {
  // The stored snapshot is what actually got emailed on Sunday — showing
  // it here (rather than always recomputing live) means the page, the
  // popup, and the inbox never disagree. Only fall back to a live compute
  // if the cron hasn't produced one for this user yet (brand-new account,
  // or the very first week before it's run once).
  const snapshot = await getLatestWeeklyReportSnapshot();
  const report = snapshot ? snapshot.data : await getWeeklyReport();

  if (!report) {
    return (
      <p className="px-4 text-sm text-body-muted md:px-8">
        Sign in to see your recap.
      </p>
    );
  }

  if (snapshot && !snapshot.seenAt) {
    // Fire-and-forget — viewing the page directly (not just the toast)
    // should also clear the "unseen" flag so the popup doesn't nag again.
    void markWeeklyReportsSeen();
  }

  const entries: RecapEntry[] = [
    {
      id: snapshot?.id ?? "live",
      title: snapshot ? "Last week" : "This week so far",
      subtitle: report.windowLabel,
      report,
      isNew: Boolean(snapshot && !snapshot.seenAt),
      streakDays: report.habits?.bestStreak,
    },
  ];

  return <RecapClient entries={entries} />;
}

export default function ReportsPage() {
  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-3 px-4 pt-8 pb-4 md:px-8">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-g-green-pale px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-rf-green-deep">
          <Sparkles size={13} />
          Recap
        </span>
        <h1 className="text-balance text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
          Your week, recapped
        </h1>
        <p className="max-w-xl text-pretty text-sm text-body-muted md:text-base">
          Tap to play through how your week went — against last week and your
          trailing month. A fresh one lands every Sunday.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-col gap-2 px-4 pb-10 md:px-8">
            {Array.from({ length: 2 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <CardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <RecapSections />
      </Suspense>
    </div>
  );
}
