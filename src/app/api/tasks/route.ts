import { connection } from "next/server";
import { createTask, listTasks } from "@/lib/server/repo";
import { handle, parseBody, parseId, readJson } from "@/lib/server/http";
import { taskCreateSchema } from "@/lib/tasks/schema";

/** GET /api/tasks?projectId=1 */
export async function GET(request: Request) {
  await connection();
  return handle(() => {
    const raw = new URL(request.url).searchParams.get("projectId");
    const projectId = raw ? parseId(raw) : undefined;
    return Response.json({ tasks: listTasks({ projectId }) });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const input = parseBody(taskCreateSchema, await readJson(request));
    return Response.json({ task: createTask(input) }, { status: 201 });
  });
}
