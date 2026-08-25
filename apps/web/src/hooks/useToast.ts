import { useContext } from "react";

import { ToastContext, type ToastContextValue } from "../lib/toastContext";

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  }

  return context;
}
