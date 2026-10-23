"use client";

import { useId, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass, textareaClass } from "@/components/ui/field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { PROJECT_COLORS, type Project } from "@/lib/tasks/model";
import { ApiError, api } from "./api";
import { useWorkspace } from "./workspace";

/** 아직 쓰이지 않은 색을 먼저 고른다 */
function nextColor(projects: Project[]): string {
  const used = new Set(projects.map((p) => p.color.toLowerCase()));
  return (PROJECT_COLORS.find((c) => !used.has(c.value)) ?? PROJECT_COLORS[0]).value;
}

export function ProjectDialog({
  project,
  taskCount,
  onClose,
}: {
  project: Project | null;
  taskCount: number;
  onClose: () => void;
}) {
  const ws = useWorkspace();
  const uid = useId();
  const [name, setName] = useState(project?.name ?? "");
  const [client, setClient] = useState(project?.client ?? "");
  const [memo, setMemo] = useState(project?.memo ?? "");
  const [color, setColor] = useState(project?.color ?? nextColor(ws.projects));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "프로젝트명을 입력하세요" });
      return;
    }
    const payload = { name: name.trim(), color, client: client.trim() || null, memo: memo.trim() || null };
    setSaving(true);
    setFormError(null);
    try {
      if (project) await api.updateProject(project.id, payload);
      else await api.createProject(payload);
      ws.refresh();
      ws.notify(project ? "프로젝트를 저장했습니다" : "프로젝트를 만들었습니다");
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
    if (!project) return;
    setSaving(true);
    const ok = await ws.run(() => api.deleteProject(project.id), "프로젝트를 삭제했습니다");
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal title={project ? "프로젝트 편집" : "새 프로젝트"} onClose={onClose} width={500}>
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="space-y-4">
            <Field label="프로젝트명" htmlFor={`${uid}-name`} error={errors.name}>
              <input
                id={`${uid}-name`}
                className={`${inputClass} h-10 text-[15px]`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors({});
                }}
                placeholder="예: OO빌딩 신축 구조설계"
                aria-invalid={!!errors.name}
                autoFocus
                maxLength={100}
              />
            </Field>
            <Field label="발주처 (선택)" htmlFor={`${uid}-client`} error={errors.client}>
              <input
                id={`${uid}-client`}
                className={inputClass}
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="예: OO건설"
                maxLength={100}
              />
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-[13px] font-medium text-fg-muted">색상</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="프로젝트 색상">
                {PROJECT_COLORS.map((c) => {
                  const checked = c.value.toLowerCase() === color.toLowerCase();
                  return (
                    <label
                      key={c.value}
                      title={c.name}
                      className="grid size-8 cursor-pointer place-items-center rounded-full ring-offset-2 ring-offset-surface transition-shadow duration-150 has-[:checked]:ring-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ring"
                      style={{ background: c.value, ["--tw-ring-color" as string]: c.value }}
                    >
                      <input
                        type="radio"
                        name={`${uid}-color`}
                        value={c.value}
                        checked={checked}
                        onChange={() => setColor(c.value)}
                        className="sr-only"
                        aria-label={c.name}
                      />
                      {checked && <Check className="size-4 text-white" aria-hidden />}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Field label="메모 (선택)" htmlFor={`${uid}-memo`} error={errors.memo}>
              <textarea
                id={`${uid}-memo`}
                className={textareaClass}
                rows={3}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="규모, 구조형식, 계약 조건 등"
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
          {project &&
            (confirmDelete ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-sm text-danger">
                  {taskCount > 0 ? `소속 업무 ${taskCount}개도 함께 삭제됩니다.` : "프로젝트를 삭제할까요?"}
                </span>
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
          {!confirmDelete && (
            <>
              <Button onClick={onClose}>취소</Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "저장 중…" : project ? "저장" : "만들기"}
              </Button>
            </>
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
}
