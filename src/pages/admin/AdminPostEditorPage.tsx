import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link, useBlocker, useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, ExternalLink, EyeOff, FileQuestionMark, RefreshCw, Save, Send, Trash, Undo2, WandSparkles } from "lucide-react";
import { foldSlug, type Category, type Post, type PostInput, type PostStatus } from "../../../shared/blog";
import { createPost, deletePost, getAdminPost, listAdminCategories, updatePost } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";
import { useAdmin } from "../../components/admin/AdminContext";
import { CoverField } from "../../components/admin/CoverField";
import { ConfirmDialog } from "../../components/admin/Dialog";
import { MarkdownEditor } from "../../components/admin/MarkdownEditor";
import { TagInput } from "../../components/admin/TagInput";
import { dropDraft, isSessionLost, peekDraft, stashDraft } from "../../components/admin/draftStash";
import {
  AdminButtonLink,
  AdminPageHeader,
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  FieldError,
  LoadingBlock,
  StatusBadge,
  Toggle,
  buttonClass,
  errorMessage,
  fieldAria,
  formatDay,
  inputClass,
  isUnauthorized,
  labelClass,
  todayIso,
} from "../../components/admin/ui";
import { PageMeta } from "../../components/ui/PageMeta";

// ---- form model ---------------------------------------------------------------------

type Form = {
  title: string;
  slug: string;
  description: string;
  body: string;
  date: string;
  author: string;
  cover: string;
  coverAlt: string;
  categories: string[];
  tags: string[];
  featured: boolean;
  pinned: boolean;
};

type Errors = Partial<Record<keyof Form | "status", string>>;

const DEFAULT_AUTHOR = "Editor eMIP";
const DESCRIPTION_MAX = 500;
const DESCRIPTION_RECOMMENDED = 300;

const emptyForm = (): Form => ({
  title: "",
  slug: "",
  description: "",
  body: "",
  date: todayIso(),
  author: DEFAULT_AUTHOR,
  cover: "",
  coverAlt: "",
  categories: [],
  tags: [],
  featured: false,
  pinned: false,
});

const formFromPost = (p: Post): Form => ({
  title: p.title,
  slug: p.slug,
  description: p.description,
  body: p.body,
  date: p.date,
  author: p.author,
  cover: p.cover ?? "",
  coverAlt: p.coverAlt ?? "",
  categories: p.categories,
  tags: p.tags,
  featured: p.featured,
  pinned: p.pinned,
});

const toInput = (f: Form, status: PostStatus): PostInput => ({
  ...f,
  title: f.title.trim(),
  slug: f.slug.trim(),
  description: f.description.trim(),
  author: f.author.trim() || DEFAULT_AUTHOR,
  cover: f.cover || null,
  coverAlt: f.coverAlt.trim() || null,
  status,
});

const sameForm = (a: Form, b: Form) => JSON.stringify(a) === JSON.stringify(b);

/** Gentle clean-up while typing a slug: keeps migrated Wix slugs (diacritics, "_") intact. */
const tidySlug = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/\/+/g, "-");

const FIELD_ORDER: (keyof Errors)[] = ["title", "slug", "description", "cover", "body", "categories", "tags", "date", "author"];

// ---- route component ------------------------------------------------------------------

/**
 * Navigation state set when the "new post" editor has just created the post and moves to its
 * URL: that same editor instance stays mounted (keeping focus, caret, scroll and anything typed
 * while the request was in flight) instead of being replaced by a freshly loaded one.
 */
type ContinuedState = { continueEditor?: string } | null;
const continuedEditor = (state: unknown) => {
  const key = (state as ContinuedState)?.continueEditor;
  return typeof key === "string" ? key : undefined;
};

/** /admin/posts/new and /admin/posts/:id. Keyed so each post (and each visit to "new") gets a fresh editor. */
export function AdminPostEditorPage() {
  const { id } = useParams();
  const { state, key: locationKey } = useLocation();
  const editorKey = continuedEditor(state) ?? (id === undefined ? `new-${locationKey}` : `post-${id}`);
  return <EditorLoader key={editorKey} editorKey={editorKey} idParam={id} />;
}

function EditorLoader({ idParam, editorKey }: { idParam?: string; editorKey: string }) {
  const postId = idParam === undefined ? null : /^\d+$/.test(idParam) ? Number(idParam) : Number.NaN;
  const [data, setData] = useState<{ post: Post | null; categories: Category[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The id this loader has data for; a continuation (null -> new id) needs no reload.
  const loadedFor = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (loadedFor.current === null && postId !== null && !Number.isNaN(postId)) {
      loadedFor.current = postId;
      return;
    }
    if (Number.isNaN(postId)) {
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setError(null);
    const post = postId === null ? Promise.resolve(null) : getAdminPost(postId);
    Promise.all([post, listAdminCategories()])
      .then(([p, categories]) => {
        if (cancelled) return;
        loadedFor.current = postId;
        setData({ post: p, categories });
      })
      .catch((err) => {
        if (cancelled || isUnauthorized(err)) return;
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(errorMessage(err, "Nu am putut încărca articolul."));
      });
    return () => {
      cancelled = true;
    };
  }, [postId, attempt]);

  const title = postId === null ? "Articol nou" : "Editează articolul";
  // Same header as the loaded editor, so the title doesn't move when the data arrives.
  const backToList = (
    <Link to="/admin" className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-navy-950">
      <ArrowLeft aria-hidden className="size-4" /> Articole
    </Link>
  );

  if (notFound) {
    return (
      <>
        <PageMeta title={`Articol inexistent · Administrare`} />
        <AdminPageHeader title="Articol inexistent" back={backToList} />
        <EmptyState icon={FileQuestionMark} title="Articolul nu a fost găsit" text="Poate a fost șters sau linkul este greșit.">
          <AdminButtonLink to="/admin" variant="secondary" icon={ArrowLeft}>
            Înapoi la articole
          </AdminButtonLink>
        </EmptyState>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageMeta title={`${title} · Administrare`} />
        <AdminPageHeader sticky title={title} back={backToList} />
        {error ? (
          <Alert tone="error">
            <p>{error}</p>
            <Button variant="secondary" size="sm" icon={RefreshCw} className="mt-3" onClick={() => setAttempt((n) => n + 1)}>
              Încearcă din nou
            </Button>
          </Alert>
        ) : (
          <LoadingBlock label="Se încarcă articolul…" rows={5} />
        )}
      </>
    );
  }

  return <PostEditor post={data.post} categories={data.categories} editorKey={editorKey} />;
}

// ---- editor ---------------------------------------------------------------------------

function PostEditor({ post, categories, editorKey }: { post: Post | null; categories: Category[]; editorKey: string }) {
  const { toast, setLeaveGuard } = useAdmin();
  const navigate = useNavigate();
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;

  const [initial] = useState(() => ({
    base: post ? formFromPost(post) : emptyForm(),
    draft: peekDraft<Form>(post ? `post-${post.id}` : "new"),
  }));
  const [saved, setSaved] = useState<Post | null>(post);
  // Follows `saved`: a new post keeps this editor after creation (see ContinuedState).
  const draftKey = saved ? `post-${saved.id}` : "new";
  const [baseline, setBaseline] = useState<Form>(initial.base);
  const [form, setForm] = useState<Form>(initial.draft ?? initial.base);
  const [slugTouched, setSlugTouched] = useState(
    () => !!post || (!!initial.draft && initial.draft.slug !== foldSlug(initial.draft.title)),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<PostStatus | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty = !sameForm(form, baseline);
  const isPublished = saved?.status === "published";
  const savedStatus: PostStatus = saved?.status ?? "draft";

  // Live values for the navigation blocker, keyboard shortcut, queued saves and unmount handler.
  const dirtyRef = useRef(dirty);
  const formRef = useRef(form);
  const savedRef = useRef(saved);
  const allowLeave = useRef(false);
  const savingRef = useRef(false);
  const queuedSave = useRef<PostStatus | null>(null);
  useLayoutEffect(() => {
    dirtyRef.current = dirty;
    formRef.current = form;
    savedRef.current = saved;
  });

  useEffect(() => dropDraft(draftKey), [draftKey]);

  // Session expired mid-edit: keep the changes in memory for after the new login.
  useEffect(
    () => () => {
      if (dirtyRef.current && !allowLeave.current && isSessionLost()) stashDraft(draftKey, formRef.current);
    },
    [draftKey],
  );

  // ---- unsaved-changes guard ----
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        dirtyRef.current &&
        !allowLeave.current &&
        currentLocation.pathname !== nextLocation.pathname &&
        continuedEditor(nextLocation.state) !== editorKey,
      [editorKey],
    ),
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    setLeaveGuard(() => dirtyRef.current && !allowLeave.current);
    return () => setLeaveGuard(null);
  }, [setLeaveGuard]);

  // ---- editing ----
  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "title" && !slugTouched) next.slug = foldSlug(String(value));
      return next;
    });
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  function focusFirstError(fields: Errors) {
    const first = FIELD_ORDER.find((k) => fields[k]);
    if (first) document.getElementById(fid(first))?.focus();
  }

  // ---- saving ----
  // Reads the live refs, so a save queued while another one is in flight sends the latest text.
  async function save(status: PostStatus): Promise<void> {
    if (savingRef.current) {
      queuedSave.current = status;
      return;
    }
    const submitted = formRef.current;
    const existing = savedRef.current;
    const problems: Errors = {};
    if (!submitted.title.trim()) problems.title = "Titlul este obligatoriu.";
    if (!submitted.slug.trim()) problems.slug = "Slug-ul este obligatoriu.";
    if (Object.keys(problems).length) {
      setErrors(problems);
      setFormError("Articolul nu a fost salvat: completați câmpurile marcate.");
      focusFirstError(problems);
      return;
    }

    savingRef.current = true;
    setSaving(status);
    setFormError(null);
    let ok = false;
    try {
      const input = toInput(submitted, status);
      const result = existing ? await updatePost(existing.id, input, existing.slug) : await createPost(input);
      const fresh = formFromPost(result);
      savedRef.current = result;
      setSaved(result);
      setBaseline(fresh);
      // Keep anything typed while the request was in flight.
      setForm((current) => (sameForm(current, submitted) ? fresh : current));
      setErrors({});
      ok = true;
      toast(
        status === "published"
          ? existing?.status === "published"
            ? "Modificările au fost salvate."
            : "Articolul a fost publicat."
          : existing?.status === "published"
            ? "Articolul a fost retras de pe site și mutat la ciorne."
            : "Ciorna a fost salvată.",
      );
      // Same editor, new address: nothing is reloaded, so typing can go on uninterrupted.
      if (!existing) {
        setSlugTouched(true); // like any saved post: renaming it no longer rewrites its address
        const state: ContinuedState = { continueEditor: editorKey };
        navigate(`/admin/posts/${result.id}`, { replace: true, state });
      }
    } catch (err) {
      if (isUnauthorized(err)) return; // the layout sends us to login; changes are kept in memory
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        const fields = err.fields as Errors;
        setErrors(fields);
        setFormError(fields.status ?? "Articolul nu a fost salvat: verificați câmpurile marcate.");
        focusFirstError(fields);
      } else {
        setFormError(errorMessage(err, "Articolul nu a putut fi salvat."));
      }
    } finally {
      savingRef.current = false;
      setSaving(null);
    }
    const queued = queuedSave.current;
    queuedSave.current = null;
    if (queued && ok) await save(queued);
  }

  // Ctrl/Cmd+S saves, keeping the current status.
  const saveRef = useRef(save);
  useLayoutEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!document.querySelector("dialog[open]")) void saveRef.current(savedRef.current?.status ?? "draft");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function remove() {
    if (!saved) return;
    setDeleting(true);
    try {
      await deletePost(saved.id, saved.slug);
      allowLeave.current = true;
      toast(`Articolul „${saved.title}” a fost șters.`);
      navigate("/admin", { replace: true });
    } catch (err) {
      setDeleting(false);
      setConfirmDelete(false);
      if (!isUnauthorized(err)) toast(errorMessage(err, "Articolul nu a putut fi șters."), "error");
    }
  }

  // ---- derived UI state ----
  const originalSlug = isPublished && saved && form.slug.trim() !== saved.slug ? saved.slug : null;
  const descriptionLength = form.description.length;
  const suggestedSlug = foldSlug(form.title);
  const publicUrl = saved ? `/post/${saved.slug}` : null;
  const busy = saving !== null;

  return (
    <>
      <PageMeta title={`${saved ? "Editează articolul" : "Articol nou"} · Administrare`} />

      {/* Same header as every admin screen, kept visible so the save buttons are always at hand. */}
      <AdminPageHeader
        sticky
        title={saved ? "Editează articolul" : "Articol nou"}
        back={
          <Link to="/admin" className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-navy-950">
            <ArrowLeft aria-hidden className="size-4" /> Articole
          </Link>
        }
        titleAddon={
          <>
            <StatusBadge status={savedStatus} />
            <span className="text-xs font-medium text-slate-500" role="status">
              {dirty ? (
                <span className="inline-flex items-center gap-1.5 text-amber-800">
                  <span aria-hidden className="size-1.5 rounded-full bg-amber-500" /> Modificări nesalvate
                </span>
              ) : saved ? (
                "Toate modificările sunt salvate"
              ) : null}
            </span>
          </>
        }
        actions={
          <>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener"
                className={buttonClass("ghost")}
                title={dirty ? "Deschide ultima versiune salvată" : "Deschide articolul într-o filă nouă"}
              >
                <ExternalLink aria-hidden className="size-4" />
                Previzualizare<span className="sr-only"> (filă nouă, ultima versiune salvată)</span>
              </a>
            )}
            {isPublished ? (
              <Button icon={Save} busy={saving === "published"} disabled={busy} onClick={() => void save("published")}>
                Salvează modificările
              </Button>
            ) : (
              <>
                <Button variant="secondary" icon={Save} busy={saving === "draft"} disabled={busy} onClick={() => void save("draft")}>
                  Salvează ciorna
                </Button>
                <Button variant="accent" icon={Send} busy={saving === "published"} disabled={busy} onClick={() => void save("published")}>
                  Publică
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="space-y-4 empty:hidden [&:not(:empty)]:mb-6">
        {initial.draft && (
          <Alert tone="info">
            Am restaurat modificările nesalvate dinaintea expirării sesiunii. Salvați articolul pentru a le păstra.
          </Alert>
        )}
        {formError && <Alert tone="error">{formError}</Alert>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* Details */}
        <Card title="Detalii" titleId={fid("h-details")}>
          <div className="space-y-5">
            <Field id={fid("title")} label="Titlu" error={errors.title}>
              <input
                {...fieldAria(fid("title"), { error: errors.title })}
                type="text"
                value={form.title}
                maxLength={200}
                onChange={(e) => update("title", e.target.value)}
                className={`${inputClass} py-2.5 text-base font-semibold`}
                placeholder="Titlul articolului"
              />
            </Field>

            <Field
              id={fid("slug")}
              label="Slug (adresa articolului)"
              error={errors.slug}
              hint={
                saved
                  ? "Litere mici, cifre și cratime."
                  : slugTouched
                    ? "Editat manual. Litere mici, cifre și cratime."
                    : "Generat automat din titlu până îl modificați."
              }
            >
              <div
                className={`flex overflow-hidden rounded-lg border bg-white transition-colors has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-brand-500 ${
                  errors.slug ? "border-red-500" : "border-slate-300 hover:border-slate-400"
                }`}
              >
                <span aria-hidden className="flex items-center border-r border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-500">
                  /post/
                </span>
                <input
                  {...fieldAria(fid("slug"), { hint: true, error: errors.slug })}
                  type="text"
                  value={form.slug}
                  maxLength={200}
                  spellCheck={false}
                  autoCapitalize="none"
                  onChange={(e) => {
                    const value = tidySlug(e.target.value);
                    // Clearing the slug of a new post hands it back to the title.
                    setSlugTouched(!!saved || value !== "");
                    update("slug", value);
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 font-mono text-sm text-navy-950 outline-none focus-visible:outline-none"
                />
                {suggestedSlug && form.slug !== suggestedSlug && (
                  <button
                    type="button"
                    onClick={() => {
                      setSlugTouched(!!saved);
                      update("slug", suggestedSlug);
                    }}
                    className="flex shrink-0 items-center gap-1.5 border-l border-slate-200 px-3 text-xs font-semibold text-navy-700 hover:bg-slate-50"
                    title={`Folosește „${suggestedSlug}”`}
                  >
                    <WandSparkles aria-hidden className="size-3.5" />
                    <span className="hidden sm:inline">Din titlu</span>
                    <span className="sr-only sm:hidden">Generează slug-ul din titlu</span>
                  </button>
                )}
              </div>
            </Field>
            {originalSlug && (
              <Alert tone="warning">
                <p>
                  <strong>Atenție:</strong> articolul este publicat. Dacă schimbați slug-ul, linkurile existente către{" "}
                  <span className="break-all font-mono">/post/{originalSlug}</span> (din Google, rețele sociale, newslettere sau
                  alte site-uri) nu vor mai funcționa.
                </p>
                <button
                  type="button"
                  onClick={() => update("slug", originalSlug)}
                  className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"
                >
                  <Undo2 aria-hidden className="size-3.5" /> Păstrează slug-ul inițial
                </button>
              </Alert>
            )}

            <Field
              id={fid("description")}
              label="Descriere"
              optional
              error={errors.description}
              hint={`Apare în lista articolelor și în rezultatele căutării Google. Recomandat: cel mult ${DESCRIPTION_RECOMMENDED} de caractere (maxim ${DESCRIPTION_MAX}).`}
              aside={
                <span
                  aria-hidden
                  className={`text-xs tabular-nums ${
                    descriptionLength > DESCRIPTION_RECOMMENDED ? "font-semibold text-amber-700" : "text-slate-500"
                  }`}
                >
                  {descriptionLength}/{DESCRIPTION_MAX}
                </span>
              }
            >
              <textarea
                {...fieldAria(fid("description"), { hint: true, error: errors.description })}
                value={form.description}
                maxLength={DESCRIPTION_MAX}
                rows={3}
                onChange={(e) => update("description", e.target.value)}
                className={`${inputClass} resize-y`}
                placeholder="Rezumatul articolului, în una-două fraze."
              />
            </Field>
            {descriptionLength > DESCRIPTION_RECOMMENDED && (
              <p className="-mt-3 text-xs font-medium text-amber-800">
                Descrierea depășește lungimea recomandată ({DESCRIPTION_RECOMMENDED} de caractere) și poate apărea trunchiată în
                lista articolelor și în Google.
              </p>
            )}
          </div>
        </Card>

        {/* Cover */}
        <Card title="Imagine de copertă" titleId={fid("h-cover")}>
          <CoverField
            cover={form.cover}
            alt={form.coverAlt}
            onCoverChange={(url) => update("cover", url)}
            onAltChange={(alt) => update("coverAlt", alt)}
            error={errors.cover}
            altId={fid("coverAlt")}
          />
        </Card>

        {/* Body */}
        <Card title="Conținut" titleId={fid("h-body")} className="lg:col-span-2">
          <label htmlFor={fid("body")} className="sr-only">
            Conținutul articolului (Markdown)
          </label>
          <MarkdownEditor
            id={fid("body")}
            value={form.body}
            onChange={(body) => update("body", body)}
            describedBy={errors.body ? fid("body-error") : undefined}
            invalid={!!errors.body}
            previewTitle={form.title}
          />
          <FieldError id={fid("body-error")} error={errors.body} />
          <details className="group mt-4 rounded-xl border border-slate-200 bg-slate-50 text-sm">
            <summary className="cursor-pointer select-none px-4 py-2.5 font-semibold text-navy-900">Ghid rapid Markdown</summary>
            <dl className="grid gap-x-8 gap-y-2 border-t border-slate-200 px-4 py-3 sm:grid-cols-2">
              {[
                ["## Titlu", "titlu de secțiune (### pentru subtitlu)"],
                ["**text** sau _text_", "îngroșat / cursiv"],
                ["[text](https://…)", "link"],
                ["- element / 1. element", "listă cu puncte / numerotată"],
                ["> text", "citat"],
                ["![descriere](/media/…)", "imagine (butonul Imagine o încarcă)"],
                ["::youtube[ID]", "video YouTube"],
                ["::video[https://….mp4]", "fișier video MP4"],
                [":::details Titlu … :::", "secțiune pliabilă (pe linii separate)"],
                ["📎 [Nume.pdf](/media/…) (PDF, 231 KB)", "fișier de descărcat (butonul Fișier)"],
              ].map(([code, text]) => (
                <div key={code} className="flex flex-col">
                  <dt>
                    <code className="font-mono text-xs text-navy-900">{code}</code>
                  </dt>
                  <dd className="text-xs text-slate-500">{text}</dd>
                </div>
              ))}
            </dl>
          </details>
        </Card>

        {/* Categories & tags */}
        <Card title="Categorii și etichete" titleId={fid("h-taxonomy")}>
          <div className="space-y-6">
            <fieldset
              id={fid("categories")}
              tabIndex={-1}
              aria-describedby={errors.categories ? fid("categories-error") : undefined}
              className="outline-none"
            >
              <legend className={labelClass}>Categorii</legend>
              {categories.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">
                  Nu există categorii.{" "}
                  <Link to="/admin/categories" className="font-semibold text-navy-700 underline underline-offset-2">
                    Adăugați o categorie
                  </Link>
                </p>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {categories.map((c) => {
                    const checked = form.categories.includes(c.slug);
                    return (
                      <label
                        key={c.slug}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          checked ? "border-brand-500 bg-brand-50 text-navy-950" : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            update(
                              "categories",
                              e.target.checked ? [...form.categories, c.slug] : form.categories.filter((s) => s !== c.slug),
                            )
                          }
                          className="mt-0.5 size-4 shrink-0 accent-brand-700"
                        />
                        <span className="font-medium">{c.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <FieldError id={fid("categories-error")} error={errors.categories} />
            </fieldset>

            <Field
              id={fid("tags")}
              label="Etichete"
              optional
              error={errors.tags}
              hint="Apăsați Enter sau virgulă după fiecare etichetă (maximum 30)."
            >
              <TagInput
                id={fid("tags")}
                tags={form.tags}
                onChange={(tags) => update("tags", tags)}
                describedBy={fid("tags-hint")}
              />
            </Field>
          </div>
        </Card>

        {/* Settings */}
        <Card title="Setări" titleId={fid("h-settings")}>
          <div className="space-y-5">
            <Field id={fid("date")} label="Data publicării" error={errors.date}>
              <input
                {...fieldAria(fid("date"), { error: errors.date })}
                type="date"
                required
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field id={fid("author")} label="Autor" error={errors.author}>
              <input
                {...fieldAria(fid("author"), { error: errors.author })}
                type="text"
                value={form.author}
                maxLength={100}
                onChange={(e) => update("author", e.target.value)}
                placeholder={DEFAULT_AUTHOR}
                className={inputClass}
              />
            </Field>
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <Toggle
                id={fid("featured")}
                checked={form.featured}
                onChange={(v) => update("featured", v)}
                label="Articol recomandat"
                hint="Apare în cardul mare de pe prima pagină a blogului, înaintea articolelor mai noi. Fără articol recomandat, cardul mare arată cel mai nou articol."
              />
              <Toggle
                id={fid("pinned")}
                checked={form.pinned}
                onChange={(v) => update("pinned", v)}
                label="Fixat sus"
                hint="Apare primul în listă, înaintea articolelor mai noi. Celelalte articole sunt ordonate după dată, de la cel mai nou."
              />
            </div>

            {saved && (
              <div className="space-y-3 border-t border-slate-100 pt-5">
                {saved.updated && saved.updated !== saved.date && (
                  <p className="text-xs text-slate-500">Ultima actualizare a conținutului: {formatDay(saved.updated)}</p>
                )}
                {isPublished && (
                  <div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={EyeOff}
                      busy={saving === "draft"}
                      disabled={busy}
                      onClick={() => void save("draft")}
                      className="w-full"
                    >
                      Retrage publicarea
                    </Button>
                    <p className="mt-1.5 text-xs text-slate-500">Articolul devine ciornă și dispare de pe site.</p>
                  </div>
                )}
                <Button variant="danger-outline" size="sm" icon={Trash} onClick={() => setConfirmDelete(true)} className="w-full">
                  Șterge articolul
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Ștergeți articolul?"
        description={
          <p>
            Articolul <strong className="text-navy-950">„{saved?.title}”</strong> va fi șters definitiv. Acțiunea nu poate fi
            anulată.
            {isPublished && ` Linkul public /post/${saved?.slug} nu va mai funcționa.`}
          </p>
        }
        confirmLabel="Șterge articolul"
        busy={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Părăsiți pagina fără să salvați?"
        description="Aveți modificări nesalvate în acest articol. Dacă părăsiți pagina, ele se pierd."
        confirmLabel="Părăsește pagina"
        cancelLabel="Rămân pe pagină"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </>
  );
}
