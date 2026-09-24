import { Link, NavLink, useLoaderData, useParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categoryPath, fetchCategories, fetchPosts } from "../../lib/blog";
import { PostCard, firstCategoryLabel } from "../../components/blog/PostCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { Section } from "../../components/ui/Section";
import { PlaceholderPage } from "../PlaceholderPage";

/** Three rows of three cards (page 1 of the main blog adds the full-width card on top). */
const PER_PAGE = 9;

export async function blogIndexLoader() {
  const [posts, categories] = await Promise.all([fetchPosts(), fetchCategories()]);
  return { posts, categories };
}

const chipClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-brand-400 text-navy-950" : "bg-white/10 text-slate-200 hover:bg-white/20"
  }`;

/** Serves /blog, /blog/page/:page, /blog/categories/:slug and /blog/categories/:slug/page/:page (Wix URLs). */
export function BlogIndexPage() {
  const { posts, categories } = useLoaderData<typeof blogIndexLoader>();
  const { slug, page = "1" } = useParams();

  const category = slug ? categories.find((c) => c.slug === slug) : undefined;
  const inCategory = (s: string) => posts.filter((p) => p.categories.includes(s));
  // Pinned posts come first; on the main blog, a post marked "featured" gets the big card.
  const ordered = [...(category ? inCategory(category.slug) : posts)].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const featured = !category ? ordered.find((p) => p.featured) : undefined;
  const list = featured ? [featured, ...ordered.filter((p) => p !== featured)] : ordered;
  const pageNum = Number(page);
  // Page 1 of the main blog opens with a full-width card; one extra post keeps the grid's rows full.
  const hasFeaturedCard = !category;
  const firstPageCount = hasFeaturedCard ? PER_PAGE + 1 : PER_PAGE;
  const totalPages = 1 + Math.ceil(Math.max(0, list.length - firstPageCount) / PER_PAGE);

  if ((slug && !category) || !Number.isInteger(pageNum) || pageNum < 1 || pageNum > totalPages) {
    return <PlaceholderPage notFound />;
  }

  const labels = new Map(categories.map((c) => [c.slug, c.label]));
  const base = category ? categoryPath(category.slug) : "/blog";
  const pageHref = (n: number) => (n === 1 ? base : `${base}/page/${n}`);
  const start = pageNum === 1 ? 0 : firstPageCount + (pageNum - 2) * PER_PAGE;
  const visible = list.slice(start, pageNum === 1 ? firstPageCount : start + PER_PAGE);
  const showFeatured = hasFeaturedCard && pageNum === 1;
  const usedCategories = categories.filter((c) => inCategory(c.slug).length > 0);
  const pagerClass =
    "flex size-10 items-center justify-center rounded-full border border-slate-300 bg-white text-navy-900 hover:border-navy-600";

  return (
    <>
      <PageMeta
        title={category ? `${category.label} | Blog` : "Blog"}
        description={
          category?.description ||
          "Articole, știri și analize despre managementul proiectelor finanțate, digitalizare și platforma eMIP."
        }
      />
      <PageHeader
        eyebrow={category ? "Categorie" : "Blog eMIP"}
        title={category ? category.label : "Ultimele știri din comunitatea eMIP"}
        text={
          category?.description ||
          "Articole, știri și analize despre managementul proiectelor finanțate, digitalizare, antreprenoriat și formare profesională."
        }
        wide={
          <nav aria-label="Categorii blog">
            <ul className="flex flex-wrap gap-2">
              <li>
                {/* Also highlighted on /blog/page/N, which `end` alone would not match. */}
                <NavLink to="/blog" end className={({ isActive }) => chipClass({ isActive: isActive || !category })}>
                  Toate <span className="opacity-75">{posts.length}</span>
                </NavLink>
              </li>
              {usedCategories.map((c) => (
                <li key={c.slug}>
                  <NavLink to={categoryPath(c.slug)} className={chipClass}>
                    {c.label} <span className="opacity-75">{inCategory(c.slug).length}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        }
      />

      <Section tone="muted">
        {/* The cards are h3s; this keeps the heading outline h1 > h2 > h3. */}
        <h2 className="sr-only">{category ? `Articole din categoria ${category.label}` : "Articole"}</h2>
        {visible.length === 0 ? (
          <p className="text-center text-slate-600">Nu există încă articole publicate.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                categoryLabel={firstCategoryLabel(post, labels)}
                featured={showFeatured && i === 0}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Paginare" className="mt-14 flex flex-wrap items-center justify-center gap-2">
            {pageNum > 1 && (
              <Link to={pageHref(pageNum - 1)} aria-label="Pagina anterioară" className={pagerClass}>
                <ChevronLeft aria-hidden className="size-5" />
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                to={pageHref(n)}
                aria-current={n === pageNum ? "page" : undefined}
                className={n === pageNum ? `${pagerClass} !border-navy-950 !bg-navy-950 !text-white` : pagerClass}
              >
                <span className="text-sm font-semibold">{n}</span>
              </Link>
            ))}
            {pageNum < totalPages && (
              <Link to={pageHref(pageNum + 1)} aria-label="Pagina următoare" className={pagerClass}>
                <ChevronRight aria-hidden className="size-5" />
              </Link>
            )}
          </nav>
        )}
      </Section>
    </>
  );
}
