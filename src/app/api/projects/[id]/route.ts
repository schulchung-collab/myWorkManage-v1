import { connection } from "next/server";
import { deleteProject, getProject, updateProject } from "@/lib/server/repo";
import { handle, parseBody, parseId, readJson } from "@/lib/server/http";
import { projectUpdateSchema } from "@/lib/tasks/schema";

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  await connection();
  return handle(async () => {
    const id = parseId((await ctx.params).id);
    return Response.json({ project: getProject(id) });
  });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  return handle(async () => {
    const id = parseId((await ctx.params).id);
    const patch = parseBody(projectUpdateSchema, await readJson(request));
    return Response.json({ project: updateProject(id, patch) });
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  return handle(async () => {
    const id = parseId((await ctx.params).id);
    return Response.json(deleteProject(id));
  });
}
