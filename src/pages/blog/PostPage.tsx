import { useState } from "react";
import { Link, data, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { ArrowLeft, Check, Clock, EyeOff, Link2 } from "lucide-react";
import { ApiError } from "../../lib/api";
import { categoryPath, fetchCategories, fetchPost, fetchPosts, relatedPosts } from "../../lib/blog";
import { PostCard, firstCategoryLabel } from "../../components/blog/PostCard";
import { Markdown } from "../../components/ui/Markdown";
import { PageMeta } from "../../components/ui/PageMeta";
import { Container, Section } from "../../components/ui/Section";
import { SocialIcon } from "../../components/ui/SocialIcon";
import { formatDate } from "../../lib/text";
import { postJsonLd } from "../../../shared/seo";

export async function postLoader({ params }: LoaderFunctionArgs) {
  try {
    const [post, posts, categories] = await Promise.all([fetchPost(params.slug ?? ""), fetchPosts(), fetchCategories()]);
    return { post, posts, categories };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) throw data(null, { status: 404 });
    throw err;
  }
}

function ShareLinks({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const encoded = encodeURIComponent(url);
  const buttonClass =
    "flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-brand-500 hover:text-brand-700";

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-sm font-medium text-slate-500">Distribuie:</span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Distribuie pe LinkedIn"
        className={buttonClass}
      >
        <SocialIcon network="linkedin" className="size-4" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}&quote=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Distribuie pe Facebook"
        className={buttonClass}
      >
        <SocialIcon network="facebook" className="size-4" />
      </a>
      <button
        type="button"
        aria-label="Copiază linkul"
        className={buttonClass}
        onClick={() => {
          navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? <Check aria-hidden className="size-4 text-brand-700" /> : <Link2 aria-hidden className="size-4" />}
      </button>
    </div>
  );
}

export function PostPage() {
  const { post, posts, categories } = useLoaderData<typeof postLoader>();
  const labels = new Map(categories.map((c) => [c.slug, c.label]));
  const postCategories = categories.filter((c) => post.categories.includes(c.slug));
  const related = relatedPosts(posts, post);

  return (
    <>
      <PageMeta
        title={post.title}
        description={post.description}
        image={post.cover ?? undefined}
        imageAlt={post.coverAlt ?? undefined}
        article={{ published: post.date, modified: post.updated ?? post.date }}
        jsonLd={(origin) => postJsonLd(post, categories.find((c) => c.slug === post.categories[0]), origin)}
      />

      <article>
        {post.status === "draft" && (
          <p className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
            <EyeOff aria-hidden className="size-4" /> Previzualizare ciornă: articolul nu este public.
          </p>
        )}
        {/* Same glows as PageHeader, so posts match the other inner pages. */}
        <header className="relative isolate overflow-hidden bg-navy-950">
          <div
            aria-hidden
            className="absolute -right-32 -top-32 -z-10 size-[28rem] rounded-full bg-brand-500/10 blur-3xl"
          />
          <div aria-hidden className="absolute -bottom-40 -left-20 -z-10 size-96 rounded-full bg-navy-600/30 blur-3xl" />
          <Container size="narrow" className="py-14 sm:py-16">
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white">
              <ArrowLeft aria-hidden className="size-4" /> Toate articolele
            </Link>
            {postCategories.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {postCategories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={categoryPath(c.slug)}
                      className="block rounded-full bg-brand-400/15 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:bg-brand-400/25"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
              <span className="font-medium text-white">{post.author}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden className="size-3.5" /> {post.readingTime} min de citit
              </span>
            </p>
          </Container>
        </header>

        <Container size="narrow" className="py-12 sm:py-16">
          {/* Many migrated posts open with their cover image, and video posts use the video's
              thumbnail as cover: don't show the same picture twice. */}
          {post.cover && !post.body.includes(post.cover) && !(post.cover.endsWith("/cover.jpg") && /^::(youtube|video)\[/m.test(post.body)) && (
            <img
              src={post.cover}
              alt={post.coverAlt ?? ""}
              className="mb-12 aspect-[16/9] w-full rounded-2xl object-cover shadow-lg shadow-navy-900/10"
            />
          )}
          <Markdown source={post.body} className="sm:prose-lg" />

          <footer className="mt-14 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            {post.updated && post.updated !== post.date ? (
              <p className="text-sm text-slate-500">Actualizat: {formatDate(post.updated)}</p>
            ) : (
              <span />
            )}
            <ShareLinks title={post.title} />
          </footer>
        </Container>
      </article>

      {related.length > 0 && (
        <Section tone="muted">
          <h2 className="text-2xl font-bold tracking-tight">Articole similare</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} categoryLabel={firstCategoryLabel(p, labels)} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
