import { useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button, Field, fieldAria, inputClass, type ButtonVariant } from "./ui";

// Modal dialogs on the native <dialog> element: showModal() makes the rest of the
// page inert, traps focus and closes on Escape. We move focus into the dialog on
// open and give it back to the element that opened it on close.

type DialogProps = {
  open: boolean;
  /** Escape, the close button or a click on the backdrop. */
  onCancel: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons row. */
  footer?: ReactNode;
  size?: "sm" | "md";
  /** Wraps the body and footer in a <form> with this submit handler. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
};

export function Dialog({ open, onCancel, title, description, children, footer, size = "sm", onSubmit }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  // A click whose press started inside the dialog (e.g. selecting text in an input and
  // releasing over the backdrop) is reported on the <dialog> itself: it must not close it.
  const pressedOnBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  // Layout effect so callers can rely on the dialog being closed (and focus restored)
  // synchronously after the state update that closed it.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      const target =
        dialog.querySelector<HTMLElement>("[data-autofocus]") ??
        dialog.querySelector<HTMLElement>("input, textarea, select, button:not([data-close])");
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      if (opener.current?.isConnected) opener.current.focus();
      opener.current = null;
    }
  }, [open]);

  // Close the native dialog if the component unmounts while open.
  useLayoutEffect(() => {
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);

  const body = (
    <>
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <h2 id={titleId} className="text-lg font-semibold leading-snug">
          {title}
        </h2>
        <button
          type="button"
          data-close
          onClick={onCancel}
          aria-label="Închide"
          className="-mr-2 -mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-950"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <div className="px-6 pb-6 pt-2">
        {description && (
          <div id={descriptionId} className="text-sm leading-relaxed text-slate-600">
            {description}
          </div>
        )}
        {children && <div className={description ? "mt-4" : ""}>{children}</div>}
      </div>
      {footer && (
        <div className="flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      )}
    </>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onPointerDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedOnBackdrop.current) onCancel();
        pressedOnBackdrop.current = false;
      }}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl bg-white p-0 text-slate-700 shadow-2xl backdrop:bg-navy-950/60 backdrop:backdrop-blur-[2px] ${
        size === "md" ? "max-w-xl" : "max-w-md"
      }`}
    >
      {open &&
        (onSubmit ? (
          <form onSubmit={onSubmit} noValidate>
            {body}
          </form>
        ) : (
          body
        ))}
    </dialog>
  );
}

type ConfirmProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Yes/no question. Focus starts on the safe choice (cancel). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Anulează",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const variant: ButtonVariant = tone === "danger" ? "danger" : "primary";
  return (
    <Dialog
      open={open}
      onCancel={() => !busy && onCancel()}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

type PromptProps = {
  open: boolean;
  title: string;
  label: string;
  hint?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel: string;
  inputMode?: "url" | "text";
  /** Returns an error message, or null when the value is acceptable. */
  validate?: (value: string) => string | null;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

/** Asks for a single value (a URL, a YouTube link…). */
export function PromptDialog(props: PromptProps) {
  // Remount the form each time the dialog opens so it starts from initialValue.
  return (
    <Dialog open={props.open} onCancel={props.onCancel} title={props.title}>
      {props.open && <PromptForm {...props} />}
    </Dialog>
  );
}

function PromptForm({ label, hint, placeholder, initialValue = "", submitLabel, inputMode = "text", validate, onSubmit, onCancel }: PromptProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const problem = validate?.(value.trim()) ?? null;
        setError(problem);
        if (!problem) onSubmit(value.trim());
      }}
    >
      <Field id={id} label={label} hint={hint} error={error ?? undefined}>
        <input
          {...fieldAria(id, { hint, error: error ?? undefined })}
          type={inputMode === "url" ? "url" : "text"}
          inputMode={inputMode === "url" ? "url" : undefined}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          data-autofocus
          className={inputClass}
        />
      </Field>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Anulează
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
