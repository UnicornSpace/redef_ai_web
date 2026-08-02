import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getChallenge } from "@/actions/challenges";
import { PageHeader } from "@/components/app-shell/page-header";
import { ChallengeDetailClient } from "@/components/challenges/challenge-detail-client";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/server";

function ChallengeDetailSkeleton() {
  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-3 px-4 pt-8 pb-2 md:px-8">
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="flex flex-col gap-5 px-4 pb-16 md:px-8">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="rounded-2xl border border-line bg-paper">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`p-${i}`}
              className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
            >
              <Skeleton className="size-6 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function ChallengeDetailData({ id }: { id: string }) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  const result = await getChallenge(id);
  if (!result) notFound();

  return (
    <div className="flex w-full flex-col">
      <PageHeader title={result.challenge.name} />
      <ChallengeDetailClient
        challenge={result.challenge}
        initialParticipants={result.participants}
        currentUserId={user.user?.id ?? ""}
      />
    </div>
  );
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<ChallengeDetailSkeleton />}>
      <ChallengeDetailData id={id} />
    </Suspense>
  );
}
