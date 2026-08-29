import { getUsageAnalytics } from "@/actions/admin";
import { AdminUsageClient } from "@/components/admin/admin-usage-client";

export default async function AdminUsagePage() {
  const data = await getUsageAnalytics();

  return (
    <div className="flex w-full flex-col pt-4">
      <AdminUsageClient data={data} />
    </div>
  );
}
