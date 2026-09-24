import type { ReactNode } from "react";
import type { AiStatus } from "../../../../shared/ai";
import { plural } from "../ui";
import { countByStatus, formatNumber, isIndexing, usedSources } from "./shared";

const dots = {
  green: "bg-brand-600",
  amber: "bg-amber-500",
  red: "bg-red-600",
};

function Tile({ label, value, hint }: { label: string; value: ReactNode; hint: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-navy-900/[0.03]">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1.5 break-words text-lg font-bold leading-snug text-navy-950">{value}</dd>
      <dd className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</dd>
    </div>
  );
}

/** Summary above the tabs: is the assistant answering, which model, today's usage, knowledge base health. */
export function StatusOverview({ status }: { status: AiStatus }) {
  const { configured, model, settings, usageToday, siteSyncRunning } = status;
  // Only what the assistant searches: without site content, only the uploaded files.
  const sources = usedSources(status);
  const counts = countByStatus(sources);
  const limitReached = usageToday >= settings.dailyLimit;
  const state = !configured
    ? { tone: "red" as const, label: "Neconfigurat", hint: "Lipsește cheia OpenAI pe server." }
    : !settings.enabled
      ? { tone: "amber" as const, label: "Oprit", hint: "Butonul de chat nu apare pe site (Setări)." }
      : settings.dailyLimit === 0
        ? { tone: "amber" as const, label: "Fără răspunsuri", hint: "Limita zilnică este 0, deci nu răspunde; o schimbați din Setări." }
        : limitReached
          ? { tone: "amber" as const, label: "Limită atinsă", hint: "Nu mai răspunde azi; vedeți limita zilnică în Setări." }
          : counts.ready === 0
            ? { tone: "amber" as const, label: "Fără surse", hint: "Nicio sursă folosită nu este indexată; vedeți Surse." }
            : { tone: "green" as const, label: "Activ", hint: "Butonul de chat apare pe toate paginile site-ului." };

  const indexing = sources.filter((s) => isIndexing(s, siteSyncRunning)).length;
  const usedShare = settings.dailyLimit > 0 ? Math.min(1, usageToday / settings.dailyLimit) : 1;

  return (
    <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        label="Stare"
        value={
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${dots[state.tone]}`} />
            {state.label}
          </span>
        }
        hint={state.hint}
      />
      <Tile label="Model" value={<span className="font-mono text-base">{model}</span>} hint="OpenAI, cu căutare în sursele de mai jos." />
      <Tile
        label="Răspunsuri azi"
        value={
          <>
            {formatNumber(usageToday)} <span className="text-sm font-medium text-slate-500">/ {formatNumber(settings.dailyLimit)}</span>
          </>
        }
        hint={
          <>
            <span aria-hidden className="mb-1.5 mt-0.5 block h-1.5 overflow-hidden rounded-full bg-slate-200">
              <span
                className={`block h-full rounded-full ${usedShare >= 1 ? "bg-red-500" : usedShare >= 0.8 ? "bg-amber-500" : "bg-brand-600"}`}
                style={{ width: `${Math.max(usageToday > 0 ? 2 : 0, usedShare * 100)}%` }}
              />
            </span>
            Limita zilnică se schimbă din Setări.
          </>
        }
      />
      <Tile
        label={settings.useSiteContent ? "Surse" : "Surse (doar fișiere)"}
        value={
          sources.length === 0 ? (
            "Niciuna"
          ) : (
            <>
              {formatNumber(counts.ready)} <span className="text-sm font-medium text-slate-500">din {formatNumber(sources.length)} gata</span>
            </>
          )
        }
        hint={
          counts.failed > 0 ? (
            <span className="font-semibold text-red-700">
              {counts.failed === 1 ? "1 sursă are erori." : `${plural(counts.failed, "sursă", "surse")} au erori.`}
            </span>
          ) : indexing > 0 || siteSyncRunning ? (
            siteSyncRunning ? "Sincronizare în curs…" : `${plural(indexing, "sursă", "surse")} se indexează…`
          ) : !settings.useSiteContent ? (
            "Doar fișierele încărcate (conținutul site-ului este dezactivat)."
          ) : sources.length === 0 ? (
            "Sincronizați conținutul site-ului."
          ) : (
            "Toate sursele sunt indexate."
          )
        }
      />
    </dl>
  );
}
