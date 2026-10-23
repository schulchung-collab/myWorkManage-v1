/**
 * 업무 관리 앱의 공통 타입과 표시용 상수.
 * 서버와 브라우저 양쪽에서 쓰므로 DB 코드를 import 하지 않는다.
 */

export const TASK_STATUSES = ["todo", "doing", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "normal", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "예정",
  doing: "진행",
  done: "완료",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "낮음",
  normal: "보통",
  high: "높음",
};

export interface Project {
  id: number;
  name: string;
  color: string;
  client: string | null;
  memo: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  /** YYYY-MM-DD */
  startDate: string | null;
  /** YYYY-MM-DD */
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** 0~100 */
  progress: number;
  memo: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 프로젝트 색상 프리셋. 모두 흰 글자와 대비 4.5:1 이상이다.
 */
export const PROJECT_COLORS: { value: string; name: string }[] = [
  { value: "#2563eb", name: "파랑" },
  { value: "#c2410c", name: "주황" },
  { value: "#15803d", name: "초록" },
  { value: "#7c3aed", name: "보라" },
  { value: "#be123c", name: "빨강" },
  { value: "#0f766e", name: "청록" },
  { value: "#b45309", name: "황토" },
  { value: "#0e7490", name: "하늘" },
  { value: "#be185d", name: "분홍" },
  { value: "#475569", name: "회색" },
];

/** task 의 표시 기간. 날짜가 하나만 있으면 그 하루로 본다. */
export function taskSpan(task: Pick<Task, "startDate" | "dueDate">): { start: string; end: string } | null {
  const start = task.startDate ?? task.dueDate;
  const end = task.dueDate ?? task.startDate;
  if (!start || !end) return null;
  return start <= end ? { start, end } : { start: end, end: start };
}

/** 프로젝트 기간 = 소속 task 의 가장 이른 날 ~ 가장 늦은 날 */
export function projectSpan(tasks: Task[]): { start: string; end: string } | null {
  let start: string | null = null;
  let end: string | null = null;
  for (const t of tasks) {
    const s = taskSpan(t);
    if (!s) continue;
    if (!start || s.start < start) start = s.start;
    if (!end || s.end > end) end = s.end;
  }
  return start && end ? { start, end } : null;
}

/** 마감이 지났는데 완료되지 않은 task */
export function isOverdue(task: Pick<Task, "dueDate" | "status">, today: string): boolean {
  return task.status !== "done" && !!task.dueDate && task.dueDate < today;
}

export function compareTasks(a: Task, b: Task): number {
  const as = a.startDate ?? a.dueDate ?? "9999-99-99";
  const bs = b.startDate ?? b.dueDate ?? "9999-99-99";
  if (as !== bs) return as < bs ? -1 : 1;
  const ad = a.dueDate ?? "9999-99-99";
  const bd = b.dueDate ?? "9999-99-99";
  if (ad !== bd) return ad < bd ? -1 : 1;
  return a.sortOrder - b.sortOrder || a.id - b.id;
}

export function groupTasksByProject(tasks: Task[]): Map<number, Task[]> {
  const map = new Map<number, Task[]>();
  for (const t of tasks) {
    const list = map.get(t.projectId);
    if (list) list.push(t);
    else map.set(t.projectId, [t]);
  }
  for (const list of map.values()) list.sort(compareTasks);
  return map;
}
