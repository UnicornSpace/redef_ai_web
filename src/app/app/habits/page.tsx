import { Suspense } from "react";
import { listHabits } from "@/actions/habits";
import {
  CardGridSkeleton,
  PageHeader,
} from "@/components/app-shell/page-header";
import { HabitsClient } from "@/components/habits/habits-client";

async function HabitsData() {
  const habits = await listHabits();
  return <HabitsClient initialHabits={habits} />;
}

export default function HabitsPage() {
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Habits"
        // description="Track habits solo — prayers, gym, studying, or anything you want to build. Tap a day to mark it done, or fill in past days."
      />
      <Suspense fallback={<CardGridSkeleton className="mt-6" cards={4} columns={2} />}>
        <HabitsData />
      </Suspense>
    </div>
  );
}
