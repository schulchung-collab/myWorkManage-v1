import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, Loader } from "lucide-react";
import { SITE_APPS } from "@/lib/apps";
import { AppIcon } from "@/components/shell/app-icon";
import { loadBoard } from "@/lib/server/queries";
import { addDays, fmtDday, fmtLong, fmtShort } from "@/lib/dates";
import { isOverdue } from "@/lib/tasks/model";
import { StatusBadge } from "@/components/tasks/status-badge";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">내 작업실</h1>
        <p className="mt-1 text-sm text-fg-muted">업무 일정과 엔지니어링 도구를 한곳에 모았습니다.</p>
      </header>

      <Suspense fallback={<SummarySkeleton />}>
        <TodaySummary />
      </Suspense>

      <section className="mt-10" aria-labelledby="apps-heading">
        <h2 id="apps-heading" className="mb-3 text-sm font-semibold text-fg-muted">
          앱
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SITE_APPS.map((app) => {
            const active = app.status === "active";
            const body = (
              <>
                <div className="flex items-start justify-between">
                  <span
                    className={`grid size-10 place-items-center rounded-lg ${
                      active ? "bg-primary-soft text-primary" : "bg-subtle text-fg-subtle"
                    }`}
                  >
                    <AppIcon name={app.icon} className="size-5" />
                  </span>
                  {active ? (
                    <ArrowRight
                      className="size-4 text-fg-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  ) : (
                    <span className="rounded-full bg-subtle px-2 py-0.5 text-xs text-fg-subtle">예정</span>
                  )}
                </div>
                <div className="mt-4 font-medium">{app.name}</div>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">{app.description}</p>
              </>
            );
            return (
              <li key={app.id}>
                {active ? (
                  <Link
                    href={app.href}
                    className="group block h-full rounded-xl border border-line bg-surface p-5 transition-colors duration-150 hover:border-primary/50"
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    className="h-full rounded-xl border border-dashed border-line bg-surface/60 p-5"
                    aria-disabled="true"
                  >
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

async function TodaySummary() {
  const { projects, tasks, today } = await loadBoard();
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const weekEnd = addDays(today, 6);
  const open = tasks.filter((t) => t.status !== "done");
  const doing = open.filter((t) => t.status === "doing");
  const overdue = open.filter((t) => isOverdue(t, today));
  const dueThisWeek = open.filter((t) => t.dueDate && t.dueDate >= today && t.dueDate <= weekEnd);
  const upcoming = open
    .filter((t) => t.dueDate && t.dueDate <= addDays(today, 14))
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0))
    .slice(0, 6);

  const stats = [
    { label: "진행 중", value: doing.length, icon: Loader, tone: "text-primary bg-primary-soft" },
    { label: "7일 안에 마감", value: dueThisWeek.length, icon: CalendarClock, tone: "text-warning bg-warning-soft" },
    { label: "마감 지남", value: overdue.length, icon: AlertTriangle, tone: "text-danger bg-danger-soft" },
  ];

  return (
    <section aria-labelledby="today-heading" className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="rounded-xl border border-line bg-surface p-5">
        <h2 id="today-heading" className="text-sm font-semibold text-fg-muted">
          오늘 · <span className="text-fg">{fmtLong(today)}</span>
        </h2>
        <dl className="mt-4 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-subtle/60 p-3">
              <dt className="flex items-center gap-1.5 text-xs text-fg-muted">
                <span className={`grid size-5 place-items-center rounded ${s.tone}`}>
                  <s.icon className="size-3" aria-hidden />
                </span>
                {s.label}
              </dt>
              <dd className="tabular mt-2 text-2xl font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-fg-subtle">
          프로젝트 {projects.length}개 · 전체 업무 {tasks.length}개 · 완료 {tasks.length - open.length}개
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg-muted">2주 안에 마감되는 업무</h2>
          <Link href="/tasks/list" className="text-xs font-medium text-primary hover:underline">
            전체 보기
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-6 text-sm text-fg-subtle">2주 안에 마감되는 업무가 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {upcoming.map((t) => {
              const p = projectById.get(t.projectId);
              const late = isOverdue(t, today);
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: p?.color }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="truncate text-xs text-fg-subtle">{p?.name}</div>
                  </div>
                  <StatusBadge status={t.status} />
                  <div className="w-20 text-right">
                    <div className="tabular text-sm">{fmtShort(t.dueDate)}</div>
                    <div className={`text-xs ${late ? "font-medium text-danger" : "text-fg-subtle"}`}>
                      {fmtDday(t.dueDate!, today)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]" aria-busy="true" aria-label="불러오는 중">
      <div className="h-52 animate-pulse rounded-xl border border-line bg-surface" />
      <div className="h-52 animate-pulse rounded-xl border border-line bg-surface" />
    </div>
  );
}
