import type { Project, Task } from "@/lib/tasks/model";

/** 브라우저에서 REST API 를 부르는 얇은 래퍼 */

export class ApiError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(url: string, method: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("서버에 연결할 수 없습니다. 개발 서버가 켜져 있는지 확인하세요.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> };
  if (!res.ok) throw new ApiError(data.error ?? `요청에 실패했습니다 (${res.status})`, data.fields ?? {});
  return data as T;
}

export type ProjectPayload = { name: string; color: string; client?: string | null; memo?: string | null };
export type TaskPayload = Partial<Omit<Task, "id" | "sortOrder" | "createdAt" | "updatedAt">>;

export const api = {
  createProject: (p: ProjectPayload) => request<{ project: Project }>("/api/projects", "POST", p),
  updateProject: (id: number, p: Partial<ProjectPayload>) =>
    request<{ project: Project }>(`/api/projects/${id}`, "PATCH", p),
  deleteProject: (id: number) => request<{ deletedTasks: number }>(`/api/projects/${id}`, "DELETE"),
  createTask: (t: TaskPayload & { projectId: number; title: string }) =>
    request<{ task: Task }>("/api/tasks", "POST", t),
  updateTask: (id: number, t: TaskPayload) => request<{ task: Task }>(`/api/tasks/${id}`, "PATCH", t),
  deleteTask: (id: number) => request<{ ok: true }>(`/api/tasks/${id}`, "DELETE"),
};
