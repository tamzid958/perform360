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

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const icons = {
    success: <CheckCircle2 size={18} strokeWidth={1.5} className="text-green-500" />,
    error: <AlertCircle size={18} strokeWidth={1.5} className="text-red-500" />,
    warning: <AlertTriangle size={18} strokeWidth={1.5} className="text-amber-500" />,
    info: <Info size={18} strokeWidth={1.5} className="text-brand-500" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 shadow-lg border border-gray-100 dark:border-gray-700 min-w-[300px] max-w-[420px] transition-all",
        mounted && !toast.exiting
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
      style={{ transitionDuration: `${EXIT_DURATION}ms` }}
    >
      {icons[toast.type]}
      <p className="text-callout text-gray-900 dark:text-gray-100 flex-1">{toast.message}</p>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); onClose(); }}
          className="text-[13px] font-medium text-brand-500 hover:text-brand-600 whitespace-nowrap transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" aria-label="Dismiss notification">
        <X size={14} strokeWidth={1.5} className="text-gray-400" />
      </button>
    </div>
  );
}
