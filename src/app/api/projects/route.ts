import { connection } from "next/server";
import { createProject, listProjects } from "@/lib/server/repo";
import { handle, parseBody, readJson } from "@/lib/server/http";
import { projectCreateSchema } from "@/lib/tasks/schema";

export async function GET() {
  await connection();
  return handle(() => Response.json({ projects: listProjects() }));
}

export async function POST(request: Request) {
  return handle(async () => {
    const input = parseBody(projectCreateSchema, await readJson(request));
    return Response.json({ project: createProject(input) }, { status: 201 });
  });
}
