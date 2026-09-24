import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, CircleOff, FolderOpen, LoaderCircle, RefreshCw } from "lucide-react";
import type { AiSettings, AiSource, AiStatus } from "../../../../shared/ai";
import { deleteAiSource, retryAiSource, saveAiSettings, setAiSourcesExcluded, syncSiteKnowledge } from "../../../lib/aiAdminApi";
import { useAdmin } from "../AdminContext";
import { ConfirmDialog } from "../Dialog";
import { Alert, Button, Card, Toggle, formatDateTime, isUnauthorized, plural } from "../ui";
import { SourceList } from "./SourceList";
import { TrainingUpload } from "./TrainingUpload";
import { aiErrorMessage, countByStatus, refocusButton } from "./shared";

type Props = {
  status: AiStatus;
  /** The last background refresh failed. */
  stale: boolean;
  refresh: () => Promise<AiStatus | null>;
  patch: (fn: (status: AiStatus) => AiStatus) => void;
  /** After the "answer from the site's content" switch here was saved (same as a save in Setări). */
  onSettingsSaved: (settings: AiSettings, before: AiSettings) => void;
};

const upsert = (sources: AiSource[], source: AiSource) =>
  sources.some((s) => s.id === source.id) ? sources.map((s) => (s.id === source.id ? source : s)) : [...sources, source];

/** Failed sources first, otherwise the server's order (by title). */
const failedFirst = (list: AiSource[]) =>
  list.map((s, i) => ({ s, i })).sort((a, b) => Number(b.s.status === "failed") - Number(a.s.status === "failed") || a.i - b.i).map(({ s }) => s);

/** "Surse de cunoștințe" tab: uploaded training files and the site's own pages and posts. */
export function KnowledgePanel({ status, stale, refresh, patch, onSettingsSaved }: Props) {
  const { toast } = useAdmin();
  const uid = useId();
  const [busyIds, setBusyIds] = useState<ReadonlySet<number>>(new Set());
  /** The site-content switch while its new value is being saved. */
  const [siteDraft, setSiteDraft] = useState<boolean | null>(null);
  const [toDelete, setToDelete] = useState<AiSource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [syncRequested, setSyncRequested] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /** The "N fișiere încărcate" line (or the empty message): where focus goes after deleting a file. */
  const uploadsRef = useRef<HTMLParagraphElement>(null);
  const refreshId = `${uid}-refresh`;
  const syncId = `${uid}-sync`;
  const syncHadFocus = useRef(false);

  const { configured, sources, siteSyncRunning, lastSiteSync } = status;
  const useSite = status.settings.useSiteContent;
  const uploads = useMemo(() => sources.filter((s) => s.kind === "upload").sort((a, b) => b.id - a.id), [sources]);
  const readyUploads = uploads.filter((s) => s.status === "ready").length;
  const indexingUploads = uploads.filter((s) => s.status === "pending" || s.status === "processing").length;
  const pages = useMemo(() => failedFirst(sources.filter((s) => s.kind === "page")), [sources]);
  const posts = useMemo(() => failedFirst(sources.filter((s) => s.kind === "post")), [sources]);
  const siteExcluded = [...pages, ...posts].filter((s) => s.excluded).length;
  const siteCounts = countByStatus([...pages, ...posts].filter((s) => !s.excluded));
  const siteIndexing = siteCounts.pending + siteCounts.processing;
  const syncing = siteSyncRunning || syncRequested;

  // The sync button stays busy (disabled) for the whole sync; give focus back when it is done.
  useEffect(() => {
    if (syncing || !syncHadFocus.current) return;
    syncHadFocus.current = false;
    refocusButton(syncId);
  }, [syncing, syncId]);

  const setBusy = (id: number | number[], on: boolean) =>
    setBusyIds((s) => {
      const next = new Set(s);
      for (const i of Array.isArray(id) ? id : [id]) {
        if (on) next.add(i);
        else next.delete(i);
      }
      return next;
    });

  /** Unchecked sources are kept out of the search; checked ones are indexed again. */
  async function setExcluded(list: AiSource[], excluded: boolean) {
    if (!list.length) return;
    const ids = list.map((s) => s.id);
    setBusy(ids, true);
    try {
      const updated = await setAiSourcesExcluded(ids, excluded);
      // Included pages and posts come back with a site sync (started by the server when site content is on).
      const syncStarted = !excluded && useSite && configured && list.some((s) => s.kind !== "upload");
      patch((s) => ({ ...s, sources: updated.reduce(upsert, s.sources), ...(syncStarted && { siteSyncRunning: true }) }));
      const what = list.length === 1 ? `„${list[0].title}”` : plural(list.length, "sursă", "surse");
      const waitsForSite = !excluded && !useSite && list.every((s) => s.kind !== "upload");
      toast(
        excluded
          ? `Asistentul nu mai folosește ${what}.`
          : waitsForSite
            ? `${list.length === 1 ? "Sursa va fi folosită" : "Sursele vor fi folosite"} când reactivați conținutul site-ului.`
            : `Asistentul folosește din nou ${what}; se indexează.`,
      );
      void refresh();
    } catch (err) {
      if (!isUnauthorized(err)) toast(aiErrorMessage(err, "Modificarea nu a putut fi salvată."), "error");
    } finally {
      setBusy(ids, false);
    }
  }

  async function setUseSite(on: boolean) {
    if (siteDraft !== null) return;
    const before = status.settings;
    setSiteDraft(on);
    try {
      const saved = await saveAiSettings({ ...before, useSiteContent: on });
      onSettingsSaved(saved, before);
      toast(
        on
          ? configured
            ? "Asistentul răspunde din nou din conținutul site-ului. Paginile și articolele se sincronizează acum."
            : "Asistentul va răspunde din conținutul site-ului."
          : "Asistentul nu mai răspunde din conținutul site-ului, doar din fișierele încărcate.",
      );
    } catch (err) {
      if (!isUnauthorized(err)) toast(aiErrorMessage(err, "Setarea nu a putut fi salvată."), "error");
    } finally {
      setSiteDraft(null);
    }
  }

  function onUploaded(source: AiSource) {
    patch((s) => ({ ...s, sources: upsert(s.sources, source) }));
    // The server answers 201 even when handing the file to OpenAI failed: the source is then "failed".
    if (source.status === "failed") {
      toast(`„${source.title}” a fost salvat, dar nu a putut fi trimis spre indexare. Reîncercați din lista de fișiere.`, "error");
    } else {
      toast(`„${source.title}” a fost încărcat și se indexează.`);
    }
  }

  async function retry(source: AiSource) {
    setBusy(source.id, true);
    try {
      const result = await retryAiSource(source.id);
      if (source.kind === "upload") {
        patch((s) => ({ ...s, sources: upsert(s.sources, result) }));
        if (result.status === "failed") {
          toast(`Indexarea „${source.title}” a eșuat din nou. Eroarea apare în lista de fișiere.`, "error");
        } else {
          toast(`Indexarea „${source.title}” a fost repornită.`, "info");
        }
      } else {
        // Pages and posts are retried by a site sync.
        patch((s) => ({ ...s, siteSyncRunning: true }));
        toast("Sincronizarea conținutului site-ului a pornit; sursele cu erori sunt reîncercate.", "info");
      }
      void refresh();
    } catch (err) {
      if (!isUnauthorized(err)) toast(aiErrorMessage(err, "Reîncercarea a eșuat."), "error");
    } finally {
      setBusy(source.id, false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const source = toDelete;
    setDeleting(true);
    let deleted = false;
    try {
      await deleteAiSource(source.id);
      deleted = true;
      patch((s) => ({ ...s, sources: s.sources.filter((x) => x.id !== source.id) }));
      toast(`Fișierul „${source.title}” a fost șters din baza de cunoștințe.`);
    } catch (err) {
      if (!isUnauthorized(err)) toast(aiErrorMessage(err, "Fișierul nu a putut fi șters."), "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
    // The dialog gives focus back to the delete button, which went away with the row:
    // continue from the list summary instead of the top of the page.
    if (deleted) requestAnimationFrame(() => uploadsRef.current?.focus());
  }

  async function sync() {
    syncHadFocus.current = document.activeElement?.id === syncId;
    setSyncRequested(true);
    try {
      await syncSiteKnowledge();
      patch((s) => ({ ...s, siteSyncRunning: true }));
      await refresh();
    } catch (err) {
      if (!isUnauthorized(err)) toast(aiErrorMessage(err, "Sincronizarea nu a putut porni."), "error");
    } finally {
      setSyncRequested(false);
    }
  }

  async function manualRefresh() {
    const hadFocus = document.activeElement?.id === refreshId;
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    if (hadFocus) refocusButton(refreshId);
  }

  const listProps = {
    configured,
    syncRunning: siteSyncRunning,
    busyIds,
    onRetry: (s: AiSource) => void retry(s),
    onDelete: setToDelete,
    onSetExcluded: (list: AiSource[], excluded: boolean) => void setExcluded(list, excluded),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {useSite ? (
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            Asistentul răspunde <strong className="font-semibold text-navy-950">doar</strong> pe baza surselor bifate de mai jos:
            paginile site-ului, articolele publicate pe blog și fișierele încărcate aici. Debifați o sursă ca asistentul să nu o mai
            folosească. Paginile și articolele se sincronizează automat după fiecare modificare pe blog și după fiecare publicare
            (deploy) a site-ului.
          </p>
        ) : (
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            Asistentul răspunde <strong className="font-semibold text-navy-950">doar din fișierele încărcate</strong> și bifate mai
            jos. Conținutul site-ului (pagini și articole) este dezactivat și nu este folosit în răspunsuri.
          </p>
        )}
        <Button id={refreshId} variant="ghost" size="sm" icon={RefreshCw} busy={refreshing} onClick={() => void manualRefresh()} className="self-start">
          Actualizează
        </Button>
      </div>

      {!useSite && readyUploads === 0 && (
        <Alert tone="warning">
          <p className="font-semibold">Asistentul nu are din ce să răspundă</p>
          <p className="mt-0.5">
            {indexingUploads > 0
              ? "Conținutul site-ului este dezactivat, iar fișierele încărcate se indexează încă. Până când cel puțin unul este gata, asistentul nu poate răspunde din surse."
              : "Conținutul site-ului este dezactivat și niciun fișier încărcat nu este gata. Încărcați cel puțin un fișier sau reactivați conținutul site-ului mai jos."}
          </p>
        </Alert>
      )}

      {stale && (
        <Alert tone="warning">
          Starea surselor nu a putut fi actualizată; informațiile de mai jos pot fi vechi. Verificați conexiunea și apăsați
          „Actualizează”.
        </Alert>
      )}

      {/* Uploaded training files */}
      <Card title="Fișiere încărcate" titleId={`${uid}-uploads`}>
        <p className="-mt-3 mb-4 text-sm text-slate-600">
          Documente cu informații care nu sunt pe site: prezentări, fișe de produs, întrebări frecvente, ghiduri.
        </p>
        <TrainingUpload enabled={configured} onUploaded={onUploaded} />
        <div className="mt-6">
          {uploads.length === 0 ? (
            <p ref={uploadsRef} tabIndex={-1} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 outline-none">
              <FolderOpen aria-hidden className="size-5 shrink-0 text-slate-400" />
              Niciun fișier încărcat încă.
            </p>
          ) : (
            <>
              <p ref={uploadsRef} tabIndex={-1} className="mb-3 text-sm font-medium text-slate-700 outline-none">
                {plural(uploads.length, "fișier încărcat", "fișiere încărcate")}
              </p>
              <SourceList sources={uploads} caption="Fișiere încărcate" deletable {...listProps} />
            </>
          )}
        </div>
      </Card>

      {/* Site pages and blog posts */}
      <Card
        title="Conținutul site-ului"
        titleId={`${uid}-site`}
        actions={
          !useSite && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 ring-inset">
              <CircleOff aria-hidden className="size-3.5" />
              Nu este folosit
            </span>
          )
        }
      >
        {/* The same setting as "Surse pentru răspunsuri" in Setări, saved as soon as it is switched. */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <Toggle
            id={`${uid}-use-site`}
            checked={siteDraft ?? useSite}
            onChange={(on) => void setUseSite(on)}
            label="Răspunde din conținutul site-ului (pagini și articole)"
            hint={
              useSite
                ? "Dezactivat, asistentul răspunde doar din fișierele încărcate. Paginile sau articolele debifate mai jos nu sunt folosite nici acum."
                : "Dezactivat acum: asistentul nu caută în paginile și articolele site-ului, iar sincronizarea automată este oprită. La reactivare, conținutul se sincronizează imediat."
            }
          />
        </div>
        <div className={useSite ? "" : "opacity-70"}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 text-sm text-slate-600" role="status">
              {syncing ? (
                <p className="flex items-center gap-2 font-medium text-navy-800">
                  <LoaderCircle aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
                  Sincronizare în curs… Se trimit paginile și articolele modificate.
                </p>
              ) : lastSiteSync ? (
                <p>
                  Ultima sincronizare:{" "}
                  <time dateTime={lastSiteSync.at} className="font-medium text-navy-950">
                    {formatDateTime(lastSiteSync.at)}
                  </time>{" "}
                  · {plural(lastSiteSync.pages, "pagină", "pagini")} · {plural(lastSiteSync.posts, "articol", "articole")}
                </p>
              ) : (
                <p>Conținutul site-ului nu a fost sincronizat încă.</p>
              )}
            </div>
            {useSite && (
              <Button
                id={syncId}
                variant="primary"
                icon={RefreshCw}
                busy={syncing}
                disabled={!configured}
                onClick={() => void sync()}
                className="md:self-start"
              >
                {syncing ? "Se sincronizează…" : "Sincronizează conținutul site-ului"}
              </Button>
            )}
          </div>

          {!syncing && lastSiteSync?.error && (
            <Alert tone="error" live={false} className="mt-4">
              <p className="font-semibold">Ultima sincronizare a eșuat</p>
              <p className="mt-0.5 break-words">{lastSiteSync.error}</p>
            </Alert>
          )}

          {pages.length + posts.length > 0 ? (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  aria-expanded={siteOpen}
                  aria-controls={`${uid}-site-list`}
                  onClick={() => setSiteOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-navy-900 hover:text-navy-700"
                >
                  <ChevronDown aria-hidden className={`size-4 transition-transform ${siteOpen ? "rotate-180" : ""}`} />
                  {siteOpen ? "Ascunde" : "Afișează"} {plural(pages.length, "pagină", "pagini")} și {plural(posts.length, "articol", "articole")}
                </button>
                <ul className="flex flex-wrap gap-1.5 text-xs font-semibold" aria-label="Stare conținut site">
                  <li className="rounded-full bg-brand-50 px-2.5 py-0.5 text-brand-800 ring-1 ring-brand-200 ring-inset">
                    {siteCounts.ready} gata
                  </li>
                  {siteIndexing > 0 && (
                    <li className="rounded-full bg-navy-50 px-2.5 py-0.5 text-navy-800 ring-1 ring-navy-100 ring-inset">
                      {siteIndexing} în lucru
                    </li>
                  )}
                  {siteCounts.failed > 0 && (
                    <li className="rounded-full bg-red-50 px-2.5 py-0.5 text-red-800 ring-1 ring-red-200 ring-inset">
                      {siteCounts.failed} cu erori
                    </li>
                  )}
                  {siteExcluded > 0 && (
                    <li className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600 ring-1 ring-slate-200 ring-inset">
                      {siteExcluded} {siteExcluded === 1 ? "exclusă" : "excluse"}
                    </li>
                  )}
                </ul>
              </div>
              {useSite && siteCounts.failed > 0 && !siteOpen && (
                <p className="mt-2 text-xs text-slate-500">Sincronizarea reîncearcă automat paginile și articolele cu erori.</p>
              )}
              <div id={`${uid}-site-list`} hidden={!siteOpen} className="mt-5 space-y-6">
                {pages.length > 0 && (
                  <section aria-labelledby={`${uid}-pages`}>
                    <h3 id={`${uid}-pages`} className="mb-3 text-sm font-semibold">
                      Pagini <span className="font-normal text-slate-500">({pages.length})</span>
                    </h3>
                    <SourceList sources={pages} caption="Paginile site-ului" deletable={false} retryable={useSite} {...listProps} />
                  </section>
                )}
                {posts.length > 0 && (
                  <section aria-labelledby={`${uid}-posts`}>
                    <h3 id={`${uid}-posts`} className="mb-3 text-sm font-semibold">
                      Articole de blog <span className="font-normal text-slate-500">({posts.length})</span>
                    </h3>
                    <SourceList sources={posts} caption="Articolele de blog" deletable={false} retryable={useSite} {...listProps} />
                  </section>
                )}
              </div>
            </div>
          ) : (
            !syncing && (
              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                {useSite
                  ? "Nicio pagină sau articol în baza de cunoștințe. Apăsați „Sincronizează conținutul site-ului” ca asistentul să poată răspunde despre ce scrie pe site."
                  : "Nicio pagină sau articol în baza de cunoștințe."}
              </p>
            )
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        title="Ștergeți fișierul?"
        description={
          toDelete && (
            <p>
              Fișierul <strong className="break-words text-navy-950">„{toDelete.title}”</strong> va fi șters din baza de cunoștințe
              și de pe server. Asistentul nu îl va mai folosi în răspunsuri. Acțiunea nu poate fi anulată.
            </p>
          )
        }
        confirmLabel="Șterge fișierul"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
