"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";
import type { Project, Task } from "@/lib/tasks/model";
import { ApiError } from "./api";
import { TaskDialog, type TaskDraft } from "./task-dialog";
import { ProjectDialog } from "./project-dialog";
import { ConfirmDialog, type ConfirmOptions } from "./confirm-dialog";

type DialogState =
  | { kind: "task"; task: Task | null; defaults?: Partial<TaskDraft> }
  | { kind: "project"; project: Project | null; taskCount: number }
  | { kind: "confirm"; options: ConfirmOptions }
  | null;

interface Toast {
  id: number;
  message: string;
  tone: "success" | "error";
}

interface Workspace {
  projects: Project[];
  today: string;
  /** 서버 데이터를 다시 읽는 중 */
  refreshing: boolean;
  openTask: (task: Task) => void;
  newTask: (defaults?: Partial<TaskDraft>) => void;
  openProject: (project: Project, taskCount?: number) => void;
  newProject: () => void;
  confirm: (options: ConfirmOptions) => void;
  notify: (message: string, tone?: Toast["tone"]) => void;
  refresh: () => void;
  /** API 호출을 실행하고, 성공하면 화면을 새로 고치고 알림을 띄운다. */
  run: (action: () => Promise<unknown>, successMessage?: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspace(): Workspace {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace 는 WorkspaceProvider 안에서만 쓸 수 있습니다");
  return ctx;
}

export function WorkspaceProvider({
  projects,
  today,
  children,
}: {
  projects: Project[];
  today: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshing, startTransition] = useTransition();
  const toastId = useRef(0);

  // 다른 화면으로 이동해 이 영역이 숨겨지면(Activity) 열린 창을 닫는다
  useLayoutEffect(() => () => setDialog(null), []);

  const open = useCallback((next: DialogState) => {
    setDialogKey((k) => k + 1);
    setDialog(next);
  }, []);
  const close = useCallback(() => setDialog(null), []);

  const notify = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === "error" ? 5000 : 2500);
  }, []);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const run = useCallback(
    async (action: () => Promise<unknown>, successMessage?: string) => {
      try {
        await action();
        refresh();
        if (successMessage) notify(successMessage);
        return true;
      } catch (err) {
        notify(err instanceof ApiError ? err.message : "작업을 처리하지 못했습니다", "error");
        return false;
      }
    },
    [notify, refresh],
  );

  const value = useMemo<Workspace>(
    () => ({
      projects,
      today,
      refreshing,
      openTask: (task) => open({ kind: "task", task }),
      newTask: (defaults) => open({ kind: "task", task: null, defaults }),
      openProject: (project, taskCount = 0) => open({ kind: "project", project, taskCount }),
      newProject: () => open({ kind: "project", project: null, taskCount: 0 }),
      confirm: (options) => open({ kind: "confirm", options }),
      notify,
      refresh,
      run,
    }),
    [projects, today, refreshing, open, notify, refresh, run],
  );

  // 단축키: N = 새 업무, P = 새 프로젝트
  const dialogOpen = dialog !== null;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (dialogOpen || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const key = e.key.toLowerCase();
      if (key === "n" || key === "ㅜ") {
        e.preventDefault();
        if (projects.length === 0) open({ kind: "project", project: null, taskCount: 0 });
        else open({ kind: "task", task: null });
      } else if (key === "p" || key === "ㅔ") {
        e.preventDefault();
        open({ kind: "project", project: null, taskCount: 0 });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogOpen, open, projects.length]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}

      {dialog?.kind === "task" && (
        <TaskDialog key={dialogKey} task={dialog.task} defaults={dialog.defaults} onClose={close} />
      )}
      {dialog?.kind === "project" && (
        <ProjectDialog key={dialogKey} project={dialog.project} taskCount={dialog.taskCount} onClose={close} />
      )}
      {dialog?.kind === "confirm" && <ConfirmDialog key={dialogKey} options={dialog.options} onClose={close} />}

      <div
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-in pointer-events-auto flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm shadow-pop"
          >
            {t.tone === "success" ? (
              <CircleCheck className="size-4 text-success" aria-hidden />
            ) : (
              <CircleAlert className="size-4 text-danger" aria-hidden />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </WorkspaceContext.Provider>
  );
}
