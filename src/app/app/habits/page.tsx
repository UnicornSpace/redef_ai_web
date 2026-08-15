import { Suspense } from "react";
import { listHabits } from "@/actions/habits";
import { CardGridSkeleton } from "@/components/app-shell/page-header";
import { HabitsClient } from "@/components/habits/habits-client";

async function HabitsData() {
  const habits = await listHabits();
  return <HabitsClient initialHabits={habits} />;
}

// PageHeader is rendered INSIDE HabitsClient rather than here so the
// Focus/Cards tabs can sit inline with the "Habits" title on mobile —
// otherwise the tabs live in a separate row below the server-rendered
// header and eat vertical space that mobile users can't spare.
export default function HabitsPage() {
  return (
    <div className="flex w-full flex-col">
      <Suspense fallback={<CardGridSkeleton className="mt-8" cards={4} columns={2} />}>
        <HabitsData />
      </Suspense>
    </div>
  );
}
