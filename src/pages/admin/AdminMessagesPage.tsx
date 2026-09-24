import { useCallback, useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import {
  Building,
  CheckCheck,
  Copy,
  Download,
  Inbox,
  Mail,
  MailOpen,
  Phone,
  RefreshCw,
  Reply,
  Trash,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import type { Submission } from "../../../shared/forms";
import { deleteSubmission, listSubmissions, markSubmissionRead } from "../../lib/adminApi";
import { useAdmin } from "../../components/admin/AdminContext";
import { ConfirmDialog } from "../../components/admin/Dialog";
import {
  AdminPageHeader,
  Alert,
  Button,
  EmptyState,
  LoadingBlock,
  buttonClass,
  errorMessage,
  formatDateTime,
  isUnauthorized,
  mailtoHref,
  plural,
} from "../../components/admin/ui";
import { PageMeta } from "../../components/ui/PageMeta";

type Tab = "contact" | "newsletter";
type Data = { contact: Submission[]; newsletter: Submission[] };

// ---- CSV export --------------------------------------------------------------------------

/** Quotes a CSV cell and defuses spreadsheet formulas (=, +, -, @ at the start). */
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

const pad = (n: number) => String(n).padStart(2, "0");
const localStamp = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function downloadCsv(rows: Submission[]) {
  const lines = [["Email", "Data abonării"], ...rows.map((r) => [r.email, localStamp(r.createdAt)])];
  const csv = `﻿${lines.map((cells) => cells.map(csvCell).join(",")).join("\r\n")}\r\n`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `abonati-newsletter-emip-${localStamp(new Date().toISOString()).slice(0, 10)}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The visitor's email as a mailto: link, or as plain text flagged as invalid (see mailtoHref). */
function EmailAddress({ email, className = "" }: { email: string; className?: string }) {
  const href = mailtoHref(email);
  if (href) {
    return (
      <a href={href} className={`break-all font-medium hover:underline ${className}`}>
        {email}
      </a>
    );
  }
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 break-all font-medium ${className}`}>
      {email}
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset">
        <TriangleAlert aria-hidden className="size-3" /> Adresă invalidă
      </span>
    </span>
  );
}

// ---- page -------------------------------------------------------------------------------------

export function AdminMessagesPage() {
  const { toast, setUnread } = useAdmin();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "newsletter" ? "newsletter" : "contact";
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [toDelete, setToDelete] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const uid = useId();

  const load = useCallback(() => {
    setError(null);
    Promise.all([listSubmissions("contact"), listSubmissions("newsletter")])
      .then(([contact, newsletter]) => setData({ contact, newsletter }))
      .catch((err) => !isUnauthorized(err) && setError(errorMessage(err, "Nu am putut încărca mesajele.")));
  }, []);

  useEffect(load, [load]);

  const unread = data?.contact.filter((m) => !m.read).length ?? 0;
  useEffect(() => {
    if (data) setUnread(unread);
  }, [data, unread, setUnread]);

  const messages = useMemo(
    () => (data ? (onlyUnread ? data.contact.filter((m) => !m.read) : data.contact) : []),
    [data, onlyUnread],
  );

  const patch = (id: number, change: Partial<Submission>) =>
    setData((d) => d && { ...d, contact: d.contact.map((m) => (m.id === id ? { ...m, ...change } : m)) });

  const setBusy = (id: number, on: boolean) =>
    setBusyIds((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  async function toggleRead(message: Submission) {
    const read = !message.read;
    setBusy(message.id, true);
    patch(message.id, { read });
    try {
      await markSubmissionRead(message.id, read);
    } catch (err) {
      patch(message.id, { read: !read });
      if (!isUnauthorized(err)) toast(errorMessage(err, "Mesajul nu a putut fi actualizat."), "error");
    } finally {
      setBusy(message.id, false);
    }
  }

  async function markAllRead() {
    if (!data) return;
    setMarkingAll(true);
    let failed = 0;
    for (const m of data.contact.filter((x) => !x.read)) {
      try {
        await markSubmissionRead(m.id, true);
        patch(m.id, { read: true });
      } catch (err) {
        if (isUnauthorized(err)) return;
        failed++;
      }
    }
    setMarkingAll(false);
    if (!failed) toast("Toate mesajele au fost marcate ca citite.");
    else toast(failed === 1 ? "Un mesaj nu a putut fi actualizat." : `${plural(failed, "mesaj", "mesaje")} nu au putut fi actualizate.`, "error");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteSubmission(toDelete.id);
      const kind = toDelete.kind;
      setData((d) => d && { ...d, [kind]: d[kind].filter((m) => m.id !== toDelete.id) });
      toast(kind === "contact" ? "Mesajul a fost șters." : `Adresa ${toDelete.email} a fost eliminată din listă.`);
    } catch (err) {
      if (!isUnauthorized(err)) toast(errorMessage(err, "Ștergerea a eșuat."), "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  async function copyEmails() {
    if (!data) return;
    // Only plain addresses: this list is meant to be pasted into a mail client's BCC field.
    const valid = data.newsletter.map((s) => s.email).filter((email) => mailtoHref(email));
    const skipped = data.newsletter.length - valid.length;
    try {
      await navigator.clipboard.writeText(valid.join(", "));
      toast(
        `${plural(valid.length, "adresă copiată", "adrese copiate")} în clipboard.` +
          (skipped ? ` ${skipped === 1 ? "O adresă invalidă a fost omisă." : `${plural(skipped, "adresă invalidă", "adrese invalide")} au fost omise.`}` : ""),
      );
    } catch {
      toast("Browserul nu a permis copierea. Folosiți exportul CSV.", "error");
    }
  }

  const selectTab = (next: Tab) => {
    const n = new URLSearchParams(window.location.search);
    if (next === "newsletter") n.set("tab", "newsletter");
    else n.delete("tab");
    setParams(n, { replace: true });
  };

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next: Tab = e.key === "Home" ? "contact" : e.key === "End" ? "newsletter" : tab === "contact" ? "newsletter" : "contact";
    selectTab(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  }

  const tabButton = (key: Tab, label: string, count: number | null, countLabel: string) => (
    <button
      type="button"
      role="tab"
      id={`${uid}-tab-${key}`}
      aria-selected={tab === key}
      aria-controls={`${uid}-panel`}
      tabIndex={tab === key ? 0 : -1}
      onClick={() => selectTab(key)}
      onKeyDown={onTabKey}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
        tab === key ? "border-navy-900 text-navy-950" : "border-transparent text-slate-500 hover:text-navy-950"
      }`}
    >
      {label}
      {count !== null && count > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            key === "contact" ? "bg-brand-400 text-navy-950" : "bg-slate-200 text-slate-700"
          }`}
        >
          {count}
          <span className="sr-only"> {countLabel}</span>
        </span>
      )}
    </button>
  );

  return (
    <>
      <PageMeta title="Mesaje · Administrare" />
      <AdminPageHeader title="Mesaje" description="Mesajele din formularul de contact și abonații la newsletter." />

      {error && (
        <Alert tone="error" className="mb-6">
          <p>{error}</p>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} className="mt-3">
            Încearcă din nou
          </Button>
        </Alert>
      )}

      <div role="tablist" aria-label="Tip mesaje" className="mb-6 flex gap-2 border-b border-slate-200">
        {tabButton("contact", "Contact", data ? unread : null, unread === 1 ? "necitit" : "necitite")}
        {tabButton("newsletter", "Newsletter", data ? data.newsletter.length : null, "abonați")}
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} tabIndex={-1} className="outline-none">
        {!data && !error && <LoadingBlock label="Se încarcă mesajele…" rows={4} />}

        {data && tab === "contact" && (
          <>
            {data.contact.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyUnread}
                    onChange={(e) => setOnlyUnread(e.target.checked)}
                    className="size-4 accent-brand-700"
                  />
                  Doar necitite
                </label>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-600">
                    {plural(data.contact.length, "mesaj", "mesaje")}, {unread} {unread === 1 ? "necitit" : "necitite"}
                  </p>
                  {unread > 0 && (
                    <Button variant="secondary" size="sm" icon={CheckCheck} busy={markingAll} onClick={() => void markAllRead()}>
                      Marchează toate ca citite
                    </Button>
                  )}
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={onlyUnread && data.contact.length > 0 ? "Niciun mesaj necitit" : "Niciun mesaj"}
                text="Mesajele trimise prin formularul de contact al site-ului apar aici."
              />
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li key={m.id}>
                    <MessageCard
                      message={m}
                      busy={busyIds.has(m.id) || markingAll}
                      onToggleRead={() => void toggleRead(m)}
                      onDelete={() => setToDelete(m)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {data && tab === "newsletter" && (
          <>
            {data.newsletter.length === 0 ? (
              <EmptyState icon={UsersRound} title="Niciun abonat" text="Adresele înscrise la newsletter de pe site apar aici." />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">{plural(data.newsletter.length, "abonat", "abonați")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" icon={Copy} onClick={() => void copyEmails()}>
                      Copiază emailurile
                    </Button>
                    <Button variant="primary" size="sm" icon={Download} onClick={() => downloadCsv(data.newsletter)}>
                      Exportă CSV
                    </Button>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full table-fixed text-left text-sm">
                    <caption className="sr-only">Abonați la newsletter</caption>
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Email
                        </th>
                        <th scope="col" className="hidden w-64 px-4 py-3 sm:table-cell">
                          Data abonării
                        </th>
                        <th scope="col" className="w-16 px-4 py-3 text-right">
                          <span className="sr-only">Acțiuni</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.newsletter.map((s) => (
                        <tr key={s.id} className="align-middle">
                          <td className="px-4 py-3">
                            <EmailAddress email={s.email} className="text-navy-900" />
                            <span className="mt-0.5 block text-xs text-slate-500 sm:hidden">
                              <time dateTime={s.createdAt}>{formatDateTime(s.createdAt)}</time>
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                            <time dateTime={s.createdAt}>{formatDateTime(s.createdAt)}</time>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => setToDelete(s)}
                              className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
                              aria-label={`Elimină abonatul ${s.email}`}
                              title="Elimină din listă"
                            >
                              <Trash aria-hidden className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete?.kind === "newsletter" ? "Eliminați abonatul?" : "Ștergeți mesajul?"}
        description={
          toDelete?.kind === "newsletter" ? (
            <p>
              Adresa <strong className="break-all text-navy-950">{toDelete.email}</strong> va fi eliminată din lista de
              abonați.
            </p>
          ) : (
            <p>
              Mesajul de la <strong className="text-navy-950">{toDelete?.name || toDelete?.email}</strong>
              {toDelete ? ` (${formatDateTime(toDelete.createdAt)})` : ""} va fi șters definitiv. Acțiunea nu poate fi anulată.
            </p>
          )
        }
        confirmLabel={toDelete?.kind === "newsletter" ? "Elimină abonatul" : "Șterge mesajul"}
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

function MessageCard({
  message: m,
  busy,
  onToggleRead,
  onDelete,
}: {
  message: Submission;
  busy: boolean;
  onToggleRead: () => void;
  onDelete: () => void;
}) {
  const replyHref = mailtoHref(m.email, `Re: ${m.subject || "Mesajul dumneavoastră către eMIP"}`);
  return (
    <article
      className={`rounded-2xl border bg-white p-4 transition-colors sm:p-5 ${
        m.read ? "border-slate-200" : "border-brand-300 shadow-sm shadow-brand-500/10 ring-1 ring-brand-300"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          {!m.read && (
            <span className="rounded-full bg-brand-400 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-navy-950">
              Nou
            </span>
          )}
          <h2 className={`truncate text-base ${m.read ? "font-semibold" : "font-bold"}`}>{m.name || m.email}</h2>
        </div>
        <time dateTime={m.createdAt} className="text-xs text-slate-500">
          {formatDateTime(m.createdAt)}
        </time>
      </header>

      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
        <li className="inline-flex min-w-0 items-center gap-1.5">
          <Mail aria-hidden className="size-3.5 shrink-0 text-slate-400" />
          <span className="sr-only">Email: </span>
          <EmailAddress email={m.email} className="text-navy-700" />
        </li>
        {m.phone && (
          <li className="inline-flex items-center gap-1.5">
            <Phone aria-hidden className="size-3.5 shrink-0 text-slate-400" />
            <span className="sr-only">Telefon: </span>
            <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
              {m.phone}
            </a>
          </li>
        )}
        {m.company && (
          <li className="inline-flex items-center gap-1.5">
            <Building aria-hidden className="size-3.5 shrink-0 text-slate-400" />
            <span className="sr-only">Companie: </span>
            {m.company}
          </li>
        )}
      </ul>

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        {m.subject && <p className="font-semibold text-navy-950">{m.subject}</p>}
        <p className={`whitespace-pre-line break-words text-sm leading-relaxed text-slate-700 ${m.subject ? "mt-1.5" : ""}`}>
          {m.message}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {replyHref && (
          <a href={replyHref} className={buttonClass("secondary", "sm")}>
            <Reply aria-hidden className="size-4" /> Răspunde
          </a>
        )}
        <Button variant="ghost" size="sm" icon={m.read ? Mail : MailOpen} disabled={busy} onClick={onToggleRead}>
          {m.read ? "Marchează ca necitit" : "Marchează ca citit"}
        </Button>
        <Button variant="danger-outline" size="sm" icon={Trash} onClick={onDelete} className="sm:ml-auto">
          Șterge
        </Button>
      </div>
    </article>
  );
}
