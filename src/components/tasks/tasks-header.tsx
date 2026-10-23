"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartGantt, FolderPlus, List, LoaderCircle, Plus } from "lucide-react";
import { Button, Kbd } from "@/components/ui/button";
import { useWorkspace } from "./workspace";

const TABS = [
  { href: "/tasks/list", label: "목록", icon: List },
  { href: "/tasks/calendar", label: "월별 달력", icon: CalendarDays },
  { href: "/tasks/gantt", label: "간트차트", icon: ChartGantt },
] as const;

export function TasksHeader() {
  const pathname = usePathname();
  const ws = useWorkspace();

  return (
    <header className="border-b border-line bg-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pt-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">업무 관리</h1>
          {ws.refreshing && (
            <LoaderCircle className="size-4 animate-spin text-fg-subtle" aria-label="새로 고치는 중" />
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={() => ws.newProject()} title="새 프로젝트 (P)">
            <FolderPlus className="size-4" aria-hidden />
            <span className="hidden sm:inline">새 프로젝트</span>
          </Button>
          <Button size="sm" variant="primary" onClick={() => ws.newTask()} title="새 업무 (N)">
            <Plus className="size-4" aria-hidden />
            새 업무
            <Kbd>N</Kbd>
          </Button>
        </div>
      </div>
      <nav className="mt-2 flex gap-1 px-3 md:px-4" aria-label="보기 전환">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-10 items-center gap-2 rounded-t-md px-3 text-sm transition-colors duration-150 ${
                active ? "font-semibold text-primary" : "text-fg-muted hover:bg-hover hover:text-fg"
              }`}
            >
              <tab.icon className="size-4" aria-hidden />
              {tab.label}
              {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
