import type { Metadata } from "next";
import { Suspense } from "react";
import { loadBoard } from "@/lib/server/queries";
import { GanttView, type GanttZoom } from "@/components/tasks/gantt-view";
import { ViewSkeleton } from "@/components/tasks/view-skeleton";

export const metadata: Metadata = { title: "간트차트" };

const ZOOMS: GanttZoom[] = ["day", "week", "month"];

export default function GanttPage({ searchParams }: PageProps<"/tasks/gantt">) {
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <GanttData searchParams={searchParams} />
    </Suspense>
  );
}

async function GanttData({ searchParams }: { searchParams: PageProps<"/tasks/gantt">["searchParams"] }) {
  const [{ projects, tasks, today }, sp] = await Promise.all([loadBoard(), searchParams]);
  const zoom = ZOOMS.find((z) => z === sp.zoom) ?? "week";
  return <GanttView projects={projects} tasks={tasks} today={today} zoom={zoom} />;
}
