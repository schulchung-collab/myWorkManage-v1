import { STATUS_LABEL, type TaskStatus } from "@/lib/tasks/model";

export const STATUS_STYLE: Record<TaskStatus, { bg: string; fg: string; dot: string }> = {
  todo: { bg: "var(--st-todo-bg)", fg: "var(--st-todo-fg)", dot: "var(--st-todo-dot)" },
  doing: { bg: "var(--st-doing-bg)", fg: "var(--st-doing-fg)", dot: "var(--st-doing-dot)" },
  done: { bg: "var(--st-done-bg)", fg: "var(--st-done-fg)", dot: "var(--st-done-dot)" },
};

export function StatusBadge({ status, className = "" }: { status: TaskStatus; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ${className}`}
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ background: s.dot }} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
