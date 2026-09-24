// Types and helpers shared by the API server (server/) and the web app (src/).

export type PostStatus = "draft" | "published";

export type Category = {
  slug: string;
  label: string;
  description: string;
};

export type PostSummary = {
  id: number;
  /** URL slug. Migrated Wix posts keep their original slugs, which may contain diacritics. */
  slug: string;
  title: string;
  description: string;
  /** Publication date, YYYY-MM-DD. */
  date: string;
  /** Last content update, YYYY-MM-DD. */
  updated: string | null;
  author: string;
  readingTime: number;
  cover: string | null;
  coverAlt: string | null;
  categories: string[];
  tags: string[];
  featured: boolean;
  pinned: boolean;
  status: PostStatus;
};

export type Post = PostSummary & {
  /** Markdown; see src/components/ui/Markdown.tsx for the supported directives. */
  body: string;
};

/** Payload for creating or updating a post in the admin API. */
export type PostInput = {
  slug: string;
  title: string;
  description: string;
  body: string;
  date: string;
  author: string;
  cover: string | null;
  coverAlt: string | null;
  categories: string[];
  tags: string[];
  featured: boolean;
  pinned: boolean;
  status: PostStatus;
};

export type UploadResult = { url: string; name: string; size: number; type: string };

export type ApiErrorBody = { error: string; fields?: Record<string, string> };

/** Lowercase ASCII slug; strips Romanian diacritics so URLs compare reliably. */
export const foldSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** Minutes at ~200 words per minute, at least 1. */
export const estimateReadingTime = (markdown: string) =>
  Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 200));
