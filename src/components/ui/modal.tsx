"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { IconButton } from "./button";

/**
 * 네이티브 <dialog> 기반 모달. 마운트되면 열리고 언마운트되면 닫힌다.
 * Esc, 바깥 클릭, 닫기 버튼으로 onClose 를 부른다. 포커스 가두기는 브라우저가 처리한다.
 */
export function Modal({
  title,
  onClose,
  children,
  width = 560,
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const downOnBackdrop = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="app-dialog"
      style={{ width: `min(${width}px, calc(100vw - 32px))` }}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === ref.current;
      }}
      onClick={(e) => {
        // 입력칸에서 드래그하다 바깥에서 놓은 경우는 닫지 않는다
        if (e.target === ref.current && downOnBackdrop.current) onClose();
      }}
    >
      <div className="flex max-h-[calc(100dvh-48px)] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <IconButton label="닫기" onClick={onClose}>
            <X className="size-4" aria-hidden />
          </IconButton>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>;
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-t border-line bg-subtle/50 px-5 py-3">{children}</div>
  );
}
