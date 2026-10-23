import { connection } from "next/server";
import { deleteTask, getTask, updateTask } from "@/lib/server/repo";
import { handle, parseBody, parseId, readJson } from "@/lib/server/http";
import { taskUpdateSchema } from "@/lib/tasks/schema";

export async function GET(_request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  await connection();
  return handle(async () => {
    const id = parseId((await ctx.params).id);
    return Response.json({ task: getTask(id) });
  });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  return handle(async () => {
    const id = parseId((await ctx.params).id);
    const patch = parseBody(taskUpdateSchema, await readJson(request));
    return Response.json({ task: updateTask(id, patch) });
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  return handle(async () => {
    const id = parseId((await ctx.params).id);
    deleteTask(id);
    return Response.json({ ok: true });
  });
}
