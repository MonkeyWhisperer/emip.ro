import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { ExternalLink, RefreshCw } from "lucide-react";
import type { AiSettings, AiStatus } from "../../../shared/ai";
import { useAdmin } from "../../components/admin/AdminContext";
import { ConversationsPanel } from "../../components/admin/ai/ConversationsPanel";
import { KnowledgePanel } from "../../components/admin/ai/KnowledgePanel";
import { SettingsPanel } from "../../components/admin/ai/SettingsPanel";
import { StatusOverview } from "../../components/admin/ai/StatusOverview";
import { countByStatus, usedSources } from "../../components/admin/ai/shared";
import { useAiStatus } from "../../components/admin/ai/useAiStatus";
import { AdminPageHeader, Alert, Button, LoadingBlock, buttonClass, plural } from "../../components/admin/ui";
import { PageMeta } from "../../components/ui/PageMeta";

type Tab = "surse" | "setari" | "conversatii";

const TABS: { key: Tab; label: string; short?: string }[] = [
  { key: "surse", label: "Surse de cunoștințe", short: "Surse" },
  { key: "setari", label: "Setări" },
  { key: "conversatii", label: "Conversații" },
];

const parseTab = (value: string | null): Tab => (value === "setari" || value === "conversatii" ? value : "surse");

/** /admin/ai: the site's AI chat assistant (knowledge sources, settings, conversation log). */
export function AdminAiPage() {
  const { toast } = useAdmin();
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get("tab"));
  const uid = useId();
  const { status, error, stale, busy, refresh, patch, retry } = useAiStatus();
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [conversations, setConversations] = useState<number | null>(null);

  // Tell the admin when background work finishes: an uploaded file indexed (or not), a site sync done.
  const previous = useRef<AiStatus | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = status;
    if (!before || !status) return;
    const was = new Map(before.sources.map((s) => [s.id, s.status]));
    for (const s of status.sources) {
      const old = was.get(s.id);
      if (s.kind !== "upload" || (old !== "pending" && old !== "processing") || old === s.status) continue;
      if (s.status === "ready") toast(`„${s.title}” a fost indexat; asistentul îl poate folosi.`);
      else if (s.status === "failed") toast(`Indexarea „${s.title}” a eșuat. Eroarea apare în lista de fișiere.`, "error");
    }
    if (before.siteSyncRunning && !status.siteSyncRunning) {
      if (status.lastSiteSync?.error) toast("Sincronizarea conținutului site-ului a eșuat. Detaliile apar în tabul Surse.", "error");
      else toast("Conținutul site-ului a fost sincronizat.");
    }
  }, [status, toast]);

  // Start from the live URL, not the last render's params (same as the messages screen).
  const selectTab = (next: Tab) => {
    const n = new URLSearchParams(window.location.search);
    if (next === "surse") n.delete("tab");
    else n.set("tab", next);
    setParams(n, { replace: true });
  };

  // Moves from the tab that has focus (not the selected one: the URL update is a transition,
  // so with fast key repeats the rendered selection can lag one step behind).
  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, from: Tab) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.key === from);
    const nextIndex =
      e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    const next = TABS[nextIndex].key;
    selectTab(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  }

  const onSettingsSaved = (settings: AiSettings, before: AiSettings) => {
    // Switching site content back on starts a sync on the server (when the key is set). Mark it as
    // running, like the sync button does, so polling starts and the admin hears when it is done,
    // even when nothing changed and the sync is over before the next status request.
    const syncStarted = settings.useSiteContent && !before.useSiteContent && !!status?.configured;
    patch((s) => ({ ...s, settings, ...(syncStarted && { siteSyncRunning: true }) }));
    if (settings.useSiteContent !== before.useSiteContent) void refresh();
  };

  const openTab = (next: Tab) => {
    selectTab(next);
    requestAnimationFrame(() => document.getElementById(`${uid}-tab-${next}`)?.focus());
  };

  const failed = status ? countByStatus(usedSources(status)).failed : 0;
  const readyUploads = status?.sources.filter((s) => s.kind === "upload" && s.status === "ready").length ?? 0;
  const liveSummary = !status
    ? ""
    : busy
      ? "Indexare în curs."
      : failed > 0
        ? `${plural(failed, "sursă", "surse")} cu erori.`
        : usedSources(status).length === 0
          ? "Nicio sursă în baza de cunoștințe."
          : "Toate sursele sunt indexate.";

  // The chat button is only on the site while the assistant is configured and switched on.
  const assistantOff = !!status && (!status.configured || !status.settings.enabled);
  const testHint = assistantOff
    ? "Deschide site-ul într-o filă nouă. Asistentul este oprit acum, așa că butonul lui nu apare pe site."
    : "Deschide site-ul într-o filă nouă; butonul asistentului este în colțul din dreapta jos.";

  return (
    <>
      <PageMeta title="Asistent AI · Administrare" />
      <AdminPageHeader
        title="Asistent AI"
        description="Asistentul de chat de pe site: sursele din care răspunde, setările și conversațiile cu vizitatorii."
        actions={
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className={buttonClass("secondary")}
            title={testHint}
          >
            <ExternalLink aria-hidden className="size-4" />
            Testează asistentul
            <span className="sr-only"> ({testHint})</span>
          </a>
        }
      />

      {error && (
        <Alert tone="error" className="mb-6">
          <p>{error}</p>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={retry} className="mt-3">
            Încearcă din nou
          </Button>
        </Alert>
      )}

      {!status && !error && <LoadingBlock label="Se încarcă asistentul AI…" rows={4} />}

      {status && (
        <>
          <p className="sr-only" role="status">
            {liveSummary}
          </p>

          {!status.configured && (
            <Alert tone="warning" className="mb-6">
              <p className="font-semibold">Asistentul nu este configurat</p>
              <p className="mt-0.5">
                Pe server lipsește cheia <code className="font-mono text-xs">OPENAI_API_KEY</code>, așa că butonul de chat nu apare pe
                site, iar încărcarea și ștergerea fișierelor, sincronizarea și reîncercările sunt dezactivate. Adăugați cheia în configurația
                serverului (<code className="font-mono text-xs">.env</code>) și reporniți aplicația. Setările se pot salva și acum.
              </p>
            </Alert>
          )}

          <StatusOverview status={status} />

          <div role="tablist" aria-label="Secțiunile asistentului" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 sm:gap-2">
            {TABS.map(({ key, label, short }) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`${uid}-tab-${key}`}
                aria-selected={tab === key}
                aria-controls={`${uid}-panel-${key}`}
                tabIndex={tab === key ? 0 : -1}
                onClick={() => selectTab(key)}
                onKeyDown={(e) => onTabKey(e, key)}
                className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors sm:px-4 ${
                  tab === key ? "border-navy-900 text-navy-950" : "border-transparent text-slate-500 hover:text-navy-950"
                }`}
              >
                {short ? (
                  <>
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </>
                ) : (
                  label
                )}
                {key === "surse" && failed > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                    {failed}
                    <span className="sr-only"> cu erori</span>
                  </span>
                )}
                {key === "setari" && settingsDirty && (
                  <span className="inline-flex items-center" title="Modificări nesalvate">
                    <span aria-hidden className="size-2 rounded-full bg-amber-500" />
                    <span className="sr-only">(modificări nesalvate)</span>
                  </span>
                )}
                {key === "conversatii" && conversations !== null && conversations > 0 && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                    {conversations}
                    <span className="sr-only"> salvate</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* All panels stay mounted: unsaved settings survive switching tabs. */}
          <div
            id={`${uid}-panel-surse`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-surse`}
            tabIndex={-1}
            hidden={tab !== "surse"}
            className="outline-none"
          >
            <KnowledgePanel status={status} stale={stale} refresh={refresh} patch={patch} onOpenSettings={() => openTab("setari")} />
          </div>
          <div
            id={`${uid}-panel-setari`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-setari`}
            tabIndex={-1}
            hidden={tab !== "setari"}
            className="outline-none"
          >
            <SettingsPanel
              settings={status.settings}
              configured={status.configured}
              usageToday={status.usageToday}
              readyUploads={readyUploads}
              active={tab === "setari"}
              onSaved={onSettingsSaved}
              onDirtyChange={setSettingsDirty}
              onOpenSources={() => openTab("surse")}
            />
          </div>
          <div
            id={`${uid}-panel-conversatii`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-conversatii`}
            tabIndex={-1}
            hidden={tab !== "conversatii"}
            className="outline-none"
          >
            <ConversationsPanel
              logEnabled={status.settings.logConversations}
              active={tab === "conversatii"}
              onTotal={setConversations}
              onOpenSettings={() => openTab("setari")}
            />
          </div>
        </>
      )}
    </>
  );
}
