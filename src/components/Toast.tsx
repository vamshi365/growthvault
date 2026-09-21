"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastApi = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const latest = items[items.length - 1];
    const t = window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== latest.id));
    }, 2200);
    return () => window.clearTimeout(t);
  }, [items]);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 px-4 pb-[calc(100px+env(safe-area-inset-bottom,0px))]"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`gv-toast max-w-[min(400px,100%)] px-4 py-3 text-center text-sm font-semibold shadow-lg ${
              item.tone === "error"
                ? "bg-[#3A2024] text-[#FF8A80]"
                : item.tone === "info"
                  ? "border border-gv-border bg-gv-card text-gv-text"
                  : "bg-gv-accent text-white"
            }`}
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { toast: (_m?: string, _t?: ToastTone) => undefined };
  }
  return ctx;
}

/** One-shot haptic on successful save only. */
export function vibrateOnce() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
  } catch {
    /* ignore */
  }
}
