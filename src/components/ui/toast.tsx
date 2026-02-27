"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 size={18} strokeWidth={1.5} className="text-green-500" />,
    error: <AlertCircle size={18} strokeWidth={1.5} className="text-red-500" />,
    warning: <AlertTriangle size={18} strokeWidth={1.5} className="text-amber-500" />,
    info: <Info size={18} strokeWidth={1.5} className="text-blue-500" />,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg border border-gray-100 min-w-[300px] animate-in slide-in-from-right-full"
      )}
    >
      {icons[toast.type]}
      <p className="text-[14px] text-gray-900 flex-1">{toast.message}</p>
      <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
        <X size={14} strokeWidth={1.5} className="text-gray-400" />
      </button>
    </div>
  );
}
