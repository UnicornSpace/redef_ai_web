import { notFound } from "next/navigation";
import { getUserActivityDetail } from "@/actions/admin";
import { PageHeader } from "@/components/app-shell/page-header";
import { UserActivityClient } from "@/components/admin/user-activity-client";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const detail = await getUserActivityDetail(userId);
  if (!detail) notFound();

  return (
    <div className="flex w-full flex-col">
      {/* <PageHeader
        title={detail.displayName}
        description={detail.username ? `@${detail.username}` : (detail.email ?? undefined)}
      /> */}
      <UserActivityClient detail={detail} />
    </div>
  );
}
