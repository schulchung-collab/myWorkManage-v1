"use client";

import { useId, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Segmented, inputClass, textareaClass } from "@/components/ui/field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { diffDays } from "@/lib/dates";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/model";
import { DATE_ORDER_MESSAGE } from "@/lib/tasks/schema";
import { ApiError, api } from "./api";
import { STATUS_STYLE } from "./status-badge";
import { useWorkspace } from "./workspace";

export interface TaskDraft {
  projectId: number;
  title: string;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  memo: string;
}

export function TaskDialog({
  task,
  defaults,
  onClose,
}: {
  task: Task | null;
  defaults?: Partial<TaskDraft>;
  onClose: () => void;
}) {
  const ws = useWorkspace();
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<TaskDraft>(() =>
    task
      ? {
          projectId: task.projectId,
          title: task.title,
          startDate: task.startDate ?? "",
          dueDate: task.dueDate ?? "",
          status: task.status,
          priority: task.priority,
          progress: task.progress,
          memo: task.memo ?? "",
        }
      : {
          projectId: ws.projects[0]?.id ?? 0,
          title: "",
          startDate: "",
          dueDate: "",
          status: "todo",
          priority: "normal",
          progress: 0,
          memo: "",
          ...defaults,
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const project = ws.projects.find((p) => p.id === draft.projectId);
  const days =
    draft.startDate && draft.dueDate && draft.startDate <= draft.dueDate
      ? diffDays(draft.startDate, draft.dueDate) + 1
      : null;

  function set<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function setStatus(status: TaskStatus) {
    setDraft((d) => ({
      ...d,
      status,
      progress: status === "done" ? 100 : d.progress,
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!draft.title.trim()) next.title = "업무 제목을 입력하세요";
    if (!draft.projectId) next.projectId = "프로젝트를 선택하세요";
    if (draft.startDate && draft.dueDate && draft.startDate > draft.dueDate) next.dueDate = DATE_ORDER_MESSAGE;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      projectId: draft.projectId,
      title: draft.title.trim(),
      startDate: draft.startDate || null,
      dueDate: draft.dueDate || null,
      status: draft.status,
      priority: draft.priority,
      progress: draft.progress,
      memo: draft.memo.trim() || null,
    };

    setSaving(true);
    setFormError(null);
    try {
      if (task) await api.updateTask(task.id, payload);
      else await api.createTask(payload);
      ws.refresh();
      ws.notify(task ? "업무를 저장했습니다" : "업무를 추가했습니다");
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setFormError(Object.keys(err.fields).length ? null : err.message);
      } else {
        setFormError("저장하지 못했습니다");
      }
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!task) return;
    setSaving(true);
    const ok = await ws.run(() => api.deleteTask(task.id), "업무를 삭제했습니다");
    setSaving(false);
    if (ok) onClose();
  }

  if (ws.projects.length === 0) {
    return (
      <Modal title="새 업무" onClose={onClose} width={420}>
        <ModalBody>
          <p className="text-sm text-fg-muted">업무를 넣을 프로젝트가 아직 없습니다. 먼저 프로젝트를 만들어 주세요.</p>
        </ModalBody>
        <ModalFooter>
          <div className="flex-1" />
          <Button onClick={onClose}>닫기</Button>
          <Button variant="primary" onClick={() => ws.newProject()}>
            새 프로젝트
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal title={task ? "업무 편집" : "새 업무"} onClose={onClose}>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
      >
        <ModalBody>
          <div className="space-y-4">
            <Field label="업무 제목" htmlFor={`${uid}-title`} error={errors.title}>
              <input
                id={`${uid}-title`}
                className={`${inputClass} h-10 text-[15px]`}
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="예: 구조계산서 검토"
                aria-invalid={!!errors.title}
                autoFocus
                maxLength={200}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="프로젝트" htmlFor={`${uid}-project`} error={errors.projectId}>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute top-1/2 left-3 size-2.5 -translate-y-1/2 rounded-full"
                    style={{ background: project?.color }}
                    aria-hidden
                  />
                  <select
                    id={`${uid}-project`}
                    className={`${inputClass} pl-8`}
                    value={draft.projectId}
                    onChange={(e) => set("projectId", Number(e.target.value))}
                  >
                    {ws.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label="우선순위">
                <Segmented
                  name={`${uid}-priority`}
                  label="우선순위"
                  value={draft.priority}
                  onChange={(v) => set("priority", v)}
                  options={TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="상태">
                <Segmented
                  name={`${uid}-status`}
                  label="상태"
                  value={draft.status}
                  onChange={setStatus}
                  options={TASK_STATUSES.map((s) => ({
                    value: s,
                    label: (
                      <>
                        <span className="size-2 rounded-full" style={{ background: STATUS_STYLE[s].dot }} aria-hidden />
                        {STATUS_LABEL[s]}
                      </>
                    ),
                  }))}
                />
              </Field>
              <Field label={`진행률 ${draft.progress}%`} htmlFor={`${uid}-progress`}>
                <div className="flex h-9 items-center gap-3">
                  <input
                    id={`${uid}-progress`}
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={draft.progress}
                    onChange={(e) => set("progress", Number(e.target.value))}
                    className="w-full cursor-pointer accent-[var(--primary)]"
                  />
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="시작일" htmlFor={`${uid}-start`} error={errors.startDate}>
                <input
                  id={`${uid}-start`}
                  type="date"
                  className={`${inputClass} tabular`}
                  value={draft.startDate}
                  max={draft.dueDate || undefined}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </Field>
              <Field
                label="마감일"
                htmlFor={`${uid}-due`}
                error={errors.dueDate}
                hint={days ? `기간 ${days}일` : "날짜가 없으면 달력·간트에 표시되지 않습니다"}
              >
                <input
                  id={`${uid}-due`}
                  type="date"
                  className={`${inputClass} tabular`}
                  value={draft.dueDate}
                  min={draft.startDate || undefined}
                  onChange={(e) => set("dueDate", e.target.value)}
                  aria-invalid={!!errors.dueDate}
                />
              </Field>
            </div>

            <Field label="메모" htmlFor={`${uid}-memo`} error={errors.memo}>
              <textarea
                id={`${uid}-memo`}
                className={textareaClass}
                rows={4}
                value={draft.memo}
                onChange={(e) => set("memo", e.target.value)}
                placeholder="검토 의견, 참고 기준, 연락처 등"
              />
            </Field>

            {formError && (
              <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
                {formError}
              </p>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          {task &&
            (confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-danger">이 업무를 삭제할까요?</span>
                <Button size="sm" onClick={() => setConfirmDelete(false)}>
                  아니요
                </Button>
                <Button size="sm" variant="danger" onClick={onDelete} disabled={saving} autoFocus>
                  삭제
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="hover:text-danger">
                <Trash2 className="size-4" aria-hidden />
                삭제
              </Button>
            ))}
          <div className="flex-1" />
          <span className="hidden text-xs text-fg-subtle md:inline">Ctrl+Enter 저장</span>
          <Button onClick={onClose}>취소</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "저장 중…" : task ? "저장" : "추가"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
