"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Crosshair, Pencil, Plus } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import {
  WEEKDAYS_KO,
  addDays,
  addMonths,
  dayOfMonth,
  diffDays,
  endOfMonth,
  fmtShort,
  monthKey,
  monthNumber,
  startOfMonth,
  weekday,
} from "@/lib/dates";
import {
  STATUS_LABEL,
  groupTasksByProject,
  isOverdue,
  projectSpan,
  taskSpan,
  type Project,
  type Task,
} from "@/lib/tasks/model";
import { STATUS_STYLE } from "./status-badge";
import { useWorkspace } from "./workspace";

export type GanttZoom = "day" | "week" | "month";

const DAY_WIDTH: Record<GanttZoom, number> = { day: 32, week: 14, month: 4 };
const ZOOM_LABEL: Record<GanttZoom, string> = { day: "일", week: "주", month: "월" };
const LABEL_W = 320;
const PROJECT_ROW_H = 44;
const TASK_ROW_H = 36;

interface Range {
  start: string;
  end: string;
  days: number;
}

function computeRange(tasks: Task[], today: string): Range {
  const span = projectSpan(tasks);
  let min = addDays(today, -14);
  let max = addDays(today, 45);
  if (span) {
    if (span.start < min) min = span.start;
    if (span.end > max) max = span.end;
  }
  const start = startOfMonth(monthKey(min));
  const end = endOfMonth(monthKey(addDays(max, 7)));
  return { start, end, days: diffDays(start, end) + 1 };
}

export function GanttView({
  projects,
  tasks,
  today,
  zoom,
}: {
  projects: Project[];
  tasks: Task[];
  today: string;
  zoom: GanttZoom;
}) {
  const ws = useWorkspace();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());
  const [hideDone, setHideDone] = useState(false);

  const dayW = DAY_WIDTH[zoom];
  const range = useMemo(() => computeRange(tasks, today), [tasks, today]);
  const width = range.days * dayW;
  const x = (date: string) => diffDays(range.start, date) * dayW;
  const todayX = x(today);

  const byProject = useMemo(() => groupTasksByProject(tasks), [tasks]);

  function scrollToToday(behavior: ScrollBehavior = "smooth") {
    const el = scrollRef.current;
    if (!el) return;
    const visible = el.clientWidth - LABEL_W;
    el.scrollTo({ left: Math.max(0, todayX - visible * 0.3), behavior });
  }

  // 처음 열 때와 확대 단계를 바꿀 때 오늘 근처로 이동
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const visible = el.clientWidth - LABEL_W;
    el.scrollLeft = Math.max(0, todayX - visible * 0.3);
  }, [zoom, todayX]);

  const allCollapsed = projects.length > 0 && projects.every((p) => collapsed.has(p.id));

  if (projects.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div>
          <p className="text-sm text-fg-muted">프로젝트가 없습니다.</p>
          <Button variant="primary" className="mt-4" onClick={() => ws.newProject()}>
            <Plus className="size-4" aria-hidden />새 프로젝트
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 도구 모음 */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 md:px-6">
        <div className="inline-flex rounded-md border border-line-strong bg-subtle p-0.5" role="group" aria-label="확대 단계">
          {(Object.keys(DAY_WIDTH) as GanttZoom[]).map((z) => (
            <Link
              key={z}
              href={`/tasks/gantt?zoom=${z}`}
              scroll={false}
              aria-current={z === zoom ? "true" : undefined}
              className={`flex h-7 items-center rounded-[5px] px-3 text-[13px] transition-colors duration-150 ${
                z === zoom ? "bg-surface font-medium text-fg shadow-sm" : "text-fg-muted hover:text-fg"
              }`}
            >
              {ZOOM_LABEL[z]}
            </Link>
          ))}
        </div>
        <Button size="sm" onClick={() => scrollToToday()}>
          <Crosshair className="size-4" aria-hidden />
          오늘로
        </Button>
        <div className="ml-auto flex items-center gap-4">
          <Legend />
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-muted select-none">
            <input
              type="checkbox"
              checked={hideDone}
              onChange={(e) => setHideDone(e.target.checked)}
              className="size-3.5 accent-[var(--primary)]"
            />
            완료 숨기기
          </label>
          <button
            type="button"
            onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(projects.map((p) => p.id)))}
            className="cursor-pointer text-[13px] text-fg-muted hover:text-fg"
          >
            {allCollapsed ? "모두 펼치기" : "모두 접기"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-5 pb-4 md:px-6">
        <div
          ref={scrollRef}
          className="thin-scroll relative h-full overflow-auto rounded-xl border border-line bg-surface"
        >
          <div className="relative" style={{ width: LABEL_W + width }}>
            <TimelineHeader range={range} dayW={dayW} zoom={zoom} today={today} todayX={todayX} />

            <div className="relative">
              <TimelineBackground range={range} dayW={dayW} zoom={zoom} todayX={todayX} />

              {projects.map((p) => {
                const all = byProject.get(p.id) ?? [];
                const shown = hideDone ? all.filter((t) => t.status !== "done") : all;
                const isCollapsed = collapsed.has(p.id);
                return (
                  <div key={p.id} role="rowgroup" aria-label={p.name}>
                    <ProjectRow
                      project={p}
                      tasks={all}
                      collapsed={isCollapsed}
                      x={x}
                      dayW={dayW}
                      onToggle={() =>
                        setCollapsed((s) => {
                          const n = new Set(s);
                          if (n.has(p.id)) n.delete(p.id);
                          else n.add(p.id);
                          return n;
                        })
                      }
                      onEdit={() => ws.openProject(p, all.length)}
                      onAdd={() => ws.newTask({ projectId: p.id })}
                    />
                    {!isCollapsed &&
                      shown.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          project={p}
                          today={today}
                          x={x}
                          dayW={dayW}
                          todayX={todayX}
                          onOpen={() => ws.openTask(t)}
                        />
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="hidden items-center gap-3 text-xs text-fg-subtle lg:flex" aria-hidden>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm border border-fg-subtle/50 bg-fg-subtle/20" />
        프로젝트 기간
      </span>
      <span className="flex items-center gap-1.5">
        <span className="flex h-3 w-6 overflow-hidden rounded-sm">
          <span className="w-1/2 bg-fg-subtle" />
          <span className="w-1/2 bg-fg-subtle/35" />
        </span>
        업무 (진한 부분 = 진행률)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-0.5 bg-today" />
        오늘
      </span>
    </div>
  );
}

function TimelineHeader({
  range,
  dayW,
  zoom,
  today,
  todayX,
}: {
  range: Range;
  dayW: number;
  zoom: GanttZoom;
  today: string;
  todayX: number;
}) {
  const months: { key: string; x: number; w: number }[] = [];
  for (let m = monthKey(range.start); startOfMonth(m) <= range.end; m = addMonths(m, 1)) {
    const s = startOfMonth(m);
    const e = endOfMonth(m);
    months.push({ key: m, x: diffDays(range.start, s) * dayW, w: (diffDays(s, e) + 1) * dayW });
  }

  const ticks: { date: string; x: number }[] = [];
  if (zoom === "day") {
    for (let d = range.start; d <= range.end; d = addDays(d, 1)) ticks.push({ date: d, x: diffDays(range.start, d) * dayW });
  } else if (zoom === "week") {
    let d = range.start;
    while (weekday(d) !== 1) d = addDays(d, 1);
    for (; d <= range.end; d = addDays(d, 7)) ticks.push({ date: d, x: diffDays(range.start, d) * dayW });
  }

  const rowH = zoom === "month" ? 0 : 26;

  return (
    <div className="sticky top-0 z-20 flex border-b border-line bg-surface">
      <div
        className="sticky left-0 z-30 flex shrink-0 items-end border-r border-line bg-surface px-4 pb-2 text-xs font-medium text-fg-subtle"
        style={{ width: LABEL_W, height: 30 + rowH }}
      >
        프로젝트 / 업무
      </div>
      <div className="relative" style={{ height: 30 + rowH, width: range.days * dayW }}>
        {months.map((m) => (
          <div
            key={m.key}
            className="absolute top-0 flex h-[30px] items-center border-l border-line px-2 text-xs font-semibold whitespace-nowrap text-fg-muted"
            style={{ left: m.x, width: m.w }}
          >
            <span className="sticky left-[calc(320px+8px)] truncate">
              {`${m.key.slice(0, 4)}년 ${+m.key.slice(5)}월`}
            </span>
          </div>
        ))}
        {ticks.map((t) => {
          const wd = weekday(t.date);
          const isToday = t.date === today;
          return (
            <div
              key={t.date}
              className={`tabular absolute top-[30px] flex h-[26px] items-center justify-center border-t border-line text-[11px] ${
                isToday
                  ? "font-semibold text-today"
                  : zoom === "day" && (wd === 0 || wd === 6)
                    ? "text-fg-subtle/70"
                    : "text-fg-subtle"
              }`}
              style={{ left: t.x, width: zoom === "day" ? dayW : dayW * 7 }}
              title={zoom === "day" ? `${monthNumber(t.date)}/${dayOfMonth(t.date)} (${WEEKDAYS_KO[wd]})` : `${fmtShort(t.date)} 주`}
            >
              {zoom === "day" ? dayOfMonth(t.date) : fmtShort(t.date)}
            </div>
          );
        })}
        <div
          className="absolute top-[7px] z-10 -translate-x-1/2 rounded bg-today px-1.5 text-[10px] leading-4 font-medium text-white"
          style={{ left: todayX + dayW / 2 }}
        >
          오늘
        </div>
      </div>
    </div>
  );
}

function TimelineBackground({
  range,
  dayW,
  zoom,
  todayX,
}: {
  range: Range;
  dayW: number;
  zoom: GanttZoom;
  todayX: number;
}) {
  const weekends: number[] = [];
  const lines: { x: number; strong: boolean }[] = [];
  for (let d = range.start, i = 0; d <= range.end; d = addDays(d, 1), i++) {
    const wd = weekday(d);
    if (zoom !== "month" && wd === 6) weekends.push(i * dayW);
    if (dayOfMonth(d) === 1) lines.push({ x: i * dayW, strong: true });
    else if (zoom === "day") lines.push({ x: i * dayW, strong: false });
    else if (zoom === "week" && wd === 1) lines.push({ x: i * dayW, strong: false });
  }
  return (
    <div className="pointer-events-none absolute inset-y-0" style={{ left: LABEL_W, width: range.days * dayW }} aria-hidden>
      {weekends.map((wx) => (
        <div key={wx} className="absolute inset-y-0 bg-weekend" style={{ left: wx, width: dayW * 2 }} />
      ))}
      {lines.map((l) => (
        <div
          key={l.x}
          className={`absolute inset-y-0 w-px ${l.strong ? "bg-line-strong/70" : "bg-line/70"}`}
          style={{ left: l.x }}
        />
      ))}
      <div className="absolute inset-y-0 z-[5] w-0.5 bg-today/80" style={{ left: todayX + dayW / 2 - 1 }} />
    </div>
  );
}

function ProjectRow({
  project,
  tasks,
  collapsed,
  x,
  dayW,
  onToggle,
  onEdit,
  onAdd,
}: {
  project: Project;
  tasks: Task[];
  collapsed: boolean;
  x: (d: string) => number;
  dayW: number;
  onToggle: () => void;
  onEdit: () => void;
  onAdd: () => void;
}) {
  const span = projectSpan(tasks);
  const avg = tasks.length ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length) : 0;
  const done = tasks.filter((t) => t.status === "done").length;
  const left = span ? x(span.start) : 0;
  const w = span ? Math.max((diffDays(span.start, span.end) + 1) * dayW, 6) : 0;
  const c = project.color;

  return (
    <div className="group relative flex border-t border-line first:border-t-0" style={{ height: PROJECT_ROW_H }} role="row">
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-line bg-subtle pr-1.5 pl-2"
        style={{ width: LABEL_W }}
        role="rowheader"
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-hover"
        >
          {collapsed ? (
            <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-fg-subtle" aria-hidden />
          )}
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: c }} aria-hidden />
          <span className="truncate text-sm font-semibold">{project.name}</span>
          <span className="tabular shrink-0 text-xs text-fg-subtle">
            {done}/{tasks.length}
          </span>
        </button>
        <div className="absolute inset-y-0 right-1 flex items-center rounded-md bg-subtle pl-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
          <IconButton size="sm" label={`${project.name}에 업무 추가`} onClick={onAdd}>
            <Plus className="size-3.5" aria-hidden />
          </IconButton>
          <IconButton size="sm" label="프로젝트 편집" onClick={onEdit}>
            <Pencil className="size-3.5" aria-hidden />
          </IconButton>
        </div>
      </div>
      <div className="relative flex-1 bg-subtle/40">
        {span && (
          <>
            <div
              className="absolute top-1/2 h-3.5 -translate-y-1/2 overflow-hidden rounded"
              style={{
                left,
                width: w,
                background: `color-mix(in srgb, ${c} 22%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 55%, transparent)`,
              }}
              title={`${project.name}\n${fmtShort(span.start)} – ${fmtShort(span.end)} · 평균 진행률 ${avg}%`}
            >
              <div className="h-full" style={{ width: `${avg}%`, background: `color-mix(in srgb, ${c} 45%, transparent)` }} />
            </div>
            <div
              className="tabular pointer-events-none absolute top-1/2 -translate-y-1/2 pl-2 text-xs whitespace-nowrap text-fg-muted"
              style={{ left: left + w }}
            >
              {fmtShort(span.start)} – {fmtShort(span.end)} · {avg}%
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  project,
  today,
  x,
  dayW,
  todayX,
  onOpen,
}: {
  task: Task;
  project: Project;
  today: string;
  x: (d: string) => number;
  dayW: number;
  todayX: number;
  onOpen: () => void;
}) {
  const span = taskSpan(task);
  const done = task.status === "done";
  const late = isOverdue(task, today);
  const c = project.color;
  const st = STATUS_STYLE[task.status];
  const left = span ? x(span.start) : 0;
  const w = span ? Math.max((diffDays(span.start, span.end) + 1) * dayW, 6) : 0;
  const info = span
    ? `${fmtShort(span.start)}${span.start !== span.end ? ` – ${fmtShort(span.end)}` : ""}`
    : "날짜 없음";
  const tooltip = `${task.title}\n${project.name} · ${info} · ${STATUS_LABEL[task.status]} ${task.progress}%${late ? " · 마감 지남" : ""}`;

  return (
    <div className="relative flex border-t border-line/60 hover:bg-hover/40" style={{ height: TASK_ROW_H }} role="row">
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center border-r border-line bg-surface"
        style={{ width: LABEL_W }}
        role="rowheader"
      >
        <button
          type="button"
          onClick={onOpen}
          className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 pr-3 pl-10 text-left hover:bg-hover/60"
          title={tooltip}
        >
          <span className="size-2 shrink-0 rounded-full" style={{ background: st.dot }} aria-label={STATUS_LABEL[task.status]} />
          <span className={`truncate text-[13px] ${done ? "text-fg-subtle line-through decoration-fg-subtle/40" : ""}`}>
            {task.title}
          </span>
        </button>
      </div>
      <div className="relative flex-1">
        {span ? (
          <>
            <button
              type="button"
              onClick={onOpen}
              title={tooltip}
              aria-label={`${task.title} 편집`}
              className="absolute top-1/2 flex h-5 -translate-y-1/2 cursor-pointer items-center overflow-hidden rounded transition-[filter] duration-150 hover:brightness-110"
              style={{
                left,
                width: w,
                background: done ? c : `color-mix(in srgb, ${c} 32%, var(--surface))`,
                boxShadow: late ? "0 0 0 2px var(--danger)" : undefined,
              }}
            >
              {!done && (
                <span className="absolute inset-y-0 left-0" style={{ width: `${task.progress}%`, background: c }} aria-hidden />
              )}
              {done && w >= 18 && <Check className="relative mx-auto size-3.5 text-white" aria-hidden />}
            </button>
            <div
              className={`pointer-events-none absolute top-1/2 max-w-[320px] -translate-y-1/2 truncate pl-2 text-xs whitespace-nowrap ${
                late ? "font-medium text-danger" : "text-fg-muted"
              }`}
              style={{ left: left + w }}
            >
              {task.title}
              <span className="tabular ml-1.5 text-fg-subtle">{late ? "마감 지남" : `${task.progress}%`}</span>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="absolute top-1/2 -translate-y-1/2 cursor-pointer rounded border border-dashed border-line-strong px-2 py-0.5 text-xs text-fg-subtle hover:border-primary hover:text-primary"
            style={{ left: todayX + 8 }}
          >
            날짜 없음 · 클릭해서 지정
          </button>
        )}
      </div>
    </div>
  );
}
