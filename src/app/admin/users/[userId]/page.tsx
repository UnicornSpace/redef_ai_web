import { notFound } from "next/navigation";
import { type AdminRange, getUserActivityDetail } from "@/actions/admin";
import { PageHeader } from "@/components/app-shell/page-header";
import { UserActivityClient } from "@/components/admin/user-activity-client";

const RANGES: AdminRange[] = ["1d", "7d", "30d", "all"];

function parseRange(value: string | undefined): AdminRange {
  return RANGES.includes(value as AdminRange) ? (value as AdminRange) : "all";
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { userId } = await params;
  const { range: rangeParam } = await searchParams;
  const range = parseRange(rangeParam);
  const detail = await getUserActivityDetail(userId, range);
  if (!detail) notFound();

  return (
    <div className="flex w-full flex-col">
      {/* <PageHeader
        title={detail.displayName}
        description={detail.username ? `@${detail.username}` : (detail.email ?? undefined)}
      /> */}
      <UserActivityClient detail={detail} range={range} />
    </div>
  );
}
