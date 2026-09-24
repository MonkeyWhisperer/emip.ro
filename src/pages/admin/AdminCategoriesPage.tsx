import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { ExternalLink, Pencil, Plus, RefreshCw, Tags, Trash } from "lucide-react";
import { foldSlug, type Category, type PostSummary } from "../../../shared/blog";
import { createCategory, deleteCategory, listAdminCategories, listAdminPosts, updateCategory } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";
import { useAdmin } from "../../components/admin/AdminContext";
import { ConfirmDialog, Dialog } from "../../components/admin/Dialog";
import {
  AdminPageHeader,
  Alert,
  Button,
  EmptyState,
  Field,
  LoadingBlock,
  buttonClass,
  errorMessage,
  fieldAria,
  inputClass,
  isUnauthorized,
  plural,
} from "../../components/admin/ui";
import { PageMeta } from "../../components/ui/PageMeta";

type Data = { categories: Category[]; posts: PostSummary[] };
type Editing = { mode: "create" } | { mode: "edit"; category: Category } | null;
type Counts = { total: number; drafts: number };

const LABEL_MAX = 80;
const DESCRIPTION_MAX = 500;

function countLabel({ total, drafts }: Counts) {
  if (total === 0) return "Niciun articol";
  return drafts ? `${plural(total, "articol", "articole")} (${plural(drafts, "ciornă", "ciorne")})` : plural(total, "articol", "articole");
}

const iconAction =
  "inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-950";

export function AdminCategoriesPage() {
  const { toast } = useAdmin();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([listAdminCategories(), listAdminPosts()])
      .then(([categories, posts]) => setData({ categories, posts }))
      .catch((err) => !isUnauthorized(err) && setError(errorMessage(err, "Nu am putut încărca categoriile.")));
  }, []);

  useEffect(load, [load]);

  const counts = useMemo(() => {
    const map = new Map<string, Counts>();
    for (const post of data?.posts ?? []) {
      for (const slug of post.categories) {
        const c = map.get(slug) ?? { total: 0, drafts: 0 };
        c.total++;
        if (post.status === "draft") c.drafts++;
        map.set(slug, c);
      }
    }
    return map;
  }, [data]);
  const countOf = (slug: string) => counts.get(slug) ?? { total: 0, drafts: 0 };

  function onSaved(category: Category, mode: "create" | "edit") {
    setData(
      (d) =>
        d && {
          ...d,
          categories:
            mode === "create" ? [...d.categories, category] : d.categories.map((c) => (c.slug === category.slug ? category : c)),
        },
    );
    setEditing(null);
    toast(mode === "create" ? `Categoria „${category.label}” a fost creată.` : "Categoria a fost actualizată.");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(toDelete.slug);
      const slug = toDelete.slug;
      setData(
        (d) =>
          d && {
            categories: d.categories.filter((c) => c.slug !== slug),
            posts: d.posts.map((p) => ({ ...p, categories: p.categories.filter((c) => c !== slug) })),
          },
      );
      toast(`Categoria „${toDelete.label}” a fost ștearsă.`);
    } catch (err) {
      if (!isUnauthorized(err)) toast(errorMessage(err, "Categoria nu a putut fi ștearsă."), "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  const deleteCount = toDelete ? countOf(toDelete.slug).total : 0;

  return (
    <>
      <PageMeta title="Categorii · Administrare" />
      <AdminPageHeader
        title="Categorii"
        description={
          data ? `${plural(data.categories.length, "categorie", "categorii")} pentru organizarea articolelor pe blog.` : "Categoriile blogului."
        }
        actions={
          <Button variant="accent" icon={Plus} onClick={() => setEditing({ mode: "create" })}>
            Categorie nouă
          </Button>
        }
      />

      {error && (
        <Alert tone="error" className="mb-6">
          <p>{error}</p>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} className="mt-3">
            Încearcă din nou
          </Button>
        </Alert>
      )}

      {!data && !error && <LoadingBlock label="Se încarcă categoriile…" rows={5} />}

      {data && data.categories.length === 0 && (
        <EmptyState icon={Tags} title="Nicio categorie" text="Creați prima categorie pentru a grupa articolele pe blog.">
          <Button variant="accent" icon={Plus} onClick={() => setEditing({ mode: "create" })}>
            Categorie nouă
          </Button>
        </EmptyState>
      )}

      {data && data.categories.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Lista categoriilor</caption>
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Categorie
                  </th>
                  <th scope="col" className="w-56 px-4 py-3">
                    Slug
                  </th>
                  <th scope="col" className="w-48 px-4 py-3">
                    Articole
                  </th>
                  <th scope="col" className="w-36 px-4 py-3 text-right">
                    <span className="sr-only">Acțiuni</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.categories.map((c) => (
                  <tr key={c.slug} className="align-top transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-navy-950">{c.label}</span>
                      {c.description ? (
                        <span className="mt-1 line-clamp-2 text-slate-500" title={c.description}>
                          {c.description}
                        </span>
                      ) : (
                        <span className="mt-1 block text-slate-400">Fără descriere</span>
                      )}
                    </td>
                    <td className="truncate px-4 py-3.5 font-mono text-xs text-slate-600">{c.slug}</td>
                    <td className="px-4 py-3.5 text-slate-600">{countLabel(countOf(c.slug))}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => setEditing({ mode: "edit", category: c })}
                          className={iconAction}
                          aria-label={`Editează categoria ${c.label}`}
                          title="Editează"
                        >
                          <Pencil aria-hidden className="size-4" />
                        </button>
                        <a
                          href={`/blog/categories/${c.slug}`}
                          target="_blank"
                          rel="noopener"
                          className={iconAction}
                          aria-label={`Vezi categoria ${c.label} pe site (filă nouă)`}
                          title="Vezi pe site"
                        >
                          <ExternalLink aria-hidden className="size-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setToDelete(c)}
                          className={`${iconAction} hover:!bg-red-50 hover:!text-red-700`}
                          aria-label={`Șterge categoria ${c.label}`}
                          title="Șterge"
                        >
                          <Trash aria-hidden className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {data.categories.map((c) => (
              <li key={c.slug} className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-base font-semibold">{c.label}</h2>
                <p className="mt-0.5 font-mono text-xs text-slate-500">{c.slug}</p>
                {c.description && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{c.description}</p>}
                <p className="mt-2 text-sm font-medium text-slate-700">{countLabel(countOf(c.slug))}</p>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditing({ mode: "edit", category: c })}
                    className={buttonClass("secondary", "sm", "flex-1")}
                  >
                    <Pencil aria-hidden className="size-4" /> Editează
                  </button>
                  <a
                    href={`/blog/categories/${c.slug}`}
                    target="_blank"
                    rel="noopener"
                    className={buttonClass("secondary", "sm", "flex-1")}
                    aria-label={`Vezi categoria ${c.label} pe site (filă nouă)`}
                  >
                    <ExternalLink aria-hidden className="size-4" /> Vezi
                  </a>
                  <button type="button" onClick={() => setToDelete(c)} className={buttonClass("danger-outline", "sm")}>
                    <Trash aria-hidden className="size-4" /> Șterge
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog
        open={editing !== null}
        onCancel={() => setEditing(null)}
        title={editing?.mode === "edit" ? "Editează categoria" : "Categorie nouă"}
        size="md"
      >
        {editing && (
          <CategoryForm
            key={editing.mode === "edit" ? editing.category.slug : "new"}
            category={editing.mode === "edit" ? editing.category : null}
            onCancel={() => setEditing(null)}
            onSaved={(c) => onSaved(c, editing.mode)}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        title="Ștergeți categoria?"
        description={
          toDelete && (
            <>
              <p>
                Categoria <strong className="text-navy-950">„{toDelete.label}”</strong> va fi ștearsă definitiv.
              </p>
              <p className="mt-2">
                {deleteCount > 0
                  ? `${deleteCount === 1 ? "1 articol va pierde" : `${plural(deleteCount, "articol", "articole")} vor pierde`} această categorie. Articolele nu sunt șterse.`
                  : "Niciun articol nu folosește această categorie."}{" "}
                Pagina /blog/categories/{toDelete.slug} nu va mai exista.
              </p>
            </>
          )
        }
        confirmLabel="Șterge categoria"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

function CategoryForm({
  category,
  onCancel,
  onSaved,
}: {
  category: Category | null;
  onCancel: () => void;
  onSaved: (category: Category) => void;
}) {
  const [label, setLabel] = useState(category?.label ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(category?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();
  const creating = category === null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problems: Record<string, string> = {};
    if (!label.trim()) problems.label = "Numele este obligatoriu.";
    if (creating && !slug) problems.slug = "Slug-ul este obligatoriu.";
    setErrors(problems);
    setFormError(null);
    if (Object.keys(problems).length) {
      document.getElementById(`${id}-${Object.keys(problems)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const input = { label: label.trim(), description: description.trim() };
      const saved = creating ? await createCategory({ slug, ...input }) : await updateCategory(category.slug, input);
      onSaved(saved);
    } catch (err) {
      setBusy(false);
      if (isUnauthorized(err)) return;
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        setErrors(err.fields);
        document.getElementById(`${id}-${Object.keys(err.fields)[0]}`)?.focus();
      } else setFormError(errorMessage(err, "Categoria nu a putut fi salvată."));
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field id={`${id}-label`} label="Nume" error={errors.label} hint="Așa apare categoria pe blog.">
        <input
          {...fieldAria(`${id}-label`, { hint: true, error: errors.label })}
          type="text"
          value={label}
          maxLength={LABEL_MAX}
          data-autofocus
          onChange={(e) => {
            setLabel(e.target.value);
            if (creating && !slugTouched) setSlug(foldSlug(e.target.value).slice(0, 80).replace(/-+$/, ""));
          }}
          className={inputClass}
        />
      </Field>

      {creating ? (
        <Field
          id={`${id}-slug`}
          label="Slug"
          error={errors.slug}
          hint={`Adresa paginii: /blog/categories/${slug || "…"} · litere mici, cifre și cratime; nu se mai poate schimba după creare.`}
        >
          <input
            {...fieldAria(`${id}-slug`, { hint: true, error: errors.slug })}
            type="text"
            value={slug}
            maxLength={80}
            spellCheck={false}
            autoCapitalize="none"
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/\s+/g, "-");
              setSlugTouched(value !== "");
              setSlug(value);
            }}
            className={`${inputClass} font-mono`}
          />
        </Field>
      ) : (
        <div>
          <p className="text-sm font-semibold text-navy-950">Slug</p>
          <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-600">/blog/categories/{category.slug}</p>
          <p className="mt-1.5 text-xs text-slate-500">Slug-ul nu se poate schimba, ca să nu se strice linkurile existente.</p>
        </div>
      )}

      <Field
        id={`${id}-description`}
        label="Descriere"
        optional
        error={errors.description}
        hint="Apare în antetul paginii categoriei pe blog."
        aside={
          <span aria-hidden className="text-xs tabular-nums text-slate-500">
            {description.length}/{DESCRIPTION_MAX}
          </span>
        }
      >
        <textarea
          {...fieldAria(`${id}-description`, { hint: true, error: errors.description })}
          value={description}
          maxLength={DESCRIPTION_MAX}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Anulează
        </Button>
        <Button type="submit" busy={busy}>
          {creating ? "Creează categoria" : "Salvează"}
        </Button>
      </div>
    </form>
  );
}
