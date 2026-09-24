import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ExternalLink, FileText, Pencil, Pin, Plus, RefreshCw, Search, SearchX, Star, Trash, X } from "lucide-react";
import type { Category, PostSummary } from "../../../shared/blog";
import { deletePost, listAdminCategories, listAdminPosts } from "../../lib/adminApi";
import { useAdmin } from "../../components/admin/AdminContext";
import { ConfirmDialog } from "../../components/admin/Dialog";
import {
  AdminButtonLink,
  AdminPageHeader,
  Alert,
  Button,
  EmptyState,
  LoadingBlock,
  StatusBadge,
  buttonClass,
  errorMessage,
  formatDay,
  inputClass,
  isUnauthorized,
  plural,
  searchKey,
} from "../../components/admin/ui";
import { PageMeta } from "../../components/ui/PageMeta";

type Data = { posts: PostSummary[]; categories: Category[] };
type StatusFilter = "" | "published" | "draft";

const byNewest = (a: PostSummary, b: PostSummary) => b.date.localeCompare(a.date) || b.id - a.id;
const editPath = (post: PostSummary) => `/admin/posts/${post.id}`;
const publicPath = (post: PostSummary) => `/post/${post.slug}`;

function Markers({ post }: { post: PostSummary }) {
  if (!post.featured && !post.pinned) return null;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {post.featured && (
        <span className="inline-flex items-center gap-1 rounded-md bg-navy-50 px-1.5 py-0.5 text-xs font-medium text-navy-700">
          <Star aria-hidden className="size-3" /> Recomandat
        </span>
      )}
      {post.pinned && (
        <span className="inline-flex items-center gap-1 rounded-md bg-navy-50 px-1.5 py-0.5 text-xs font-medium text-navy-700">
          <Pin aria-hidden className="size-3" /> Fixat
        </span>
      )}
    </span>
  );
}

const MAX_CHIPS = 2;

/** First categories as chips, the rest summarised as "+N" (all names in the tooltip / for screen readers). */
function CategoryChips({ post, labels }: { post: PostSummary; labels: Map<string, string> }) {
  if (post.categories.length === 0) return <span className="text-sm text-slate-400">—</span>;
  const names = post.categories.map((slug) => labels.get(slug) ?? slug);
  const hidden = names.slice(MAX_CHIPS);
  return (
    <ul className="flex flex-wrap gap-1.5" title={names.join(", ")}>
      {names.slice(0, MAX_CHIPS).map((name) => (
        <li key={name} className="max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {name}
        </li>
      ))}
      {hidden.length > 0 && (
        <li className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          <span aria-hidden>+{hidden.length}</span>
          <span className="sr-only">{hidden.join(", ")}</span>
        </li>
      )}
    </ul>
  );
}

const iconAction =
  "inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-950";

export function AdminPostsPage() {
  const { toast } = useAdmin();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const [toDelete, setToDelete] = useState<PostSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const id = useId();

  const query = params.get("q") ?? "";
  const status = (params.get("status") ?? "") as StatusFilter;
  const category = params.get("categorie") ?? "";
  const filtered = Boolean(query || status || category);

  const load = useCallback(() => {
    setError(null);
    Promise.all([listAdminPosts(), listAdminCategories()])
      .then(([posts, categories]) => setData({ posts: [...posts].sort(byNewest), categories }))
      .catch((err) => !isUnauthorized(err) && setError(errorMessage(err, "Nu am putut încărca articolele.")));
  }, []);

  useEffect(load, [load]);

  // Start from the live URL, not the last render's params, so quick successive changes don't drop each other.
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const labels = useMemo(() => new Map(data?.categories.map((c) => [c.slug, c.label])), [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    const needle = searchKey(query.trim());
    return data.posts.filter(
      (p) =>
        (!needle || searchKey(p.title).includes(needle)) &&
        (!status || p.status === status) &&
        (!category || p.categories.includes(category)),
    );
  }, [data, query, status, category]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deletePost(toDelete.id, toDelete.slug);
      setData((d) => d && { ...d, posts: d.posts.filter((p) => p.id !== toDelete.id) });
      toast(`Articolul „${toDelete.title}” a fost șters.`);
      setToDelete(null);
    } catch (err) {
      if (!isUnauthorized(err)) toast(errorMessage(err, "Articolul nu a putut fi șters."), "error");
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const published = data?.posts.filter((p) => p.status === "published").length ?? 0;
  const drafts = (data?.posts.length ?? 0) - published;

  return (
    <>
      <PageMeta title="Articole · Administrare" />
      <AdminPageHeader
        title="Articole"
        description={
          data
            ? `${plural(data.posts.length, "articol", "articole")} · ${published} ${published === 1 ? "publicat" : "publicate"} · ${drafts} ${drafts === 1 ? "ciornă" : "ciorne"}`
            : "Articolele blogului, publicate și ciorne."
        }
        actions={
          <AdminButtonLink to="/admin/posts/new" variant="accent" icon={Plus}>
            Articol nou
          </AdminButtonLink>
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

      {!data && !error && <LoadingBlock label="Se încarcă articolele…" rows={6} />}

      {data && data.posts.length === 0 && (
        <EmptyState icon={FileText} title="Niciun articol încă" text="Scrieți primul articol al blogului.">
          <AdminButtonLink to="/admin/posts/new" variant="accent" icon={Plus}>
            Articol nou
          </AdminButtonLink>
        </EmptyState>
      )}

      {data && data.posts.length > 0 && (
        <>
          <search className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_14rem_auto] lg:items-end">
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor={`${id}-q`} className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Caută după titlu
              </label>
              <div className="relative mt-1.5">
                <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id={`${id}-q`}
                  type="search"
                  value={query}
                  onChange={(e) => setFilter("q", e.target.value)}
                  placeholder="ex. digitalizare"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label htmlFor={`${id}-status`} className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </label>
              <select
                id={`${id}-status`}
                value={status}
                onChange={(e) => setFilter("status", e.target.value)}
                className={`${inputClass} mt-1.5`}
              >
                <option value="">Toate</option>
                <option value="published">Publicate</option>
                <option value="draft">Ciorne</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-cat`} className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Categorie
              </label>
              <select
                id={`${id}-cat`}
                value={category}
                onChange={(e) => setFilter("categorie", e.target.value)}
                className={`${inputClass} mt-1.5`}
              >
                <option value="">Toate categoriile</option>
                {data.categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            {filtered && (
              <Button variant="ghost" icon={X} onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Resetează
              </Button>
            )}
          </search>

          <p className="mb-3 text-sm text-slate-600" role="status">
            {filtered
              ? `${plural(visible.length, "rezultat", "rezultate")} din ${data.posts.length}`
              : `Toate articolele, cele mai noi primele`}
          </p>

          {visible.length === 0 ? (
            <EmptyState icon={SearchX} title="Niciun articol nu corespunde filtrelor" text="Încercați alt termen sau alte filtre.">
              <Button variant="secondary" icon={X} onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Resetează filtrele
              </Button>
            </EmptyState>
          ) : (
            <>
              {/* Tablet / desktop: table */}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                <table className="w-full table-fixed text-left text-sm">
                  <caption className="sr-only">Lista articolelor</caption>
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Articol
                      </th>
                      <th scope="col" className="w-28 px-4 py-3">
                        Status
                      </th>
                      <th scope="col" className="w-44 px-4 py-3">
                        Data
                      </th>
                      <th scope="col" className="hidden w-48 px-4 py-3 lg:table-cell">
                        Categorii
                      </th>
                      <th scope="col" className="w-36 px-4 py-3 text-right">
                        <span className="sr-only">Acțiuni</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.map((post) => (
                      <tr key={post.id} className="align-top transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3.5">
                          <Link to={editPath(post)} className="font-semibold text-navy-950 hover:text-navy-700 hover:underline">
                            {post.title}
                          </Link>
                          <span className="mt-1 block truncate font-mono text-xs text-slate-500">/post/{post.slug}</span>
                          <span className="mt-1.5 block empty:hidden">
                            <Markers post={post} />
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={post.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                          <time dateTime={post.date}>{formatDay(post.date)}</time>
                        </td>
                        <td className="hidden px-4 py-3.5 lg:table-cell">
                          <CategoryChips post={post} labels={labels} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-0.5">
                            <Link to={editPath(post)} className={iconAction} aria-label={`Editează: ${post.title}`} title="Editează">
                              <Pencil aria-hidden className="size-4" />
                            </Link>
                            <a
                              href={publicPath(post)}
                              target="_blank"
                              rel="noopener"
                              className={iconAction}
                              aria-label={`Vezi pe site (filă nouă): ${post.title}`}
                              title={post.status === "draft" ? "Previzualizează ciorna" : "Vezi pe site"}
                            >
                              <ExternalLink aria-hidden className="size-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setToDelete(post)}
                              className={`${iconAction} hover:!bg-red-50 hover:!text-red-700`}
                              aria-label={`Șterge: ${post.title}`}
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

              {/* Phone: cards */}
              <ul className="space-y-3 md:hidden">
                {visible.map((post) => (
                  <li key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={post.status} />
                      <time dateTime={post.date} className="text-xs text-slate-500">
                        {formatDay(post.date)}
                      </time>
                    </div>
                    <h2 className="mt-2 text-base font-semibold leading-snug">
                      <Link to={editPath(post)} className="hover:underline">
                        {post.title}
                      </Link>
                    </h2>
                    <div className="mt-2 flex flex-col gap-2 empty:hidden">
                      <Markers post={post} />
                      {post.categories.length > 0 && <CategoryChips post={post} labels={labels} />}
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                      <Link to={editPath(post)} className={buttonClass("secondary", "sm", "flex-1")}>
                        <Pencil aria-hidden className="size-4" /> Editează
                      </Link>
                      <a
                        href={publicPath(post)}
                        target="_blank"
                        rel="noopener"
                        className={buttonClass("secondary", "sm", "flex-1")}
                        aria-label={`Vezi pe site (filă nouă): ${post.title}`}
                      >
                        <ExternalLink aria-hidden className="size-4" /> Vezi
                      </a>
                      <button
                        type="button"
                        onClick={() => setToDelete(post)}
                        className={buttonClass("danger-outline", "sm")}
                        aria-label={`Șterge: ${post.title}`}
                      >
                        <Trash aria-hidden className="size-4" /> Șterge
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Ștergeți articolul?"
        description={
          toDelete && (
            <>
              <p>
                Articolul <strong className="text-navy-950">„{toDelete.title}”</strong> va fi șters definitiv. Acțiunea nu
                poate fi anulată.
              </p>
              {toDelete.status === "published" && (
                <p className="mt-2">Linkul public /post/{toDelete.slug} nu va mai funcționa.</p>
              )}
            </>
          )
        }
        confirmLabel="Șterge articolul"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
