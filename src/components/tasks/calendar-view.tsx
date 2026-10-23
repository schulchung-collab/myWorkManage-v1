"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import {
  WEEKDAYS_KO,
  addDays,
  addMonths,
  dayOfMonth,
  diffDays,
  endOfMonth,
  fmtMonth,
  fmtShort,
  monthKey,
  monthNumber,
  startOfMonth,
  startOfWeek,
  weekday,
} from "@/lib/dates";
import { STATUS_LABEL, isOverdue, taskSpan, type Project, type Task } from "@/lib/tasks/model";
import { ProjectLegend } from "./project-legend";
import { useWorkspace } from "./workspace";

/** 한 주에 기본으로 보여줄 막대 줄 수. 넘치면 "+N" 으로 접는다. */
const MAX_LANES = 4;

interface Segment {
  task: Task;
  project: Project;
  /** 0~6 */
  col: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

function layoutWeek(weekStart: string, items: { task: Task; project: Project; start: string; end: string }[]) {
  const weekEnd = addDays(weekStart, 6);
  const segs: Omit<Segment, "lane">[] = [];
  for (const it of items) {
    if (it.end < weekStart || it.start > weekEnd) continue;
    const s = it.start < weekStart ? weekStart : it.start;
    const e = it.end > weekEnd ? weekEnd : it.end;
    segs.push({
      task: it.task,
      project: it.project,
      col: diffDays(weekStart, s),
      span: diffDays(s, e) + 1,
      continuesBefore: it.start < weekStart,
      continuesAfter: it.end > weekEnd,
    });
  }
  // 먼저 시작하는 것, 같은 날이면 긴 것부터 위쪽 줄에 배치
  segs.sort((a, b) => a.col - b.col || b.span - a.span || a.project.sortOrder - b.project.sortOrder);
  const laneEnds: number[] = [];
  return segs.map((seg) => {
    let lane = laneEnds.findIndex((end) => end < seg.col);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = seg.col + seg.span - 1;
    return { ...seg, lane } satisfies Segment;
  });
}

export function CalendarView({
  projects,
  tasks,
  today,
  month,
}: {
  projects: Project[];
  tasks: Task[];
  today: string;
  month: string;
}) {
  const ws = useWorkspace();
  const [hidden, setHidden] = useState<Set<number>>(() => new Set());
  const [hideDone, setHideDone] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = addDays(startOfWeek(endOfMonth(month)), 6);
  const weekStarts = useMemo(() => {
    const list: string[] = [];
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 7)) list.push(d);
    return list;
  }, [gridStart, gridEnd]);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const items = useMemo(() => {
    const list: { task: Task; project: Project; start: string; end: string }[] = [];
    for (const t of tasks) {
      const project = projectById.get(t.projectId);
      const span = taskSpan(t);
      if (!project || !span || hidden.has(project.id) || (hideDone && t.status === "done")) continue;
      list.push({ task: t, project, ...span });
    }
    return list;
  }, [tasks, projectById, hidden, hideDone]);

  const undated = tasks.filter((t) => !taskSpan(t)).length;
  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  const isThisMonth = month === monthKey(today);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 md:px-6">
        <div className="flex items-center gap-1">
          <Link href={`/tasks/calendar?month=${prev}`} className={buttonClass("ghost", "sm", "px-1.5")} aria-label="이전 달" scroll={false}>
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <h2 className="tabular min-w-[8.5rem] text-center text-lg font-semibold tracking-tight" aria-live="polite">
            {fmtMonth(month)}
          </h2>
          <Link href={`/tasks/calendar?month=${next}`} className={buttonClass("ghost", "sm", "px-1.5")} aria-label="다음 달" scroll={false}>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
          <Link
            href={`/tasks/calendar?month=${monthKey(today)}`}
            className={buttonClass("secondary", "sm", `ml-2 ${isThisMonth ? "pointer-events-none opacity-50" : ""}`)}
            aria-disabled={isThisMonth}
            scroll={false}
          >
            오늘
          </Link>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <ProjectLegend
            projects={projects}
            hidden={hidden}
            onToggle={(id) =>
              setHidden((s) => {
                const n = new Set(s);
                if (n.has(id)) n.delete(id);
                else n.add(id);
                return n;
              })
            }
          />
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-muted select-none">
            <input
              type="checkbox"
              checked={hideDone}
              onChange={(e) => setHideDone(e.target.checked)}
              className="size-3.5 accent-[var(--primary)]"
            />
            완료 숨기기
          </label>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 md:px-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface">
          <div className="grid grid-cols-7 border-b border-line bg-subtle/60 text-xs font-medium" role="row">
            {WEEKDAYS_KO.map((w, i) => (
              <div
                key={w}
                role="columnheader"
                className={`px-2.5 py-2 ${i === 0 ? "text-danger" : i === 6 ? "text-primary" : "text-fg-muted"}`}
              >
                {w}
              </div>
            ))}
          </div>

          <div
            className="thin-scroll grid min-h-0 flex-1 overflow-y-auto"
            style={{ gridTemplateRows: `repeat(${weekStarts.length}, minmax(min-content, 1fr))` }}
          >
            {weekStarts.map((ws0, wi) => (
              <Week
                key={ws0}
                weekStart={ws0}
                month={month}
                today={today}
                segments={layoutWeek(ws0, items)}
                expanded={expanded.has(ws0)}
                last={wi === weekStarts.length - 1}
                onExpand={(on) =>
                  setExpanded((s) => {
                    const n = new Set(s);
                    if (on) n.add(ws0);
                    else n.delete(ws0);
                    return n;
                  })
                }
                onDayClick={(d) => ws.newTask({ startDate: d, dueDate: d })}
                onTaskClick={(t) => ws.openTask(t)}
              />
            ))}
          </div>
        </div>
        {undated > 0 && (
          <p className="mt-2 text-xs text-fg-subtle">
            날짜가 없는 업무 {undated}개는 달력에 표시되지 않습니다. 목록에서 확인하세요.
          </p>
        )}
      </div>
    </div>
  );
}

function Week({
  weekStart,
  month,
  today,
  segments,
  expanded,
  last,
  onExpand,
  onDayClick,
  onTaskClick,
}: {
  weekStart: string;
  month: string;
  today: string;
  segments: Segment[];
  expanded: boolean;
  last: boolean;
  onExpand: (on: boolean) => void;
  onDayClick: (date: string) => void;
  onTaskClick: (task: Task) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const laneCount = segments.reduce((m, s) => Math.max(m, s.lane + 1), 0);
  const limit = expanded ? Infinity : MAX_LANES;
  const visible = segments.filter((s) => s.lane < limit);
  const hiddenPerDay = days.map((_, col) =>
    segments.filter((s) => s.lane >= limit && s.col <= col && col < s.col + s.span).length,
  );
  const rowsUsed = Math.min(laneCount, limit);

  return (
    <div className={`relative min-h-[150px] ${last ? "" : "border-b border-line"}`}>
      {/* 날짜 칸 */}
      <div className="absolute inset-0 grid grid-cols-7">
        {days.map((d, i) => {
          const inMonth = monthKey(d) === month;
          const isToday = d === today;
          const wd = weekday(d);
          return (
            <div
              key={d}
              onClick={() => onDayClick(d)}
              className={`group/day relative cursor-pointer transition-colors duration-100 hover:bg-hover/50 ${
                i < 6 ? "border-r border-line" : ""
              } ${wd === 0 || wd === 6 ? "bg-weekend" : ""} ${isToday ? "bg-today-soft!" : ""}`}
            >
              <div className="flex items-center justify-between px-2 pt-1.5">
                <span
                  className={`tabular grid h-6 min-w-6 place-items-center rounded-full px-1 text-[13px] ${
                    isToday
                      ? "bg-primary font-semibold text-primary-fg"
                      : !inMonth
                        ? "text-fg-subtle/60"
                        : wd === 0
                          ? "text-danger"
                          : wd === 6
                            ? "text-primary"
                            : "text-fg"
                  }`}
                >
                  {dayOfMonth(d) === 1 ? `${monthNumber(d)}/${dayOfMonth(d)}` : dayOfMonth(d)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDayClick(d);
                  }}
                  className="grid size-6 cursor-pointer place-items-center rounded text-fg-subtle opacity-0 transition-opacity duration-150 group-hover/day:opacity-100 hover:bg-subtle hover:text-fg focus-visible:opacity-100"
                  aria-label={`${monthNumber(d)}월 ${dayOfMonth(d)}일에 업무 추가`}
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 업무 막대 */}
      <div
        className="pointer-events-none relative grid grid-cols-7 gap-y-[3px] px-0 pt-9 pb-2"
        style={{ gridTemplateRows: `repeat(${rowsUsed + 1}, 22px)` }}
      >
        {visible.map((s) => (
          <Bar key={s.task.id} seg={s} today={today} onClick={() => onTaskClick(s.task)} />
        ))}
        {hiddenPerDay.map((n, col) =>
          n > 0 ? (
            <button
              key={col}
              type="button"
              onClick={() => onExpand(true)}
              className="pointer-events-auto mx-1.5 cursor-pointer truncate rounded px-1.5 text-left text-xs font-medium text-fg-muted hover:bg-subtle hover:text-fg"
              style={{ gridColumn: `${col + 1} / span 1`, gridRow: rowsUsed + 1 }}
            >
              +{n}개 더
            </button>
          ) : null,
        )}
        {expanded && laneCount > MAX_LANES && (
          <button
            type="button"
            onClick={() => onExpand(false)}
            className="pointer-events-auto mx-1.5 cursor-pointer rounded px-1.5 text-left text-xs text-fg-subtle hover:bg-subtle hover:text-fg"
            style={{ gridColumn: "1 / span 1", gridRow: rowsUsed + 1 }}
          >
            접기
          </button>
        )}
      </div>
    </div>
  );
}

function Bar({ seg, today, onClick }: { seg: Segment; today: string; onClick: () => void }) {
  const { task, project } = seg;
  const done = task.status === "done";
  const late = isOverdue(task, today);
  const color = project.color;
  const span = taskSpan(task)!;
  const label = `${task.title}\n${project.name} · ${fmtShort(span.start)}${span.start !== span.end ? ` – ${fmtShort(span.end)}` : ""} · ${STATUS_LABEL[task.status]}${late ? " · 마감 지남" : ""}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label.replace("\n", ", ")}
      className={`pointer-events-auto flex h-[22px] min-w-0 cursor-pointer items-center gap-1 px-2 text-left text-xs font-medium transition-[filter] duration-150 hover:brightness-110 ${
        seg.continuesBefore ? "ml-0 rounded-l-none" : "ml-1.5 rounded-l-md"
      } ${seg.continuesAfter ? "mr-0 rounded-r-none" : "mr-1.5 rounded-r-md"}`}
      style={{
        gridColumn: `${seg.col + 1} / span ${seg.span}`,
        gridRow: seg.lane + 1,
        background: done ? `color-mix(in srgb, ${color} 16%, var(--surface))` : color,
        color: done ? `color-mix(in srgb, ${color} 75%, var(--fg))` : "#fff",
        boxShadow: late ? "inset 0 0 0 2px var(--danger)" : undefined,
      }}
    >
      {done && <Check className="size-3 shrink-0" aria-hidden />}
      {seg.continuesBefore && <span aria-hidden className="opacity-70">‹</span>}
      <span className={`truncate ${done ? "line-through decoration-1 opacity-90" : ""}`}>{task.title}</span>
    </button>
  );
}
