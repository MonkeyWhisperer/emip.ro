import type { Category, Post, PostSummary } from "../../shared/blog";
import { foldSlug } from "../../shared/blog";
import { apiFetch } from "./api";

export type { Category, Post, PostSummary };

// Public blog data. Lists are cached for the session (they change rarely and the
// server also sends a short Cache-Control); call invalidateBlogCache() after edits.
let postsCache: Promise<PostSummary[]> | undefined;
let categoriesCache: Promise<Category[]> | undefined;

export function fetchPosts(): Promise<PostSummary[]> {
  postsCache ??= apiFetch<PostSummary[]>("/posts").catch((err) => {
    postsCache = undefined;
    throw err;
  });
  return postsCache;
}

export function fetchCategories(): Promise<Category[]> {
  categoriesCache ??= apiFetch<Category[]>("/categories").catch((err) => {
    categoriesCache = undefined;
    throw err;
  });
  return categoriesCache;
}

export const fetchPost = (slug: string) => apiFetch<Post>(`/posts/${encodeURIComponent(slug)}`);

export function invalidateBlogCache() {
  postsCache = undefined;
  categoriesCache = undefined;
}

export const postPath = (post: Pick<PostSummary, "slug">) => `/post/${post.slug}`;
export const categoryPath = (slug: string) => `/blog/categories/${slug}`;

export const sameSlug = (a: string, b: string) => foldSlug(a) === foldSlug(b);

/** Posts sharing a category with `post`, newest first, padded with the latest posts. */
export function relatedPosts(all: PostSummary[], post: PostSummary, count = 3) {
  const others = all.filter((p) => p.id !== post.id);
  const shared = others.filter((p) => p.categories.some((c) => post.categories.includes(c)));
  return [...new Set([...shared, ...others])].slice(0, count);
}
