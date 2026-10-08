"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cx } from "@/lib/format";

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: { icon: CircleCheck, className: "text-emerald-500" },
  info: { icon: Info, className: "text-sky-500" },
  warning: { icon: TriangleAlert, className: "text-amber-500" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    ({ title, description, tone = "success" }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, title, description, tone }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const { icon: Icon, className } = icons[t.tone] ?? icons.success;
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-lg shadow-slate-950/10 animate-pop"
            >
              <Icon className={cx("mt-0.5 size-4 shrink-0", className)} strokeWidth={2.2} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-fg">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-subtle transition-colors hover:text-fg"
                aria-label="Tutup notifikasi"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
