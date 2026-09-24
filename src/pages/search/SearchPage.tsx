import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { FileText, Search } from "lucide-react";
import { footerNav, legalNav, mainNav } from "../../content/site";
import { fetchPosts, postPath, type PostSummary } from "../../lib/blog";
import { foldSlug, formatDate } from "../../lib/text";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Section } from "../../components/ui/Section";

// Replaces the Wix /search page: searches blog posts (title, description, tags) and site pages by name.

const normalize = (s: string) => foldSlug(s).replace(/-/g, " ");

const sitePages = [...new Map([...mainNav, ...footerNav, ...legalNav].map((p) => [p.href, p])).values()];

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchPosts().then(setPosts, () => setFailed(true));
  }, []);

  const terms = normalize(query).split(" ").filter((t) => t.length > 1);
  const matches = (text: string) => {
    const haystack = normalize(text);
    return terms.every((t) => haystack.includes(t));
  };

  const postResults =
    terms.length && posts ? posts.filter((p) => matches([p.title, p.description, ...p.tags].join(" "))) : [];
  const pageResults = terms.length ? sitePages.filter((p) => matches(p.label)) : [];
  const total = postResults.length + pageResults.length;

  return (
    <>
      <PageMeta title={query ? `Căutare: ${query}` : "Căutare"} description="Caută în articolele și paginile eMIP." />
      <meta name="robots" content="noindex" />
      <PageHeader eyebrow="Căutare" title="Caută pe site">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
            setParams(q ? { q } : {}, { replace: true });
          }}
          className="flex max-w-xl gap-2"
        >
          <label htmlFor="search-q" className="sr-only">
            Termen de căutare
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={query}
            key={query}
            placeholder="ex. raportare MIPE, eMIP Arch, PNRR"
            className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-white transition-colors placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-brand-400 px-5 py-3 text-sm font-semibold text-navy-950 shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-300"
          >
            <Search aria-hidden className="size-4" /> Caută
          </button>
        </form>
      </PageHeader>

      <Section tone="muted">
        <div className="mx-auto max-w-3xl" aria-live="polite">
          {!terms.length ? (
            <p className="text-slate-600">Introduceți un termen pentru a căuta în articole și pagini.</p>
          ) : failed ? (
            <p className="text-slate-600">Căutarea în articole nu este disponibilă momentan. Încercați din nou mai târziu.</p>
          ) : !posts ? (
            <p className="text-slate-600">Se caută…</p>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-500">
                {total === 0 ? `Niciun rezultat pentru „${query}”.` : `${total} rezultate pentru „${query}”`}
              </p>

              {pageResults.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {pageResults.map((p) => (
                    <li key={p.href}>
                      <Link
                        to={p.href}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:border-brand-500"
                      >
                        <FileText aria-hidden className="size-4 text-brand-700" /> {p.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <ul className="mt-6 space-y-4">
                {postResults.map((post) => (
                  <li
                    key={post.id}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-[border-color,box-shadow] hover:border-brand-500 hover:shadow-lg hover:shadow-navy-900/5"
                  >
                    {/* The whole card is the link target, like the blog's post cards. */}
                    <Link
                      to={postPath(post)}
                      className="text-lg font-semibold text-navy-950 after:absolute after:inset-0 after:rounded-2xl group-hover:text-navy-700"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(post.date)}</p>
                    {post.description && <p className="mt-2 line-clamp-2 text-slate-600">{post.description}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Section>
    </>
  );
}
