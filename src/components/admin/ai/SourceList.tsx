import { ExternalLink, RotateCcw, Trash } from "lucide-react";
import type { AiSource } from "../../../../shared/ai";
import { buttonClass } from "../ui";
import { SourceStatusBadge, formatBytes, isStuck, sourceErrorText } from "./shared";

// Knowledge sources as a table (tablet / desktop) or cards (phone), like the other admin lists.

const shortDateTime = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const formatShort = (iso: string) => shortDateTime.format(new Date(iso));

const iconAction =
  "inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-950 disabled:cursor-not-allowed disabled:opacity-50";

const fileType = (s: AiSource) => s.filename.match(/\.([^.]+)$/)?.[1]?.toUpperCase() ?? "";

type Props = {
  sources: AiSource[];
  /** Screen-reader caption of the table. */
  caption: string;
  /** Uploaded files can be deleted; site pages and posts come back with the next sync. */
  deletable: boolean;
  /** False when OPENAI_API_KEY is missing: actions that talk to OpenAI are disabled. */
  configured: boolean;
  syncRunning: boolean;
  /** False for sources the assistant does not use (site content switched off): no retry. */
  retryable?: boolean;
  busyIds: ReadonlySet<number>;
  onRetry: (source: AiSource) => void;
  onDelete: (source: AiSource) => void;
};

export function SourceList({ sources, caption, deletable, configured, syncRunning, retryable = true, busyIds, onRetry, onDelete }: Props) {
  const canRetry = (s: AiSource) => retryable && (s.status === "failed" || isStuck(s, syncRunning));

  const problem = (s: AiSource) =>
    s.status === "failed" ? (
      <span className="mt-1 block break-words text-xs font-medium text-red-700" title={s.error ?? undefined}>
        {sourceErrorText(s.error)}
      </span>
    ) : retryable && isStuck(s, syncRunning) ? (
      <span className="mt-1 block text-xs font-medium text-amber-800">Pare blocat. Reîncercați.</span>
    ) : null;

  const subtitle = (s: AiSource) =>
    s.url ? (
      <a
        href={s.url}
        target="_blank"
        rel="noopener"
        className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate font-mono text-xs text-navy-700 hover:underline"
      >
        <span className="truncate">{s.url}</span>
        <ExternalLink aria-hidden className="size-3 shrink-0" />
        <span className="sr-only">(se deschide într-o filă nouă)</span>
      </a>
    ) : (
      <span className="mt-0.5 block truncate font-mono text-xs text-slate-500" title={s.filename}>
        {s.filename}
      </span>
    );

  return (
    <>
      {/* Tablet / desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                Sursă
              </th>
              <th scope="col" className="w-28 px-4 py-3">
                Mărime
              </th>
              <th scope="col" className="w-36 px-4 py-3">
                Stare
              </th>
              <th scope="col" className="hidden w-44 px-4 py-3 lg:table-cell">
                Actualizat
              </th>
              <th scope="col" className="w-24 px-4 py-3 text-right">
                <span className="sr-only">Acțiuni</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.map((s) => (
              <tr key={s.id} className="align-top transition-colors hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <span className="block break-words font-semibold text-navy-950">{s.title}</span>
                  {subtitle(s)}
                  {problem(s)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatBytes(s.bytes)}
                  {deletable && fileType(s) && <span className="block text-xs text-slate-500">{fileType(s)}</span>}
                </td>
                <td className="px-4 py-3">
                  <SourceStatusBadge status={s.status} />
                  <time dateTime={s.updatedAt} className="mt-1 block text-xs text-slate-500 lg:hidden">
                    {formatShort(s.updatedAt)}
                  </time>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-slate-600 lg:table-cell">
                  <time dateTime={s.updatedAt}>{formatShort(s.updatedAt)}</time>
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-0.5">
                    {canRetry(s) && (
                      <button
                        type="button"
                        onClick={() => onRetry(s)}
                        disabled={!configured || busyIds.has(s.id)}
                        className={iconAction}
                        aria-label={`Reîncearcă indexarea: ${s.title}`}
                        title="Reîncearcă"
                      >
                        <RotateCcw aria-hidden className={`size-4 ${busyIds.has(s.id) ? "motion-safe:animate-spin" : ""}`} />
                      </button>
                    )}
                    {deletable && (
                      <button
                        type="button"
                        onClick={() => onDelete(s)}
                        disabled={!configured || busyIds.has(s.id)}
                        className={`${iconAction} hover:!bg-red-50 hover:!text-red-700`}
                        aria-label={`Șterge: ${s.title}`}
                        title="Șterge"
                      >
                        <Trash aria-hidden className="size-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone: cards */}
      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {sources.map((s) => (
          <li key={s.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <SourceStatusBadge status={s.status} />
              <span className="text-xs text-slate-500">
                {deletable && fileType(s) ? `${fileType(s)} · ` : ""}
                {formatBytes(s.bytes)} · <time dateTime={s.updatedAt}>{formatShort(s.updatedAt)}</time>
              </span>
            </div>
            <p className="mt-2 break-words text-sm font-semibold leading-snug text-navy-950">{s.title}</p>
            {subtitle(s)}
            {problem(s)}
            {(canRetry(s) || deletable) && (
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                {canRetry(s) && (
                  <button
                    type="button"
                    onClick={() => onRetry(s)}
                    disabled={!configured || busyIds.has(s.id)}
                    className={buttonClass("secondary", "sm", "flex-1")}
                    aria-label={`Reîncearcă indexarea: ${s.title}`}
                  >
                    <RotateCcw aria-hidden className="size-4" /> Reîncearcă
                  </button>
                )}
                {deletable && (
                  <button
                    type="button"
                    onClick={() => onDelete(s)}
                    disabled={!configured || busyIds.has(s.id)}
                    className={buttonClass("danger-outline", "sm", canRetry(s) ? "" : "flex-1")}
                    aria-label={`Șterge: ${s.title}`}
                  >
                    <Trash aria-hidden className="size-4" /> Șterge
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
