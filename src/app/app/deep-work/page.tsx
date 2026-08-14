import { Suspense } from "react";
import {
  getDeepworkDailyMinutes,
  listProjects,
  listSessions,
} from "@/actions/deepwork";
import {
  ListRowsSkeleton,
  PageHeader,
  StatTilesSkeleton,
} from "@/components/app-shell/page-header";
import { DeepWorkClient } from "@/components/deep-work/deep-work-client";
import { DeepworkTimeRange } from "@/components/deep-work/deepwork-timerange";

async function ChartsSlot() {
  const dailyMinutes = await getDeepworkDailyMinutes(90);
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-line bg-paper px-0 pt-4 pb-0">
      <DeepworkTimeRange points={dailyMinutes} />
    </div>
  );
}

async function DeepWorkData() {
  const [projects, sessions] = await Promise.all([
    listProjects(),
    listSessions(),
  ]);
  return (
    <DeepWorkClient
      initialProjects={projects}
      initialSessions={sessions}
      belowMetricsSlot={<ChartsSlot />}
    />
  );
}

export default function DeepWorkPage() {
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Deep Work"
        // description="Start a focus session, log time against a project, and see where your hours go."
      />
      <Suspense
        fallback={
          <div className="flex flex-col gap-6 mt-6">
            <StatTilesSkeleton count={2} />
            <ListRowsSkeleton rows={4} />
          </div>
        }
      >
        <DeepWorkData />
      </Suspense>
    </div>
  );
}
