/**
 * 날짜 유틸. 날짜는 모두 "YYYY-MM-DD" 문자열로 다루고,
 * 계산은 UTC 자정 기준으로 해서 시간대·서머타임 영향을 받지 않게 한다.
 */

const DAY_MS = 86_400_000;
export const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_RE.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toUtc(date: string): number {
  return Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** 이 컴퓨터의 현지 시각 기준 오늘 날짜 */
export function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** b - a (일) */
export function diffDays(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** 0 = 일요일 */
export function weekday(date: string): number {
  return new Date(toUtc(date)).getUTCDay();
}

export function startOfWeek(date: string): string {
  return addDays(date, -weekday(date));
}

/** 월요일 시작 주의 월요일 */
export function mondayOf(date: string): string {
  return addDays(date, -((weekday(date) + 6) % 7));
}

/** "YYYY-MM" */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function startOfMonth(month: string): string {
  return `${month}-01`;
}

export function endOfMonth(month: string): string {
  return addDays(startOfMonth(addMonths(month, 1)), -1);
}

export function addMonths(month: string, n: number): string {
  const y = +month.slice(0, 4);
  const m = +month.slice(5, 7) - 1 + n;
  const yy = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  return `${yy}-${String(mm + 1).padStart(2, "0")}`;
}

export function dayOfMonth(date: string): number {
  return +date.slice(8, 10);
}

export function monthNumber(date: string): number {
  return +date.slice(5, 7);
}

/** "10/23" */
export function fmtShort(date: string | null | undefined): string {
  if (!date) return "";
  return `${+date.slice(5, 7)}/${+date.slice(8, 10)}`;
}

/** "10월 23일 (금)" */
export function fmtLong(date: string): string {
  return `${+date.slice(5, 7)}월 ${+date.slice(8, 10)}일 (${WEEKDAYS_KO[weekday(date)]})`;
}

/** "2026년 10월" */
export function fmtMonth(month: string): string {
  return `${month.slice(0, 4)}년 ${+month.slice(5, 7)}월`;
}

/** 마감까지 남은 날 표시: "D-3", "D-day", "3일 지남" */
export function fmtDday(due: string, today: string): string {
  const d = diffDays(today, due);
  if (d === 0) return "오늘 마감";
  if (d > 0) return `D-${d}`;
  return `${-d}일 지남`;
}

/** 두 기간이 겹치는지 (양 끝 포함) */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
