"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLE: Record<
  ToastVariant,
  { border: string; bg: string; fg: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    border: "var(--color-success-fg)",
    bg: "var(--color-success-bg)",
    fg: "var(--color-success-fg)",
    Icon: CheckCircle2,
  },
  error: {
    border: "var(--color-danger-fg)",
    bg: "var(--color-danger-bg)",
    fg: "var(--color-danger-fg)",
    Icon: XCircle,
  },
  info: {
    border: "var(--color-info-fg)",
    bg: "var(--color-info-bg)",
    fg: "var(--color-info-fg)",
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, variant, message }]);
      const timer = setTimeout(() => dismiss(id), 3500);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((t) => clearTimeout(t));
      currentTimers.clear();
    };
  }, []);

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    info: (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed z-[100] bottom-4 right-4 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const s = VARIANT_STYLE[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === "error" ? "alert" : "status"}
              className="pointer-events-auto flex items-start gap-2 border-l-[3px] border rounded-[var(--radius-md)] px-3 py-2.5 text-sm pb-toast-in"
              style={{
                color: s.fg,
                backgroundColor: s.bg,
                borderColor: `${s.border}33`,
                borderLeftColor: s.border,
              }}
            >
              <s.Icon size={18} strokeWidth={1.75} className="shrink-0 mt-0.5" />
              <span className="flex-1 leading-[1.5]">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="ปิด"
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-[var(--duration-pb-base)] p-0.5 rounded-[var(--radius-xs)]"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
