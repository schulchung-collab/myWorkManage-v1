"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { SITE_APPS, type SiteApp } from "@/lib/apps";
import { AppIcon } from "./app-icon";
import { ThemeToggle } from "./theme-toggle";

function isActive(pathname: string, app: SiteApp) {
  const base = app.href.split("/").slice(0, 2).join("/");
  return pathname === app.href || pathname.startsWith(base + "/") || pathname === base;
}

const itemBase =
  "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150";

export function Sidebar() {
  const pathname = usePathname();
  const work = SITE_APPS.filter((a) => a.group === "work");
  const viewers = SITE_APPS.filter((a) => a.group === "viewer");

  return (
    <aside
      className="sticky top-0 flex h-dvh w-16 shrink-0 flex-col border-r border-side-line bg-side-bg text-side-fg md:w-60"
      aria-label="사이트 메뉴"
    >
      <div className="flex h-14 items-center gap-2.5 px-3 md:px-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-md" aria-label="내 작업실 홈">
          <BrandMark />
          <span className="hidden text-[15px] font-semibold tracking-tight text-white md:inline">
            내 작업실
          </span>
        </Link>
      </div>

      <nav className="thin-scroll flex-1 overflow-y-auto px-2 py-2 md:px-3">
        <Link
          href="/"
          className={`${itemBase} ${
            pathname === "/"
              ? "bg-side-active text-side-active-fg"
              : "text-side-fg hover:bg-side-hover hover:text-white"
          }`}
          aria-current={pathname === "/" ? "page" : undefined}
          title="홈"
        >
          <House className="size-4 shrink-0" aria-hidden />
          <span className="hidden md:inline">홈</span>
        </Link>

        <SectionLabel>업무</SectionLabel>
        <ul className="space-y-0.5">
          {work.map((app) => {
            const active = isActive(pathname, app);
            return (
              <li key={app.id}>
                <Link
                  href={app.href}
                  className={`${itemBase} ${
                    active
                      ? "bg-side-active text-side-active-fg"
                      : "text-side-fg hover:bg-side-hover hover:text-white"
                  }`}
                  aria-current={active ? "page" : undefined}
                  title={app.name}
                >
                  <AppIcon name={app.icon} className="size-4 shrink-0" />
                  <span className="hidden md:inline">{app.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <SectionLabel>뷰어</SectionLabel>
        <ul className="space-y-0.5">
          {viewers.map((app) => (
            <li key={app.id}>
              <span
                className={`${itemBase} cursor-not-allowed text-side-muted/80`}
                aria-disabled="true"
                title={`${app.name} (준비 중)`}
              >
                <AppIcon name={app.icon} className="size-4 shrink-0 opacity-70" />
                <span className="hidden flex-1 truncate md:inline">{app.name}</span>
                <span className="hidden rounded border border-side-line px-1.5 py-px text-[11px] leading-4 text-side-muted md:inline">
                  예정
                </span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-side-line px-2 py-2 md:px-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 mb-1.5 hidden px-2.5 text-[11px] font-medium tracking-wide text-side-muted md:block">
      {children}
    </div>
  );
}

/** 구조 프레임(라멘)을 단순화한 로고 */
function BrandMark() {
  return (
    <span className="grid size-8 place-items-center rounded-lg bg-primary text-white">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 20V6l8-3 8 3v14" strokeLinejoin="round" />
        <path d="M4 12h16M12 3v17" />
        <path d="M2.5 20h19" strokeLinecap="round" />
      </svg>
    </span>
  );
}
