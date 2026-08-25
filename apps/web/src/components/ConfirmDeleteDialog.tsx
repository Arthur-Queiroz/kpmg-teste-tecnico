import { useEffect } from "react";

import { Button } from "./Button";

export interface ConfirmDeleteDialogProps {
  companyName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  companyName,
  isDeleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(16,24,40,0.45)] p-6"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[460px] overflow-hidden rounded-card bg-white shadow-elevation-4"
      >
        <div className="flex items-start gap-3 px-6 pt-6">
          <span
            aria-hidden="true"
            className="flex size-9 flex-none items-center justify-center rounded-pill bg-error/10 text-[17px] font-bold text-error"
          >
            !
          </span>
          <h3 id="confirm-delete-title" className="mt-1.5 text-h3 font-semibold">
            Excluir empresa
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="ml-auto cursor-pointer p-1 text-xl leading-none text-text-faint hover:text-text"
          >
            ×
          </button>
        </div>

        <p className="mt-3 mr-6 mb-6 ml-[72px] text-body text-text-muted">
          Tem certeza que deseja excluir <strong>{companyName}</strong>? Esta ação
          não pode ser desfeita.
        </p>

        <div className="flex justify-end gap-3 border-t border-border bg-bg-subtle px-6 py-4">
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}
