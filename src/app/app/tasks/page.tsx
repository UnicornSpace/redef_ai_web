import { Suspense } from "react";
import { listTasks } from "@/actions/tasks";
import {
  ListRowsSkeleton,
  PageHeader,
} from "@/components/app-shell/page-header";
import { TasksClient } from "@/components/tasks/tasks-client";

async function TasksData() {
  const tasks = await listTasks();
  return <TasksClient initialTasks={tasks} />;
}

export default function TasksPage() {
  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Tasks"
        description="Everything you need to do, captured by voice and kept in sync with your calendar."
      />
      <Suspense fallback={<ListRowsSkeleton rows={5} />}>
        <TasksData />
      </Suspense>
    </div>
  );
}
