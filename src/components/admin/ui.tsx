import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert, type LucideIcon } from "lucide-react";
import type { PostStatus } from "../../../shared/blog";
import { ApiError } from "../../lib/api";

// Small building blocks shared by the admin screens. Calm palette: slate surfaces,
// navy for primary actions, mint (brand) for the "publish / create" accent.

// ---- buttons ----------------------------------------------------------------------

const variants = {
  primary: "bg-navy-900 text-white hover:bg-navy-800",
  accent: "bg-brand-400 text-navy-950 hover:bg-brand-300",
  secondary: "border border-slate-300 bg-white text-navy-900 hover:border-slate-400 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-navy-950",
  danger: "bg-red-600 text-white hover:bg-red-700",
  "danger-outline": "border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50",
} as const;

const sizes = {
  sm: "gap-1.5 px-3 py-1.5 text-sm",
  md: "gap-2 px-4 py-2.5 text-sm",
} as const;

export type ButtonVariant = keyof typeof variants;

export const buttonClass = (variant: ButtonVariant = "primary", size: keyof typeof sizes = "md", extra = "") =>
  `inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${extra}`;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  icon?: LucideIcon;
  /** Shows a spinner and disables the button. */
  busy?: boolean;
};

export function Button({ variant, size, icon: Icon, busy = false, className = "", type = "button", children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      {busy ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : Icon && <Icon aria-hidden className="size-4" />}
      {children}
    </button>
  );
}

type ButtonLinkProps = LinkProps & { variant?: ButtonVariant; size?: keyof typeof sizes; icon?: LucideIcon };

export function AdminButtonLink({ variant, size, icon: Icon, className = "", children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {Icon && <Icon aria-hidden className="size-4" />}
      {children}
    </Link>
  );
}

// ---- form fields ------------------------------------------------------------------

export const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-navy-950 transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-600 disabled:bg-slate-50 aria-[invalid=true]:border-red-500";

export const labelClass = "block text-sm font-semibold text-navy-950";

/** aria-describedby / aria-invalid for a control rendered inside <Field>. */
export function fieldAria(id: string, { hint, error }: { hint?: ReactNode; error?: string }) {
  const ids = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return { id, "aria-describedby": ids || undefined, "aria-invalid": error ? true : undefined };
}

type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  /** Extra content on the label row, right-aligned (e.g. a character counter). */
  aside?: ReactNode;
  children: ReactNode;
};

export function Field({ id, label, hint, error, optional, aside, children }: FieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
          {optional && <span className="font-normal text-slate-500"> (opțional)</span>}
        </label>
        {aside}
      </div>
      <div className="mt-1.5">{children}</div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {error}
    </p>
  );
}

/** Accessible on/off switch built on a checkbox. */
export function Toggle({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors checked:bg-brand-600"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
        />
      </span>
      <span>
        <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-navy-950">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="block text-xs leading-relaxed text-slate-500">
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}

// ---- layout -----------------------------------------------------------------------

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Replaces the "Administrare" context line above the title, e.g. a link back to the list. */
  back?: ReactNode;
  /** Shown on the title row, after the title (e.g. a status badge). */
  titleAddon?: ReactNode;
  /** Keep the header (and its actions) visible while scrolling, e.g. the post editor's save bar. */
  sticky?: boolean;
};

/**
 * Title block of every admin screen; renders the page's only <h1>. It has the same structure
 * and (on wider screens) the same height on every page, so switching between screens never
 * moves the title or the content below it.
 */
export function AdminPageHeader({ title, description, actions, back, titleAddon, sticky = false }: PageHeaderProps) {
  // The title block stays at the top (self-start) even when wrapped actions are taller than it
  // (e.g. the editor's two buttons on a tablet), so the h1 never moves; the actions stay bottom-aligned.
  const content = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 sm:min-h-[5.375rem] sm:self-start">
        <div className="flex h-5 items-center text-sm">
          {back ?? <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Administrare</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {titleAddon}
        </div>
        {description && <p className="mt-1.5 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );

  if (!sticky) return <div className="mb-6 sm:mb-8">{content}</div>;

  // Sticky variant: extends into the shell's padding (same values as <main> in AdminShell) so that
  // at rest the title sits exactly where the non-sticky header puts it; pb + 1px border + mb equal
  // mb-6 / mb-8, so the content below starts at the same height too.
  return (
    <div className="sticky top-14 z-30 -mx-4 -mt-6 mb-[calc(0.75rem-1px)] border-b border-slate-200 bg-slate-100/95 px-4 pb-3 pt-6 backdrop-blur sm:-mx-6 sm:-mt-8 sm:mb-[calc(1rem-1px)] sm:px-6 sm:pb-4 sm:pt-8 lg:top-0 lg:-mx-10 lg:-mt-10 lg:px-10 lg:pt-10">
      {content}
    </div>
  );
}

export function Card({
  title,
  titleId,
  actions,
  className = "",
  children,
}: {
  title?: string;
  titleId?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-navy-900/[0.03] sm:p-6 ${className}`}
    >
      {title && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

// ---- status -----------------------------------------------------------------------

export function StatusBadge({ status }: { status: PostStatus }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-200 ring-inset">
      <span aria-hidden className="size-1.5 rounded-full bg-brand-600" />
      Publicat
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset">
      <span aria-hidden className="size-1.5 rounded-full bg-amber-500" />
      Ciornă
    </span>
  );
}

const alertTones = {
  error: { icon: CircleAlert, className: "border-red-200 bg-red-50 text-red-800" },
  warning: { icon: TriangleAlert, className: "border-amber-200 bg-amber-50 text-amber-900" },
  info: { icon: Info, className: "border-navy-100 bg-navy-50 text-navy-800" },
  success: { icon: CircleCheck, className: "border-brand-200 bg-brand-50 text-brand-800" },
};

export function Alert({
  tone = "info",
  children,
  className = "",
  live = tone === "error",
}: {
  tone?: keyof typeof alertTones;
  children: ReactNode;
  className?: string;
  /** Announce to screen readers when it appears (role="alert"). */
  live?: boolean;
}) {
  const { icon: Icon, className: toneClass } = alertTones[tone];
  return (
    <div role={live ? "alert" : undefined} className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${toneClass} ${className}`}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon aria-hidden className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      {text && <p className="mt-1.5 max-w-md text-sm text-slate-600">{text}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function LoadingBlock({ label, rows = 4 }: { label: string; rows?: number }) {
  return (
    <div aria-busy="true" className="space-y-3">
      <p className="sr-only" role="status">
        {label}
      </p>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden className="h-16 animate-pulse rounded-xl bg-slate-200/70" />
      ))}
    </div>
  );
}

// ---- helpers ----------------------------------------------------------------------

export const isUnauthorized = (err: unknown) => err instanceof ApiError && err.status === 401;

/** An ApiError without a message from the server (no JSON body, e.g. from a proxy): only "Eroare 502". */
const noServerMessage = (err: ApiError) => !err.message || /^Eroare \d+$/.test(err.message);

/**
 * User-facing Romanian message for a failed API call.
 * `uploadLimit` (e.g. "20 MB") is used for a 413 answer that carries no message of its own.
 */
export function errorMessage(
  err: unknown,
  fallback = "A apărut o eroare. Încercați din nou.",
  { uploadLimit }: { uploadLimit?: string } = {},
): string {
  if (err instanceof ApiError) {
    if (err.status === 413 && noServerMessage(err)) {
      return uploadLimit ? `Fișierul depășește ${uploadLimit}.` : "Fișierul este prea mare.";
    }
    if (err.status >= 500 && noServerMessage(err)) {
      return "Serverul nu răspunde. Încercați din nou peste câteva momente.";
    }
    return err.message || fallback;
  }
  if (err instanceof TypeError) return "Nu am putut contacta serverul. Verificați conexiunea la internet.";
  return fallback;
}

const HOSTNAME = /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+\p{L}{2,}$/u;

/**
 * mailto: link for an address typed by a site visitor, or null if it is not a plain address.
 * The public forms accept e.g. "ceo@client.ro?bcc=spy%40evil.com", which as a raw mailto:
 * would silently copy the admin's reply to a third party; such values are shown as text only.
 */
export function mailtoHref(email: string, subject?: string): string | null {
  const parts = email.trim().split("@");
  if (parts.length !== 2 || !parts[0] || !HOSTNAME.test(parts[1])) return null;
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${encodeURIComponent(parts[0])}@${parts[1]}${query}`;
}

/** Today's date (local time) as YYYY-MM-DD. */
export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Lowercase, diacritics removed: for forgiving searches. */
export const searchKey = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

// Post dates are calendar days ("2026-09-23"); JS parses them as UTC midnight, so format
// them in UTC too, or they show the previous day for anyone west of Greenwich.
const dayFormat = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "23 septembrie 2026" for a YYYY-MM-DD date. */
export const formatDay = (isoDate: string) => dayFormat.format(new Date(isoDate));

const dateTimeFormat = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "23 septembrie 2026, 14:05" (browser time zone). */
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

/** "1 articol", "2 articole", "20 de articole" (Romanian plural rules). */
export function plural(n: number, one: string, few: string) {
  if (n === 1) return `1 ${one}`;
  const rest = n % 100;
  return n === 0 || (rest >= 1 && rest <= 19) ? `${n} ${few}` : `${n} de ${few}`;
}
