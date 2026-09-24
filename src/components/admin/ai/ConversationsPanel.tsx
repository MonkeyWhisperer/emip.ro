import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  MessagesSquare,
  RefreshCw,
  Settings,
  Trash,
} from "lucide-react";
import type { AiConversation, AiConversationPage, AiConversationTurn } from "../../../../shared/ai";
import { clearAiConversations, deleteAiConversation, listAiConversations } from "../../../lib/aiAdminApi";
import { useAdmin } from "../AdminContext";
import { ConfirmDialog } from "../Dialog";
import { Alert, Button, EmptyState, LoadingBlock, errorMessage, formatDateTime, isUnauthorized, plural } from "../ui";
import { SafeAnswer } from "./SafeAnswer";
import { aiErrorMessage, formatNumber, fullUrl, refocusButton, sameSitePath } from "./shared";

// Everything in a logged conversation except the timestamps comes from the visitor (question,
// page) or from a model the visitor can steer (answer): answers go through <SafeAnswer>, and only
// addresses on this site become links.

const PAGE_SIZE = 20;
const MAX_PAGES_SHOWN = 3;

const timeFormat = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" });
const dayKey = (iso: string) => new Date(iso).toDateString();
/** "14:05" when on the day the conversation started, otherwise the full date and time. */
const turnTime = (iso: string, startedAt: string) =>
  dayKey(iso) === dayKey(startedAt) ? timeFormat.format(new Date(iso)) : formatDateTime(iso);

const shorten = (text: string, max: number) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
};

/** Pages the visitor asked from, in order of first visit. */
const pagesOf = (c: AiConversation) => [...new Set(c.turns.map((t) => t.page).filter((p): p is string => !!p))];

type Props = {
  /** "Salvează conversațiile" is on. */
  logEnabled: boolean;
  /** The "Conversații" tab is visible: reloaded each time it is shown. */
  active: boolean;
  onTotal: (total: number) => void;
  onOpenSettings: () => void;
};

/** "Conversații" tab: visitors' conversations with the assistant, most recently active first. */
export function ConversationsPanel({ logEnabled, active, onTotal, onOpenSettings }: Props) {
  const { toast } = useAdmin();
  const uid = useId();
  const [data, setData] = useState<AiConversationPage | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [toDelete, setToDelete] = useState<AiConversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const request = useRef(0);
  const focusAfterLoad = useRef(false);

  const load = useCallback(
    async (target: number) => {
      const id = ++request.current;
      setLoading(true);
      setError(null);
      try {
        let result = await listAiConversations(PAGE_SIZE, target * PAGE_SIZE);
        let shown = target;
        // The page emptied (deletions): show the last one that still has conversations.
        if (result.conversations.length === 0 && target > 0 && result.total > 0) {
          shown = Math.ceil(result.total / PAGE_SIZE) - 1;
          result = await listAiConversations(PAGE_SIZE, shown * PAGE_SIZE);
        }
        if (id !== request.current) return;
        setData(result);
        setPage(shown);
        onTotal(result.total);
      } catch (err) {
        if (id !== request.current || isUnauthorized(err)) return;
        setError(errorMessage(err, "Nu am putut încărca conversațiile."));
      } finally {
        if (id === request.current) setLoading(false);
      }
    },
    [onTotal],
  );

  // Loaded once for the tab's count, then again each time the tab is shown (new questions arrive all the time).
  const pageRef = useRef(page);
  const loadedOnce = useRef(false);
  useLayoutEffect(() => {
    pageRef.current = page;
  });
  useEffect(() => {
    if (!active && loadedOnce.current) return;
    loadedOnce.current = true;
    void load(pageRef.current);
  }, [active, load]);

  // After switching pages, move focus to the summary line so keyboard and screen-reader users start at the top.
  useEffect(() => {
    if (!loading && focusAfterLoad.current) {
      focusAfterLoad.current = false;
      summaryRef.current?.focus();
      summaryRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [loading]);

  function goTo(target: number) {
    focusAfterLoad.current = true;
    void load(target);
  }

  const refreshId = `${uid}-refresh`;
  async function refreshList() {
    const hadFocus = document.activeElement?.id === refreshId;
    await load(page);
    if (hadFocus) refocusButton(refreshId);
  }

  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // The dialog gives focus back to the button that opened it; after a deletion that button is gone
  // (or, for "Șterge tot", the whole list is), so continue from the summary line or the empty state.
  const focusListStart = () =>
    requestAnimationFrame(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      (summaryRef.current ?? emptyRef.current)?.focus();
    });

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    let deleted = false;
    try {
      await deleteAiConversation(toDelete.id);
      deleted = true;
      toast("Conversația a fost ștearsă.");
      await load(page);
    } catch (err) {
      if (!isUnauthorized(err)) toast(aiErrorMessage(err, "Conversația nu a putut fi ștearsă."), "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
    if (deleted) focusListStart();
  }

  async function clearAll() {
    setClearing(true);
    let cleared = false;
    try {
      await clearAiConversations();
      cleared = true;
      const count = data?.total ?? 0;
      request.current++; // a load in flight would bring the old conversations back
      setData({ total: 0, conversations: [] });
      setPage(0);
      setLoading(false);
      onTotal(0);
      toast(count === 1 ? "Conversația a fost ștearsă." : `${plural(count, "conversație", "conversații")} au fost șterse.`);
    } catch (err) {
      if (!isUnauthorized(err)) toast(aiErrorMessage(err, "Conversațiile nu au putut fi șterse."), "error");
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
    if (cleared) focusListStart();
  }

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);
  const shown = data?.conversations ?? [];
  const allOpen = shown.length > 0 && shown.every((c) => open.has(c.id));

  return (
    <div>
      {error && (
        <Alert tone="error" className="mb-6">
          <p>{error}</p>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void load(page)} className="mt-3">
            Încearcă din nou
          </Button>
        </Alert>
      )}

      {!data && !error && <LoadingBlock label="Se încarcă conversațiile…" rows={3} />}

      {data && total === 0 && (
        <div ref={emptyRef} tabIndex={-1} className="outline-none">
          <EmptyState
            icon={MessagesSquare}
            title="Nicio conversație salvată"
            text={
              logEnabled
                ? "Conversațiile vizitatorilor cu asistentul apar aici, cele mai recente primele, și se păstrează 90 de zile, cât timp salvarea conversațiilor este pornită în Setări."
                : "Salvarea conversațiilor este oprită din Setări, așa că întrebările vizitatorilor nu sunt păstrate. Porniți-o dacă vreți să vedeți aici ce întreabă vizitatorii."
            }
          >
            {!logEnabled && (
              <Button variant="secondary" icon={Settings} onClick={onOpenSettings}>
                Deschide setările
              </Button>
            )}
          </EmptyState>
        </div>
      )}

      {data && total > 0 && (
        <>
          {!logEnabled && (
            <Alert tone="info" className="mb-4">
              Salvarea conversațiilor este oprită: conversațiile noi nu mai apar aici. Mai jos sunt cele salvate anterior.
            </Alert>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p ref={summaryRef} tabIndex={-1} className="text-sm text-slate-600 outline-none" role="status">
              {total > PAGE_SIZE
                ? `Conversațiile ${formatNumber(from)}–${formatNumber(to)} din ${formatNumber(total)}, cele mai recente primele`
                : `${plural(total, "conversație", "conversații")}, cele mai recente primele`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={allOpen ? ChevronsDownUp : ChevronsUpDown}
                onClick={() => setOpen(allOpen ? new Set() : new Set(shown.map((c) => c.id)))}
              >
                {allOpen ? "Restrânge tot" : "Deschide tot"}
              </Button>
              <Button id={refreshId} variant="ghost" size="sm" icon={RefreshCw} busy={loading} onClick={() => void refreshList()}>
                Actualizează
              </Button>
              <Button variant="danger-outline" size="sm" icon={Trash} onClick={() => setConfirmClear(true)}>
                Șterge tot
              </Button>
            </div>
          </div>

          <ul className={`space-y-3 transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading || undefined}>
            {shown.map((c) => (
              <li key={c.id}>
                <ConversationCard
                  conversation={c}
                  idPrefix={`${uid}-${c.id}`}
                  open={open.has(c.id)}
                  onToggle={() => toggle(c.id)}
                  onDelete={() => setToDelete(c)}
                />
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <nav aria-label="Paginile conversațiilor" className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page === 0 || loading} onClick={() => goTo(page - 1)}>
                Mai recente
              </Button>
              <p className="text-sm text-slate-600">
                Pagina {page + 1} din {pages}
              </p>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages - 1 || loading}
                onClick={() => goTo(page + 1)}
                className="flex-row-reverse"
                icon={ChevronRight}
              >
                Mai vechi
              </Button>
            </nav>
          )}
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Ștergeți conversația?"
        description={
          toDelete && (
            <p>
              Conversația care începe cu <strong className="break-words text-navy-950">„{shorten(toDelete.turns[0]?.question ?? "", 120)}”</strong>{" "}
              ({plural(toDelete.turnCount, "întrebare", "întrebări")}, {formatDateTime(toDelete.startedAt)}) va fi ștearsă
              definitiv{toDelete.turnCount > 1 ? ", cu toate întrebările și răspunsurile ei" : ""}. Acțiunea nu poate fi anulată.
            </p>
          )
        }
        confirmLabel="Șterge conversația"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Ștergeți toate conversațiile?"
        description={
          <p>
            {total === 1 ? (
              <>
                <strong className="text-navy-950">Singura conversație salvată</strong> va fi ștearsă definitiv.
              </>
            ) : (
              <>
                Toate cele <strong className="text-navy-950">{plural(total, "conversație", "conversații")}</strong> salvate vor fi
                șterse definitiv, cu toate întrebările și răspunsurile lor.
              </>
            )}{" "}
            Acțiunea nu poate fi anulată.
          </p>
        }
        confirmLabel={total === 1 ? "Șterge conversația" : `Șterge ${plural(total, "conversație", "conversații")}`}
        busy={clearing}
        onConfirm={() => void clearAll()}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

// ---- one conversation ---------------------------------------------------------------------------

function ConversationCard({
  conversation: c,
  idPrefix,
  open,
  onToggle,
  onDelete,
}: {
  conversation: AiConversation;
  idPrefix: string;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const first = c.turns[0]?.question ?? "";
  const visited = pagesOf(c);
  const titleId = `${idPrefix}-title`;
  const threadId = `${idPrefix}-thread`;

  return (
    <article aria-labelledby={titleId} className={`rounded-2xl border bg-white transition-colors ${open ? "border-slate-300 shadow-sm" : "border-slate-200"}`}>
      <div className="flex items-start gap-2 p-4 sm:gap-3 sm:p-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-snug sm:text-base">
            <button
              type="button"
              id={titleId}
              aria-expanded={open}
              aria-controls={threadId}
              onClick={onToggle}
              className="group flex w-full items-start gap-2 rounded-lg text-left text-navy-950 hover:text-navy-700"
            >
              <ChevronDown
                aria-hidden
                className={`mt-0.5 size-4 shrink-0 text-slate-400 transition-transform group-hover:text-navy-700 sm:size-5 ${open ? "rotate-180" : ""}`}
              />
              <span className="line-clamp-2 break-words" title={first.length > 140 ? first : undefined}>
                {shorten(first, 180) || "(fără întrebare)"}
              </span>
            </button>
          </h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-xs text-slate-500 sm:pl-7">
            <time dateTime={c.startedAt} className="font-medium text-slate-700">
              {formatDateTime(c.startedAt)}
            </time>
            <span>{plural(c.turnCount, "întrebare", "întrebări")}</span>
            {visited.length > 0 && (
              <span className="inline-flex min-w-0 flex-wrap items-center gap-1">
                <span>{visited.length === 1 ? "pagina" : "paginile"}</span>
                {visited.slice(0, MAX_PAGES_SHOWN).map((p) => (
                  <span key={p} className="max-w-[12rem] truncate rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                    {p}
                  </span>
                ))}
                {visited.length > MAX_PAGES_SHOWN && (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600" title={visited.slice(MAX_PAGES_SHOWN).join(", ")}>
                    +{visited.length - MAX_PAGES_SHOWN}
                    <span className="sr-only">: {visited.slice(MAX_PAGES_SHOWN).join(", ")}</span>
                  </span>
                )}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
          aria-label={`Șterge conversația: ${shorten(first, 80)}`}
          title="Șterge conversația"
        >
          <Trash aria-hidden className="size-4" />
        </button>
      </div>

      <div id={threadId} hidden={!open} className="border-t border-slate-100 bg-slate-50 px-3 py-4 sm:px-5 sm:py-5 rounded-b-2xl">
        {open && (
          <ol className="space-y-5" aria-label="Conversația, în ordine">
            {c.turns.map((turn, i) => (
              <Turn key={turn.id} turn={turn} previousPage={i > 0 ? c.turns[i - 1].page : undefined} startedAt={c.startedAt} />
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}

/** The page a question was asked from: a link only when it is an address on this site. */
function PageRef({ page }: { page: string }) {
  const path = sameSitePath(page);
  if (!path) {
    return (
      <span className="max-w-[14rem] truncate font-mono text-slate-600" title={`Adresă din afara site-ului: ${fullUrl(page)}`}>
        {page}
      </span>
    );
  }
  return (
    <a href={path} target="_blank" rel="noopener" className="inline-flex max-w-[14rem] items-center gap-1 font-mono text-navy-700 hover:underline">
      <span className="truncate">{page}</span>
      <ExternalLink aria-hidden className="size-3 shrink-0" />
      <span className="sr-only">(pagina de pe care a întrebat; se deschide într-o filă nouă)</span>
    </a>
  );
}

function Turn({ turn, previousPage, startedAt }: { turn: AiConversationTurn; previousPage: string | null | undefined; startedAt: string }) {
  const showPage = !!turn.page && turn.page !== previousPage;
  return (
    <li className="space-y-2">
      {/* Visitor */}
      <div className="flex flex-col items-end">
        <p className="mb-1 flex flex-wrap items-center justify-end gap-x-2 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-600">Vizitator</span>
          <time dateTime={turn.createdAt}>{turnTime(turn.createdAt, startedAt)}</time>
          {showPage && turn.page && <PageRef page={turn.page} />}
        </p>
        <div className="max-w-[90%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-navy-900 px-4 py-2.5 text-sm leading-relaxed text-white sm:max-w-[80%]">
          {turn.question}
        </div>
      </div>

      {/* Assistant */}
      <div className="flex flex-col items-start">
        <p className="mb-1 text-[11px] font-semibold text-slate-600">
          Asistent<span className="sr-only"> (linkurile din răspuns se deschid într-o filă nouă)</span>
        </p>
        <div className="min-w-0 max-w-[95%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 sm:max-w-[85%]">
          <SafeAnswer source={turn.answer} />
        </div>
        {turn.sources.length > 0 && (
          <div className="mt-2 flex max-w-full flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-slate-500">
              <BookOpen aria-hidden className="size-3.5" /> Surse:
            </span>
            <ul className="flex min-w-0 flex-wrap gap-1.5">
              {turn.sources.map((s, i) => {
                const path = sameSitePath(s.url);
                return (
                  <li key={`${s.url ?? s.title}-${i}`} className="min-w-0">
                    {path ? (
                      <a
                        href={path}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex max-w-full rounded-full bg-white px-2.5 py-1 text-navy-700 ring-1 ring-slate-200 hover:ring-brand-500"
                      >
                        <span className="truncate">{s.title}</span>
                        <span className="sr-only"> (se deschide într-o filă nouă)</span>
                      </a>
                    ) : (
                      <span
                        className="inline-flex max-w-full rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200"
                        title={s.url ? fullUrl(s.url) : "Fișier încărcat"}
                      >
                        <span className="truncate">{s.title}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}
