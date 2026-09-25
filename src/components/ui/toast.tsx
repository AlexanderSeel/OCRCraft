"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "loading" | "success" | "error" | "info";

export interface ToastInput {
  readonly title: string;
  readonly message?: string;
  readonly tone?: ToastTone;
  readonly durationMs?: number | null;
}

interface ToastEntry extends ToastInput {
  readonly id: string;
  readonly tone: ToastTone;
}

interface ToastContextValue {
  readonly pushToast: (input: ToastInput) => string;
  readonly updateToast: (id: string, input: Partial<ToastInput>) => void;
  readonly dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly ToastEntry[]>([]);
  const counter = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((input: ToastInput) => {
    counter.current += 1;
    const id = `toast-${counter.current}`;
    setToasts((current) => [
      ...current,
      { ...input, id, tone: input.tone ?? "info" },
    ].slice(-5));
    return id;
  }, []);

  const updateToast = useCallback((id: string, input: Partial<ToastInput>) => {
    setToasts((current) => current.map((toast) =>
      toast.id === id
        ? { ...toast, ...input, tone: input.tone ?? toast.tone }
        : toast
    ));
  }, []);

  const value = useMemo(() => ({ pushToast, updateToast, dismissToast }), [dismissToast, pushToast, updateToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Benachrichtigungen"
        aria-live="polite"
        className="pointer-events-none fixed right-3 top-3 z-[2147482500] grid w-[min(92vw,380px)] gap-2 sm:right-5 sm:top-5"
      >
        {toasts.map((toast) => (
          <ToastCard dismiss={dismissToast} key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider.");
  return value;
}

function ToastCard({
  toast,
  dismiss,
}: {
  readonly toast: ToastEntry;
  readonly dismiss: (id: string) => void;
}) {
  const durationMs = toast.durationMs === undefined
    ? toast.tone === "loading" ? null : toast.tone === "error" ? 7000 : 4500
    : toast.durationMs;

  useEffect(() => {
    if (durationMs == null) return;
    const handle = window.setTimeout(() => dismiss(toast.id), durationMs);
    return () => window.clearTimeout(handle);
  }, [dismiss, durationMs, toast.id]);

  const toneClass = toast.tone === "success"
    ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-foreground)]"
    : toast.tone === "error"
      ? "border-[var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]"
      : toast.tone === "loading"
        ? "border-[var(--focus)] bg-[var(--surface-elevated)] text-[var(--foreground)]"
        : "border-[var(--border-strong)] bg-[var(--surface-elevated)] text-[var(--foreground)]";

  return (
    <div
      className={`pointer-events-auto rounded-xl border p-4 shadow-[var(--shadow-raised)] ${toneClass}`}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <div className="flex items-start gap-3">
        {toast.tone === "loading" ? (
          <span aria-hidden="true" className="mt-0.5 size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
        ) : (
          <span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full bg-current" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-black">{toast.title}</div>
          {toast.message ? <p className="mt-1 text-sm leading-5">{toast.message}</p> : null}
        </div>
        <button
          aria-label="Benachrichtigung schließen"
          className="shrink-0 rounded-md px-2 py-1 text-xs font-black hover:bg-[var(--surface-subtle)]"
          onClick={() => dismiss(toast.id)}
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}
