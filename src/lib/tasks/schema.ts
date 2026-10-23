import { z } from "zod";
import { isIsoDate } from "@/lib/dates";
import { TASK_PRIORITIES, TASK_STATUSES } from "./model";

/** 빈 문자열은 null 로 바꾸는 선택 텍스트 */
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max, `${max}자 이하로 입력하세요`).nullable(),
  );

const optionalDate = z.preprocess(
  (v) => (v === "" ? null : v),
  z
    .string()
    .refine(isIsoDate, "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)")
    .nullable(),
);

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1, "프로젝트명을 입력하세요").max(100, "100자 이하로 입력하세요"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "색상 형식이 올바르지 않습니다"),
  client: optionalText(100).optional(),
  memo: optionalText(2000).optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const taskCreateSchema = z.object({
  projectId: z.number().int().positive("프로젝트를 선택하세요"),
  title: z.string().trim().min(1, "업무 제목을 입력하세요").max(200, "200자 이하로 입력하세요"),
  startDate: optionalDate.optional(),
  dueDate: optionalDate.optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  progress: z.number().int().min(0, "0~100 사이로 입력하세요").max(100, "0~100 사이로 입력하세요").optional(),
  memo: optionalText(5000).optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export interface FieldErrors {
  error: string;
  fields: Record<string, string>;
}

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return { error: error.issues[0]?.message ?? "입력값이 올바르지 않습니다", fields };
}

export const DATE_ORDER_MESSAGE = "마감일은 시작일과 같거나 그 뒤여야 합니다";
