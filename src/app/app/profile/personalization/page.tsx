import { Suspense } from "react";
import { getUserPreferences } from "@/actions/chat";
import { PageHeader } from "@/components/app-shell/page-header";
import { PersonalizationClient } from "@/components/profile/personalization-client";
import { Skeleton } from "@/components/ui/skeleton";

function PersonalizationSkeleton() {
  return (
    <div className="flex max-w-lg flex-col gap-6 px-4 pb-16 md:px-8">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={`pref-card-${i}`}
          className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

async function PersonalizationData() {
  const preferences = await getUserPreferences();
  return <PersonalizationClient initialPreferences={preferences} />;
}

export default function PersonalizationPage() {
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Personalization"
        description="Tell Redef a bit about you and how you like to be talked to — this shapes every conversation in /talk."
      />
      <Suspense fallback={<PersonalizationSkeleton />}>
        <PersonalizationData />
      </Suspense>
    </div>
  );
}
