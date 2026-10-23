"use client";

import type { Project } from "@/lib/tasks/model";

/** 프로젝트 색 범례 겸 표시/숨김 토글 */
export function ProjectLegend({
  projects,
  hidden,
  onToggle,
}: {
  projects: Project[];
  hidden: Set<number>;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="프로젝트 표시">
      {projects.map((p) => {
        const on = !hidden.has(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.id)}
            aria-pressed={on}
            title={on ? `${p.name} 숨기기` : `${p.name} 보이기`}
            className={`flex h-7 max-w-56 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors duration-150 ${
              on ? "border-line bg-surface text-fg hover:border-line-strong" : "border-dashed border-line text-fg-subtle"
            }`}
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: on ? p.color : "transparent", boxShadow: on ? undefined : `inset 0 0 0 1.5px ${p.color}` }}
              aria-hidden
            />
            <span className={`truncate ${on ? "" : "line-through"}`}>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
