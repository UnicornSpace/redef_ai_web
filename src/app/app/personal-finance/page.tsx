import { Suspense } from "react";
import { listTransactions } from "@/actions/finance";
import {
  ListRowsSkeleton,
  PageHeader,
  StatTilesSkeleton,
} from "@/components/app-shell/page-header";
import { FinanceClient } from "@/components/finance/finance-client";

async function FinanceData() {
  const transactions = await listTransactions();
  return <FinanceClient initialTransactions={transactions} />;
}

export default function PersonalFinancePage() {
  return (
    <div className="flex w-full flex-col">
      {/* FinanceClient renders the real header — it carries the range/type
          filters, which are client state. The fallback below repeats a
          filter-less copy so the title is on screen immediately and does
          not shift when the data lands. */}
      <Suspense
        fallback={
          <>
            <PageHeader title="Personal Finance" />
            <div className="flex flex-col gap-5 mt-6">
              <StatTilesSkeleton count={3} />
              <ListRowsSkeleton rows={4} />
            </div>
          </>
        }
      >
        <FinanceData />
      </Suspense>
    </div>
  );
}
