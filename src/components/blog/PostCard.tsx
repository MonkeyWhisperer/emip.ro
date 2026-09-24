import { Link } from "react-router";
import { Clock, Newspaper } from "lucide-react";
import { postPath, type PostSummary } from "../../lib/blog";
import { formatDate } from "../../lib/text";

type Props = {
  post: PostSummary;
  /** Label of the post's first category, if known. */
  categoryLabel?: string;
  featured?: boolean;
};

export function PostCard({ post, categoryLabel, featured = false }: Props) {
  return (
    <article
      className={`group relative flex overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg hover:shadow-navy-900/5 ${
        featured ? "flex-col lg:col-span-full lg:flex-row" : "flex-col"
      }`}
    >
      {/* Covers are 16:9 (many have text baked in), so the frame is too. In the featured row the
          image also fills the height when the text column is taller (size-full on a stretched item). */}
      <div className={`overflow-hidden bg-navy-900 ${featured ? "lg:w-3/5" : ""}`}>
        {post.cover ? (
          <img
            src={post.cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-video size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-video size-full items-center justify-center text-brand-400">
            <Newspaper aria-hidden className="size-10" />
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col p-6 ${featured ? "lg:justify-center lg:p-10" : ""}`}>
        {categoryLabel && (
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{categoryLabel}</p>
        )}
        <h3
          className={`mt-2 leading-snug group-hover:text-navy-700 ${
            featured ? "text-2xl font-bold tracking-tight lg:text-3xl" : "font-semibold"
          }`}
        >
          <Link to={postPath(post)} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        {post.description && (
          <p className={`mt-3 text-sm leading-relaxed text-slate-600 ${featured ? "line-clamp-4 lg:text-base" : "line-clamp-3"}`}>
            {post.description}
          </p>
        )}
        <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-5 text-sm text-slate-500">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden>·</span>
          <Clock aria-hidden className="size-3.5" />
          {post.readingTime} min de citit
        </p>
      </div>
    </article>
  );
}

/** Label lookup helper for lists of cards. */
export const firstCategoryLabel = (post: PostSummary, labels: Map<string, string>) =>
  post.categories.map((c) => labels.get(c)).find(Boolean);
