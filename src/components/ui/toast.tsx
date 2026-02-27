"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  action?: { label: string; onClick: () => void };
  exiting?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"], action?: Toast["action"]) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

const EXIT_DURATION = 300;

const TOAST_STYLES: Record<Toast["type"], { container: string; icon: typeof Info }> = {
  success: {
    container: "bg-success-tint border-success text-success",
    icon: CheckCircle2,
  },
  error: {
    container: "bg-error-tint border-error text-error",
    icon: AlertCircle,
  },
  warning: {
    container: "bg-warning-tint border-warning text-warning",
    icon: AlertTriangle,
  },
  info: {
    container: "bg-info-tint border-info text-info",
    icon: Info,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_DURATION);
  }, []);

  const addToast = useCallback((message: string, type: Toast["type"] = "info", action?: Toast["action"]) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => dismissToast(id), action ? 6000 : 4000);
  }, [dismissToast]);

  const removeToast = useCallback((id: string) => {
    dismissToast(id);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 border-l-4 border min-w-[320px] max-w-[440px]",
        style.container,
        mounted && !toast.exiting
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
      style={{ transitionDuration: `${EXIT_DURATION}ms`, transitionProperty: "transform, opacity" }}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <p className="text-[14px] font-medium flex-1">{toast.message}</p>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); onClose(); }}
          className="text-[13px] font-bold uppercase tracking-caps hover:opacity-70 whitespace-nowrap"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={onClose} className="p-1 hover:opacity-70 shrink-0" aria-label="Dismiss notification">
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
