import { Suspense } from "react";
import { getMyProfile } from "@/actions/profile";
import { getMyStandards } from "@/actions/standards";
import { PageHeader } from "@/components/app-shell/page-header";
import { StandardsClient } from "@/components/profile/standards-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserBaseline } from "@/lib/baseline";
import { DEFAULT_ENABLED_MODULES } from "@/lib/modules";
import { createClient } from "@/lib/server";

function StandardsSkeleton() {
  return (
    <div className="flex max-w-lg flex-col gap-6 px-4 pb-16 md:px-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={`standards-card-${i}`} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}

async function StandardsData() {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;

  const [standards, profile] = await Promise.all([
    getMyStandards(),
    getMyProfile(),
  ]);
  const enabledModules = profile?.enabled_modules ?? DEFAULT_ENABLED_MODULES;
  const baseline = userId
    ? await getUserBaseline(supabase, userId, enabledModules)
    : {
        windowDays: 28,
        insufficientData: true,
        deepWork: null,
        habits: null,
        tasks: null,
      };

  return <StandardsClient initialStandards={standards} baseline={baseline} />;
}

export default function StandardsPage() {
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Work standards"
        description="What a good day looks like for you — so Redef measures you against your bar, not a generic one."
      />
      <Suspense fallback={<StandardsSkeleton />}>
        <StandardsData />
      </Suspense>
    </div>
  );
}
