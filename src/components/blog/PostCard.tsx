import type { ReactNode } from "react";
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
        <div className="mt-auto pt-5">
          <PostMeta className="gap-x-2 text-slate-500">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden>·</span>
            <Clock aria-hidden className="size-4" />
            <span>{post.readingTime} min de citit</span>
          </PostMeta>
        </div>
      </div>
    </article>
  );
}

/**
 * A post's date / reading-time row (cards and the post header). Every text in it is trimmed to its
 * lowercase letters (x-height to baseline), so centring the row centres the 16px clock on them,
 * not on the line box, and all the texts keep one baseline. The row is mostly lowercase: centred
 * on the line box or on the capitals, the clock sat 1–2px high next to it. min-h-5 keeps the
 * untrimmed row height. Text must sit in an element (a bare text node can't be trimmed).
 */
export function PostMeta({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <p className={`flex min-h-5 flex-wrap items-center gap-y-2 text-sm *:[text-box:trim-both_ex_alphabetic] ${className}`}>
      {children}
    </p>
  );
}

/** Label lookup helper for lists of cards. */
export const firstCategoryLabel = (post: PostSummary, labels: Map<string, string>) =>
  post.categories.map((c) => labels.get(c)).find(Boolean);
