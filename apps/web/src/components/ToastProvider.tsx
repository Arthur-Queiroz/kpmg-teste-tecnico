import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import {
  ToastContext,
  type Toast,
  type ToastInput,
  type ToastKind,
} from "../lib/toastContext";

const TOAST_DURATION_IN_MILLISECONDS = 5200;

const toastStyleByKind: Record<
  ToastKind,
  { icon: string; surface: string; iconBackground: string }
> = {
  success: { icon: "✓", surface: "bg-[#EDF9F1] border-[#BFE6CD]", iconBackground: "bg-success" },
  error: { icon: "!", surface: "bg-[#FDF0F0] border-[#F3C9C9]", iconBackground: "bg-error" },
  info: { icon: "i", surface: "bg-accent-subtle border-accent-border", iconBackground: "bg-info" },
  warning: { icon: "!", surface: "bg-[#FDF7EC] border-[#F0DFBC]", iconBackground: "bg-warning" },
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(1);

  const dismissToast = useCallback((toastId: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const toastId = nextToastId.current;
      nextToastId.current += 1;

      setToasts((current) => [...current, { ...input, id: toastId }]);
      setTimeout(() => dismissToast(toastId), TOAST_DURATION_IN_MILLISECONDS);
    },
    [dismissToast],
  );

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div
        role="status"
        aria-live="polite"
        className="fixed top-20 right-6 z-50 grid w-[min(400px,calc(100vw-48px))] gap-3"
      >
        {toasts.map((toast) => {
          const style = toastStyleByKind[toast.kind];

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-card border p-4 shadow-elevation-3 animate-toast-in ${style.surface}`}
            >
              <span
                aria-hidden="true"
                className={`flex size-[22px] flex-none items-center justify-center rounded-pill text-caption font-bold text-white ${style.iconBackground}`}
              >
                {style.icon}
              </span>

              <div className="grid min-w-0 gap-0.5">
                <span className="text-small font-semibold">{toast.title}</span>
                <span className="text-small text-text-muted">{toast.text}</span>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Fechar notificação"
                className="ml-auto cursor-pointer text-base leading-none text-text-faint hover:text-text"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
