import type { SQLInputValue } from "node:sqlite";
import { getDb } from "./db";
import type { Project, Task, TaskPriority, TaskStatus } from "@/lib/tasks/model";
import {
  DATE_ORDER_MESSAGE,
  type ProjectCreateInput,
  type ProjectUpdateInput,
  type TaskCreateInput,
  type TaskUpdateInput,
} from "@/lib/tasks/schema";

export class NotFoundError extends Error {}
export class InputError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

interface ProjectRow {
  id: number;
  name: string;
  color: string;
  client: string | null;
  memo: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: number;
  project_id: number;
  title: string;
  start_date: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  memo: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function toProject(r: ProjectRow): Project {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    client: r.client,
    memo: r.memo,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toTask(r: TaskRow): Task {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    startDate: r.start_date,
    dueDate: r.due_date,
    status: r.status,
    priority: r.priority,
    progress: r.progress,
    memo: r.memo,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const nowIso = () => new Date().toISOString();

// ───────────────────────── 프로젝트 ─────────────────────────

export function listProjects(): Project[] {
  const rows = getDb()
    .prepare("SELECT * FROM projects ORDER BY sort_order, id")
    .all() as unknown as ProjectRow[];
  return rows.map(toProject);
}

export function getProject(id: number): Project {
  const row = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  if (!row) throw new NotFoundError("프로젝트를 찾을 수 없습니다");
  return toProject(row);
}

export function createProject(input: ProjectCreateInput): Project {
  const db = getDb();
  const now = nowIso();
  const { next } = db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM projects")
    .get() as { next: number };
  const res = db
    .prepare(
      `INSERT INTO projects (name, color, client, memo, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(input.name, input.color, input.client ?? null, input.memo ?? null, next, now, now);
  return getProject(Number(res.lastInsertRowid));
}

export function updateProject(id: number, patch: ProjectUpdateInput): Project {
  getProject(id);
  const sets: string[] = [];
  const values: SQLInputValue[] = [];
  const columns: Record<keyof ProjectUpdateInput, string> = {
    name: "name",
    color: "color",
    client: "client",
    memo: "memo",
  };
  for (const key of Object.keys(columns) as (keyof ProjectUpdateInput)[]) {
    if (patch[key] !== undefined) {
      sets.push(`${columns[key]} = ?`);
      values.push(patch[key] ?? null);
    }
  }
  if (sets.length > 0) {
    sets.push("updated_at = ?");
    values.push(nowIso(), id);
    getDb()
      .prepare(`UPDATE projects SET ${sets.join(", ")} WHERE id = ?`)
      .run(...values);
  }
  return getProject(id);
}

/** 프로젝트와 소속 task 를 함께 지운다. 지운 task 수를 돌려준다. */
export function deleteProject(id: number): { deletedTasks: number } {
  getProject(id);
  const db = getDb();
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE project_id = ?").get(id) as { n: number };
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return { deletedTasks: n };
}

// ───────────────────────── task ─────────────────────────

export function listTasks(filter: { projectId?: number } = {}): Task[] {
  const db = getDb();
  const rows = (
    filter.projectId
      ? db.prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY sort_order, id").all(filter.projectId)
      : db.prepare("SELECT * FROM tasks ORDER BY project_id, sort_order, id").all()
  ) as unknown as TaskRow[];
  return rows.map(toTask);
}

export function getTask(id: number): Task {
  const row = getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
  if (!row) throw new NotFoundError("업무를 찾을 수 없습니다");
  return toTask(row);
}

function assertProjectExists(projectId: number) {
  const row = getDb().prepare("SELECT 1 AS ok FROM projects WHERE id = ?").get(projectId);
  if (!row) throw new InputError("존재하지 않는 프로젝트입니다", { projectId: "프로젝트를 선택하세요" });
}

function assertDateOrder(start: string | null | undefined, due: string | null | undefined) {
  if (start && due && start > due) {
    throw new InputError(DATE_ORDER_MESSAGE, { dueDate: DATE_ORDER_MESSAGE });
  }
}

export function createTask(input: TaskCreateInput): Task {
  assertProjectExists(input.projectId);
  assertDateOrder(input.startDate, input.dueDate);
  const db = getDb();
  const now = nowIso();
  const { next } = db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM tasks WHERE project_id = ?")
    .get(input.projectId) as { next: number };
  const status = input.status ?? "todo";
  const progress = input.progress ?? (status === "done" ? 100 : 0);
  const res = db
    .prepare(
      `INSERT INTO tasks (project_id, title, start_date, due_date, status, priority, progress, memo, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.projectId,
      input.title,
      input.startDate ?? null,
      input.dueDate ?? null,
      status,
      input.priority ?? "normal",
      progress,
      input.memo ?? null,
      next,
      now,
      now,
    );
  return getTask(Number(res.lastInsertRowid));
}

export function updateTask(id: number, patch: TaskUpdateInput): Task {
  const current = getTask(id);
  if (patch.projectId !== undefined) assertProjectExists(patch.projectId);
  const start = patch.startDate !== undefined ? patch.startDate : current.startDate;
  const due = patch.dueDate !== undefined ? patch.dueDate : current.dueDate;
  assertDateOrder(start, due);

  const columns: Record<keyof TaskUpdateInput, string> = {
    projectId: "project_id",
    title: "title",
    startDate: "start_date",
    dueDate: "due_date",
    status: "status",
    priority: "priority",
    progress: "progress",
    memo: "memo",
  };
  const sets: string[] = [];
  const values: SQLInputValue[] = [];
  for (const key of Object.keys(columns) as (keyof TaskUpdateInput)[]) {
    if (patch[key] !== undefined) {
      sets.push(`${columns[key]} = ?`);
      values.push(patch[key] ?? null);
    }
  }
  if (sets.length > 0) {
    sets.push("updated_at = ?");
    values.push(nowIso(), id);
    getDb()
      .prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`)
      .run(...values);
  }
  return getTask(id);
}

export function deleteTask(id: number): void {
  getTask(id);
  getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id);
}
