import { CircleAlert, CircleCheck, Clock, LoaderCircle } from "lucide-react";
import type { AiSource, AiSourceStatus, AiStatus } from "../../../../shared/ai";
import { MAX_TRAINING_LABEL } from "../../../lib/aiAdminApi";
import { ApiError } from "../../../lib/api";
import { errorMessage } from "../ui";

// Small pieces shared by the "Asistent AI" admin screen.

const numberFormat = new Intl.NumberFormat("ro-RO");
/** "1.000" (Romanian thousands separator). */
export const formatNumber = (n: number) => numberFormat.format(n);

const megabytes = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 });
/** "231 KB", "21 MB", "1,5 MB" (Romanian decimal comma; an empty file is "0 KB"). */
export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${bytes === 0 ? 0 : Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${megabytes.format(bytes / (1024 * 1024))} MB`;
}

/**
 * The admin Button disables itself while busy, and the browser then drops focus to the page.
 * Call this when a busy action ends: if focus is still lost, it goes back to the button (as soon
 * as it is enabled again). Does nothing when the admin has already moved on.
 */
export function refocusButton(id: string, tries = 10) {
  requestAnimationFrame(() => {
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (!button) return;
    if (button.disabled) {
      if (tries > 0) refocusButton(id, tries - 1);
      return;
    }
    button.focus();
  });
}

/**
 * Message for a failed AI admin call: the server reports problems as field errors
 * (e.g. { file: "Tip de fișier nepermis…" }, { openai: "OPENAI_API_KEY nu este configurată…" }),
 * whose text is more useful than the generic "Date invalide.".
 */
export function aiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const field = Object.values(err.fields).find(Boolean);
    if (field) return field;
  }
  return errorMessage(err, fallback, { uploadLimit: MAX_TRAINING_LABEL });
}

/**
 * A link target from visitor-steerable text (the assistant's answers, the logged page) as a path
 * on this site, or null when it leads anywhere else: another host, a protocol-relative "//host",
 * a look-alike (punycode) domain, mailto:, javascript: and so on.
 */
export function sameSitePath(href: string | null | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.origin !== window.location.origin) return null;
    // "/.//evil.example", "/..//evil.example" or "https://<this site>//evil.example" are on this
    // origin, but their path starts with "//", which as an href is protocol-relative: another site.
    if (url.pathname.startsWith("//")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** The full address a link would open, with a look-alike domain shown in its punycode (xn--) form. */
export function fullUrl(href: string): string {
  try {
    return new URL(href, window.location.origin).href;
  } catch {
    return href;
  }
}

/** Indexing errors come from OpenAI in English; the common ones in Romanian (the original stays in a tooltip). */
export function sourceErrorText(error: string | null): string {
  if (!error) return "Indexarea a eșuat.";
  if (/could not be parsed|failed to parse|unable to parse/i.test(error)) {
    return "Fișierul nu a putut fi citit: poate fi corupt, protejat cu parolă sau poate conține doar imagini scanate.";
  }
  if (/no text|empty|does not contain/i.test(error)) return "Fișierul nu conține text care poate fi indexat.";
  if (/unsupported|not supported|invalid file/i.test(error)) return "Formatul fișierului nu este acceptat pentru indexare.";
  if (/rate limit|quota|429/i.test(error)) return "Limita serviciului OpenAI a fost atinsă. Reîncercați peste câteva minute.";
  return error;
}

const STUCK_PENDING_MS = 10 * 60 * 1000;
const STUCK_PROCESSING_MS = 30 * 60 * 1000;

/** A source left "pending" / "processing" far longer than indexing takes (e.g. after a server restart mid-upload). */
export function isStuck(source: AiSource, syncRunning: boolean, now = Date.now()) {
  const age = now - Date.parse(source.updatedAt);
  if (source.status === "pending") return !syncRunning && age > STUCK_PENDING_MS;
  if (source.status === "processing") return age > STUCK_PROCESSING_MS;
  return false;
}

/** Still being indexed (and worth polling for). */
export const isIndexing = (source: AiSource, syncRunning: boolean) =>
  (source.status === "pending" || source.status === "processing") && !isStuck(source, syncRunning);

const badge = {
  pending: {
    label: "În așteptare",
    icon: Clock,
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    iconClass: "",
  },
  processing: {
    label: "Se indexează",
    icon: LoaderCircle,
    className: "bg-navy-50 text-navy-800 ring-navy-100",
    iconClass: "motion-safe:animate-spin",
  },
  ready: {
    label: "Gata",
    icon: CircleCheck,
    className: "bg-brand-50 text-brand-800 ring-brand-200",
    iconClass: "",
  },
  failed: {
    label: "Eroare",
    icon: CircleAlert,
    className: "bg-red-50 text-red-800 ring-red-200",
    iconClass: "",
  },
} satisfies Record<AiSourceStatus, unknown>;

export function SourceStatusBadge({ status }: { status: AiSourceStatus }) {
  const { label, icon: Icon, className, iconClass } = badge[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      <Icon aria-hidden className={`size-3.5 ${iconClass}`} />
      {label}
    </span>
  );
}

/**
 * Whether the assistant searches this source: with "Folosește conținutul site-ului" switched
 * off (settings.useSiteContent = false) only uploaded files are searched.
 */
const isUsed = (source: AiSource, useSiteContent: boolean) => useSiteContent || source.kind === "upload";

/** The sources the assistant currently answers from. */
export const usedSources = (status: AiStatus) => status.sources.filter((s) => isUsed(s, status.settings.useSiteContent));

/** Counts per status, e.g. for "60 gata · 2 cu erori". */
export function countByStatus(sources: AiSource[]) {
  const counts: Record<AiSourceStatus, number> = { pending: 0, processing: 0, ready: 0, failed: 0 };
  for (const s of sources) counts[s.status]++;
  return counts;
}
