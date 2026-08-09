import {
  type AdminRange,
  type AdminSort,
  getAdminOverview,
  listUsersForAdmin,
} from "@/actions/admin";
import { PageHeader } from "@/components/app-shell/page-header";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

const RANGES: AdminRange[] = ["1d", "7d", "30d", "all"];
const SORTS: AdminSort[] = ["interactions", "tokens", "referrals", "joined"];

function parseRange(value: string | undefined): AdminRange {
  return RANGES.includes(value as AdminRange) ? (value as AdminRange) : "7d";
}

function parseSort(value: string | undefined): AdminSort {
  return SORTS.includes(value as AdminSort)
    ? (value as AdminSort)
    : "interactions";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const sort = parseSort(params.sort);

  const [overview, users] = await Promise.all([
    getAdminOverview(range),
    listUsersForAdmin(range, sort),
  ]);

  return (
    <div className="flex w-full flex-col pt-4">
      {/* <PageHeader
        title="Admin"
        // description="Users, activity, and AI Talk usage across the app."
      /> */}
      <AdminDashboardClient
        overview={overview}
        users={users}
        range={range}
        sort={sort}
      />
    </div>
  );
}
