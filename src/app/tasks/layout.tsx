import { Suspense } from "react";
import { loadProjects } from "@/lib/server/queries";
import { WorkspaceProvider } from "@/components/tasks/workspace";
import { TasksHeader } from "@/components/tasks/tasks-header";

export default function TasksLayout({ children }: LayoutProps<"/tasks">) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <Workspace>{children}</Workspace>
    </Suspense>
  );
}

async function Workspace({ children }: { children: React.ReactNode }) {
  const { projects, today } = await loadProjects();
  return (
    <WorkspaceProvider projects={projects} today={today}>
      <div className="flex h-dvh flex-col">
        <TasksHeader />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </WorkspaceProvider>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="flex h-dvh flex-col" aria-busy="true" aria-label="불러오는 중">
      <div className="h-[106px] border-b border-line bg-surface" />
      <div className="flex-1 p-6">
        <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />
      </div>
    </div>
  );
}
