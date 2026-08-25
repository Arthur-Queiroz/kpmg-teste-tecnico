import { createContext } from "react";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface ToastInput {
  kind: ToastKind;
  title: string;
  text: string;
}

export interface Toast extends ToastInput {
  id: number;
}

export interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
