"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "./utils";

type ToastVariant = "success" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
let idCounter = 0;

const variantStyles: Record<ToastVariant, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "text-success" },
  info: { icon: Info, className: "text-info" },
  warning: { icon: AlertTriangle, className: "text-warning" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2.5rem))]">
        {toasts.map((toast) => {
          const { icon: Icon, className } = variantStyles[toast.variant];
          return (
            <div
              key={toast.id}
              className="animate-fade-in flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg shadow-slate-900/5"
            >
              <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", className)} />
              <p className="text-sm text-foreground leading-snug">{toast.message}</p>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="ml-auto text-muted hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
