import type { Metadata } from "next";
import { Suspense } from "react";
import { loadBoard } from "@/lib/server/queries";
import { TaskListView } from "@/components/tasks/list-view";
import { ViewSkeleton } from "@/components/tasks/view-skeleton";

export const metadata: Metadata = { title: "업무 목록" };

export default function TaskListPage() {
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <ListData />
    </Suspense>
  );
}

async function ListData() {
  const { projects, tasks, today } = await loadBoard();
  return <TaskListView projects={projects} tasks={tasks} today={today} />;
}
