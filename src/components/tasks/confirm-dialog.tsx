"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  /** true 를 돌려주면 창을 닫는다 */
  onConfirm: () => Promise<boolean>;
}

export function ConfirmDialog({ options, onClose }: { options: ConfirmOptions; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={options.title} onClose={onClose} width={420}>
      <ModalBody>
        <div className="text-sm leading-relaxed text-fg-muted">{options.message}</div>
      </ModalBody>
      <ModalFooter>
        <div className="flex-1" />
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="danger"
          autoFocus
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const ok = await options.onConfirm();
            setBusy(false);
            if (ok) onClose();
          }}
        >
          {options.confirmLabel ?? "삭제"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
