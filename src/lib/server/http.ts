import { z } from "zod";
import { toFieldErrors } from "@/lib/tasks/schema";
import { InputError, NotFoundError } from "./repo";

export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError("잘못된 ID 입니다");
  return id;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new InputError("요청 본문이 올바른 JSON 이 아닙니다");
  }
}

export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const { error, fields } = toFieldErrors(result.error);
    throw new InputError(error, fields);
  }
  return result.data;
}

/** 라우트 핸들러 공통 오류 처리 */
export async function handle(fn: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof InputError) {
      return Response.json({ error: err.message, fields: err.fields }, { status: 400 });
    }
    if (err instanceof NotFoundError) {
      return Response.json({ error: err.message }, { status: 404 });
    }
    console.error(err);
    return Response.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
