"use client";

import type { ReactNode } from "react";
import { Modal } from "./modal";

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = true,
  confirmDisabled = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  confirmDisabled?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} tone={danger ? "ink" : "lime"}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 text-base">{children}</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn" onClick={onCancel} data-autofocus>
            Cancel
          </button>
          <button type="button" className={danger ? "btn btn-danger" : "btn btn-lime"} onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
