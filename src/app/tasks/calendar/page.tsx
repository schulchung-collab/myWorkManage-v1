import type { Metadata } from "next";
import { Suspense } from "react";
import { loadBoard } from "@/lib/server/queries";
import { isMonthKey, monthKey } from "@/lib/dates";
import { CalendarView } from "@/components/tasks/calendar-view";
import { ViewSkeleton } from "@/components/tasks/view-skeleton";

export const metadata: Metadata = { title: "월별 달력" };

export default function CalendarPage({ searchParams }: PageProps<"/tasks/calendar">) {
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <CalendarData searchParams={searchParams} />
    </Suspense>
  );
}

async function CalendarData({ searchParams }: { searchParams: PageProps<"/tasks/calendar">["searchParams"] }) {
  const [{ projects, tasks, today }, sp] = await Promise.all([loadBoard(), searchParams]);
  const raw = typeof sp.month === "string" ? sp.month : "";
  const month = isMonthKey(raw) ? raw : monthKey(today);
  return <CalendarView projects={projects} tasks={tasks} today={today} month={month} />;
}
