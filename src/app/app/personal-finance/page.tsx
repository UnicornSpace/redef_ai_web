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
      <PageHeader
        title="Personal Finance"
        // description="Log an expense or income, tag it with a category and a space, and see where your money goes."
      />
      <Suspense
        fallback={
          <div className="flex flex-col gap-5 mt-6">
            <StatTilesSkeleton count={3} />
            <ListRowsSkeleton rows={4} />
          </div>
        }
      >
        <FinanceData />
      </Suspense>
    </div>
  );
}
