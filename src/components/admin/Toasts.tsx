import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import type { ToastTone } from "./AdminContext";

type Toast = { id: number; message: string; tone: ToastTone };

const icons = { success: CircleCheck, error: CircleAlert, info: Info };
const tones = {
  success: "text-brand-400",
  error: "text-red-400",
  info: "text-navy-200",
};

/** Toast queue: messages disappear after a few seconds (errors stay longer). */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      // A repeated message replaces its previous copy instead of stacking up.
      setToasts((list) => [...list.filter((t) => t.message !== message).slice(-2), { id, message, tone }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), tone === "error" ? 8000 : 4500));
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  return { toasts, toast, dismiss };
}

export function ToastRegion({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {toasts.map((t) => {
        const Icon = icons[t.tone];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl bg-navy-950 px-4 py-3 text-sm text-white shadow-xl shadow-navy-950/20"
          >
            <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${tones[t.tone]}`} />
            <p className="min-w-0 flex-1 leading-relaxed">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Închide notificarea"
              className="-m-1 rounded-md p-1 text-slate-400 hover:text-white"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
