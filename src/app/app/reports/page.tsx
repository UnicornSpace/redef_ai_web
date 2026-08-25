import { BarChart3 } from "lucide-react";
import { Suspense } from "react";
import {
  getLatestWeeklyReportSnapshot,
  getWeeklyReport,
  markWeeklyReportsSeen,
} from "@/actions/reports";
import { WeeklyReportView } from "@/components/reports/weekly-report-view";
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return <Skeleton className="h-40 w-full rounded-2xl" />;
}

async function ReportSections() {
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
        Sign in to see your weekly report.
      </p>
    );
  }

  if (snapshot && !snapshot.seenAt) {
    // Fire-and-forget — viewing the page directly (not just the toast)
    // should also clear the "unseen" flag so the popup doesn't nag again.
    void markWeeklyReportsSeen();
  }

  const sourceLabel = snapshot
    ? snapshot.emailedAt
      ? "emailed to you this Sunday"
      : "generated this Sunday"
    : "this week so far, live — your first Sunday report lands this weekend";

  return <WeeklyReportView report={report} sourceLabel={sourceLabel} />;
}

export default function ReportsPage() {
  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-3 px-4 pt-8 pb-2 md:px-8">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-g-green-pale px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-rf-green-deep">
          <BarChart3 size={13} />
          Weekly report
        </span>
        <h1 className="text-balance text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
          How your week went
        </h1>
        <p className="max-w-xl text-pretty text-sm text-body-muted md:text-base">
          Compared to last week and your trailing month — sent fresh every
          Sunday.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 px-4 pb-10 sm:grid-cols-2 lg:grid-cols-3 md:px-8">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton grid
              <CardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ReportSections />
      </Suspense>
    </div>
  );
}
