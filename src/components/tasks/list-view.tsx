"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Flag, FolderPlus, Pencil, Plus, Search, StickyNote, Trash2, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { diffDays, fmtDday, fmtShort } from "@/lib/dates";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TASK_PRIORITIES,
  TASK_STATUSES,
  groupTasksByProject,
  isOverdue,
  projectSpan,
  type Project,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/model";
import { api } from "./api";
import { STATUS_STYLE } from "./status-badge";
import { useWorkspace } from "./workspace";

type Filter = "all" | "open" | TaskStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "open", label: "미완료" },
  { value: "todo", label: STATUS_LABEL.todo },
  { value: "doing", label: STATUS_LABEL.doing },
  { value: "done", label: STATUS_LABEL.done },
];

function matchesFilter(t: Task, f: Filter) {
  if (f === "all") return true;
  if (f === "open") return t.status !== "done";
  return t.status === f;
}

export function TaskListView({ projects, tasks, today }: { projects: Project[]; tasks: Task[]; today: string }) {
  const ws = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // 빠른 수정(상태·우선순위)을 서버 응답 전에 먼저 보여주기 위한 임시 덮어쓰기.
  // 서버에서 새 tasks 가 오면(참조가 바뀌면) 자동으로 버려진다.
  const [overrides, setOverrides] = useState<{ src: Task[]; map: Record<number, Partial<Task>> }>({
    src: tasks,
    map: {},
  });
  const overrideMap = useMemo(
    () => (overrides.src === tasks ? overrides.map : {}),
    [overrides, tasks],
  );
  const view = useMemo(
    () => tasks.map((t) => (overrideMap[t.id] ? { ...t, ...overrideMap[t.id] } : t)),
    [tasks, overrideMap],
  );

  function quickUpdate(task: Task, patch: Partial<Task>) {
    setOverrides({ src: tasks, map: { ...overrideMap, [task.id]: { ...overrideMap[task.id], ...patch } } });
    void ws.run(() => api.updateTask(task.id, patch)).then((ok) => {
      if (!ok) setOverrides({ src: tasks, map: {} });
    });
  }

  // "/" 로 검색창 이동
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, open: 0, todo: 0, doing: 0, done: 0 };
    for (const t of view) {
      c.all++;
      c[t.status]++;
      if (t.status !== "done") c.open++;
    }
    return c;
  }, [view]);

  const allByProject = useMemo(() => groupTasksByProject(view), [view]);
  const visibleByProject = useMemo(() => {
    const filtered = view.filter((t) => {
      if (!matchesFilter(t, filter)) return false;
      if (!q) return true;
      const p = projects.find((pp) => pp.id === t.projectId);
      return (
        t.title.toLowerCase().includes(q) ||
        (t.memo ?? "").toLowerCase().includes(q) ||
        (p?.name ?? "").toLowerCase().includes(q)
      );
    });
    return groupTasksByProject(filtered);
  }, [view, filter, q, projects]);

  const narrowing = q !== "" || filter !== "all";
  const shownProjects = narrowing ? projects.filter((p) => visibleByProject.has(p.id)) : projects;
  const allCollapsed = projects.length > 0 && projects.every((p) => collapsed.has(p.id));

  if (projects.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
            <FolderPlus className="size-6" aria-hidden />
          </div>
          <h2 className="mt-4 text-base font-semibold">아직 프로젝트가 없습니다</h2>
          <p className="mt-1 text-sm text-fg-muted">프로젝트를 만들고 그 안에 업무를 추가해 보세요.</p>
          <Button variant="primary" className="mt-5" onClick={() => ws.newProject()}>
            <Plus className="size-4" aria-hidden />첫 프로젝트 만들기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1280px] px-5 py-5 md:px-6">
        {/* 도구 모음 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="업무, 메모, 프로젝트 검색  ( / )"
              aria-label="업무 검색"
              className="h-9 w-full rounded-md border border-line-strong bg-surface pr-8 pl-9 text-sm placeholder:text-fg-subtle focus:border-primary focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded text-fg-subtle hover:text-fg"
                aria-label="검색어 지우기"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1" role="group" aria-label="상태 필터">
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  aria-pressed={active}
                  className={`h-8 cursor-pointer rounded-full border px-3 text-[13px] transition-colors duration-150 ${
                    active
                      ? "border-primary bg-primary-soft font-medium text-primary"
                      : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  {f.label}
                  <span className="tabular ml-1.5 text-xs opacity-70">{counts[f.value]}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(projects.map((p) => p.id)))}
            className="ml-auto cursor-pointer text-[13px] text-fg-muted hover:text-fg"
          >
            {allCollapsed ? "모두 펼치기" : "모두 접기"}
          </button>
        </div>

        {shownProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface p-10 text-center text-sm text-fg-muted">
            조건에 맞는 업무가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {shownProjects.map((p) => (
              <ProjectGroup
                key={p.id}
                project={p}
                allTasks={allByProject.get(p.id) ?? []}
                tasks={visibleByProject.get(p.id) ?? []}
                today={today}
                collapsed={collapsed.has(p.id)}
                showQuickAdd={!narrowing}
                onToggle={() =>
                  setCollapsed((s) => {
                    const next = new Set(s);
                    if (next.has(p.id)) next.delete(p.id);
                    else next.add(p.id);
                    return next;
                  })
                }
                onQuickUpdate={quickUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectGroup({
  project,
  allTasks,
  tasks,
  today,
  collapsed,
  showQuickAdd,
  onToggle,
  onQuickUpdate,
}: {
  project: Project;
  allTasks: Task[];
  tasks: Task[];
  today: string;
  collapsed: boolean;
  showQuickAdd: boolean;
  onToggle: () => void;
  onQuickUpdate: (task: Task, patch: Partial<Task>) => void;
}) {
  const ws = useWorkspace();
  const done = allTasks.filter((t) => t.status === "done").length;
  const avg = allTasks.length ? Math.round(allTasks.reduce((s, t) => s + t.progress, 0) / allTasks.length) : 0;
  const span = projectSpan(allTasks);
  const bodyId = `project-${project.id}-tasks`;

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface" aria-label={project.name}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-l-4 py-2.5 pr-3 pl-2" style={{ borderLeftColor: project.color }}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-hover"
        >
          {collapsed ? (
            <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-fg-subtle" aria-hidden />
          )}
          <span className="truncate text-[15px] font-semibold">{project.name}</span>
        </button>
        {project.client && <span className="truncate text-[13px] text-fg-subtle">{project.client}</span>}

        <div className="ml-auto flex items-center gap-3 text-[13px] text-fg-muted">
          {span && (
            <span className="tabular hidden md:inline" title="프로젝트 기간 (소속 업무 기준)">
              {fmtShort(span.start)} – {fmtShort(span.end)}
            </span>
          )}
          <span className="hidden items-center gap-2 sm:flex" title={`평균 진행률 ${avg}%`}>
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-subtle">
              <span className="block h-full rounded-full" style={{ width: `${avg}%`, background: project.color }} />
            </span>
            <span className="tabular">
              완료 {done}/{allTasks.length}
            </span>
          </span>
          <div className="flex items-center">
            <IconButton label={`${project.name}에 업무 추가`} onClick={() => ws.newTask({ projectId: project.id })}>
              <Plus className="size-4" aria-hidden />
            </IconButton>
            <IconButton label="프로젝트 편집" onClick={() => ws.openProject(project, allTasks.length)}>
              <Pencil className="size-4" aria-hidden />
            </IconButton>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div id={bodyId} className="thin-scroll overflow-x-auto border-t border-line">
          <table className="w-full min-w-[820px] table-fixed border-collapse text-sm">
            <colgroup>
              <col />
              <col className="w-[104px]" />
              <col className="w-[92px]" />
              <col className="w-[72px]" />
              <col className="w-[112px]" />
              <col className="w-[128px]" />
              <col className="w-[76px]" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs text-fg-subtle">
                <th scope="col" className="py-2 pr-2 pl-5 font-medium">업무</th>
                <th scope="col" className="px-2 py-2 font-medium">상태</th>
                <th scope="col" className="px-2 py-2 font-medium">우선순위</th>
                <th scope="col" className="px-2 py-2 font-medium">시작</th>
                <th scope="col" className="px-2 py-2 font-medium">마감</th>
                <th scope="col" className="px-2 py-2 font-medium">진행률</th>
                <th scope="col" className="px-2 py-2 font-medium">
                  <span className="sr-only">작업</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} today={today} onQuickUpdate={onQuickUpdate} />
              ))}
              {tasks.length === 0 && !showQuickAdd && (
                <tr>
                  <td colSpan={7} className="px-5 py-3 text-[13px] text-fg-subtle">
                    조건에 맞는 업무가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {showQuickAdd && <QuickAdd project={project} empty={allTasks.length === 0} />}
        </div>
      )}
    </section>
  );
}

function TaskRow({
  task,
  today,
  onQuickUpdate,
}: {
  task: Task;
  today: string;
  onQuickUpdate: (task: Task, patch: Partial<Task>) => void;
}) {
  const ws = useWorkspace();
  const done = task.status === "done";
  const overdue = isOverdue(task, today);
  const soon = !done && !overdue && task.dueDate && diffDays(today, task.dueDate) <= 3;
  const st = STATUS_STYLE[task.status];

  return (
    <tr className="group border-t border-line/70 transition-colors duration-100 hover:bg-hover/60">
      <td className="py-1.5 pr-2 pl-5">
        <button
          type="button"
          onClick={() => ws.openTask(task)}
          className={`flex w-full min-w-0 cursor-pointer items-center gap-2 rounded text-left ${
            done ? "text-fg-subtle line-through decoration-fg-subtle/40" : "text-fg"
          }`}
        >
          <span className="truncate">{task.title}</span>
          {task.memo && (
            <StickyNote className="size-3.5 shrink-0 text-fg-subtle no-underline" aria-label="메모 있음" />
          )}
        </button>
      </td>
      <td className="px-2 py-1.5">
        <div className="relative inline-flex">
          <span
            className="pointer-events-none absolute top-1/2 left-2.5 size-1.5 -translate-y-1/2 rounded-full"
            style={{ background: st.dot }}
            aria-hidden
          />
          <select
            value={task.status}
            onChange={(e) => {
              const status = e.target.value as TaskStatus;
              onQuickUpdate(task, status === "done" ? { status, progress: 100 } : { status });
            }}
            aria-label={`${task.title} 상태`}
            className="h-6 cursor-pointer appearance-none rounded-full pr-2.5 pl-6 text-xs font-medium"
            style={{ background: st.bg, color: st.fg }}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </td>
      <td className="px-2 py-1.5">
        <PrioritySelect task={task} onChange={(priority) => onQuickUpdate(task, { priority })} />
      </td>
      <td className="tabular px-2 py-1.5 text-fg-muted">{fmtShort(task.startDate) || <Dash />}</td>
      <td className="px-2 py-1.5">
        {task.dueDate ? (
          <div className="flex items-baseline gap-1.5">
            <span className={`tabular ${overdue ? "font-medium text-danger" : "text-fg-muted"}`}>{fmtShort(task.dueDate)}</span>
            {!done && (
              <span className={`text-[11px] ${overdue ? "text-danger" : soon ? "text-warning" : "text-fg-subtle"}`}>
                {fmtDday(task.dueDate, today)}
              </span>
            )}
          </div>
        ) : (
          <Dash />
        )}
      </td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-2" title={`진행률 ${task.progress}%`}>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
            <span
              className="block h-full rounded-full transition-[width] duration-300"
              style={{ width: `${task.progress}%`, background: done ? "var(--st-done-dot)" : "var(--primary)" }}
            />
          </span>
          <span className="tabular w-8 text-right text-xs text-fg-muted">{task.progress}%</span>
        </div>
      </td>
      <td className="px-2 py-1.5">
        <div className="flex justify-end opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
          <IconButton size="sm" label="편집" onClick={() => ws.openTask(task)}>
            <Pencil className="size-3.5" aria-hidden />
          </IconButton>
          <IconButton
            size="sm"
            tone="danger"
            label="삭제"
            onClick={() =>
              ws.confirm({
                title: "업무 삭제",
                message: (
                  <>
                    <strong className="text-fg">{task.title}</strong> 업무를 삭제합니다. 되돌릴 수 없습니다.
                  </>
                ),
                onConfirm: () => ws.run(() => api.deleteTask(task.id), "업무를 삭제했습니다"),
              })
            }
          >
            <Trash2 className="size-3.5" aria-hidden />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: "text-danger",
  normal: "text-fg-muted",
  low: "text-fg-subtle",
};

function PrioritySelect({ task, onChange }: { task: Task; onChange: (p: TaskPriority) => void }) {
  return (
    <div className={`relative inline-flex items-center ${PRIORITY_COLOR[task.priority]}`}>
      <Flag
        className={`pointer-events-none absolute left-1.5 size-3.5 ${task.priority === "high" ? "fill-current" : ""}`}
        aria-hidden
      />
      <select
        value={task.priority}
        onChange={(e) => onChange(e.target.value as TaskPriority)}
        aria-label={`${task.title} 우선순위`}
        className="h-7 cursor-pointer appearance-none rounded-md bg-transparent pr-2 pl-6 text-[13px] hover:bg-subtle"
      >
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABEL[p]}
          </option>
        ))}
      </select>
    </div>
  );
}

function Dash() {
  return <span className="text-fg-subtle/60">–</span>;
}

/** 표 맨 아래의 빠른 입력 줄: 제목(+마감일) 입력 후 Enter */
function QuickAdd({ project, empty }: { project: Project; empty: boolean }) {
  const ws = useWorkspace();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    const ok = await ws.run(
      () => api.createTask({ projectId: project.id, title: t, dueDate: due || null }),
      "업무를 추가했습니다",
    );
    setBusy(false);
    if (ok) {
      setTitle("");
      setDue("");
      titleRef.current?.focus();
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-line/70 py-1.5 pr-3 pl-4">
      <Plus className="size-4 shrink-0 text-fg-subtle" aria-hidden />
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void submit();
          } else if (e.key === "Escape") {
            setTitle("");
          }
        }}
        placeholder={empty ? "아직 업무가 없습니다. 첫 업무를 입력하고 Enter" : "업무 추가 — 제목 입력 후 Enter"}
        aria-label={`${project.name}에 업무 빠르게 추가`}
        className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-sm placeholder:text-fg-subtle hover:bg-hover/60 focus:bg-surface focus:outline-none"
        disabled={busy}
      />
      {title && (
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-fg-subtle">
          마감
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            className="tabular h-7 rounded-md border border-line-strong bg-surface px-2 text-xs text-fg focus:border-primary focus:outline-none"
          />
        </label>
      )}
    </div>
  );
}
