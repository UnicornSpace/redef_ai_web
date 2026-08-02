import { Suspense } from "react";
import { listProjects, listSessions } from "@/actions/deepwork";
import {
  ListRowsSkeleton,
  PageHeader,
  StatTilesSkeleton,
} from "@/components/app-shell/page-header";
import { DeepWorkClient } from "@/components/deep-work/deep-work-client";

async function DeepWorkData() {
  const [projects, sessions] = await Promise.all([
    listProjects(),
    listSessions(),
  ]);
  return (
    <DeepWorkClient initialProjects={projects} initialSessions={sessions} />
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
