import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Category, Post } from "../shared/blog.ts";
import { getPostBySlug, listCategories, listPosts } from "./db.ts";

// The web app's public routes, as the server needs them for soft-404 status codes, link-preview
// meta tags, the sitemap and the AI assistant's page context.
// KEEP IN SYNC with src/router.tsx (routes), src/content/servicii.ts (service slugs) and
// src/pages/blog/BlogIndexPage.tsx (PER_PAGE).

/** Public site URL for absolute links (sitemap, canonical, og:url, og:image). */
export const SITE_URL = (process.env.SITE_URL ?? "https://www.emip.ro").replace(/\/+$/, "");
export const SITE_NAME = "Platforma eMIP";

/** Static pages; `sitemap: false` for utility or ended pages that should not be listed. */
const STATIC_PAGES: { path: string; sitemap?: false; title?: string }[] = [
  { path: "/" },
  { path: "/functionalitati" },
  { path: "/solutii" },
  { path: "/preturi" },
  { path: "/servicii" },
  { path: "/workshop-09-sept-2026", sitemap: false }, // ended event
  { path: "/noi" },
  { path: "/contact" },
  { path: "/librarie" },
  { path: "/termeni-si-conditii-legale" },
  { path: "/politica-de-confidentialitate" },
  { path: "/politica-cookies" },
  { path: "/search", sitemap: false, title: "Căutare" },
];

/**
 * /service-page/:slug pages (src/content/servicii.ts `services`); service pages exported to
 * site-pages.json count too. Old aliases are redirected (LEGACY below).
 */
export const SERVICE_SLUGS = ["workshop-demo-prezentare", "mentorat-prin-emip-plan-afaceri"];

/** Posts per blog index page (BlogIndexPage PER_PAGE); page 1 of the main blog shows one more (the full-width card). */
const PER_PAGE = 9;

const BLOG_DESCRIPTION = "Articole, știri și analize despre managementul proiectelor finanțate, digitalizare și platforma eMIP.";

// ---- page titles exported by `npm run knowledge:export` ------------------------------------

type SitePage = { path: string; title: string; description?: string; text: string };

const SITE_PAGES_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "generated", "site-pages.json");

/** Static pages rendered to text at build time (server/generated/site-pages.json); [] when missing. */
export function readSitePages(): SitePage[] {
  if (!existsSync(SITE_PAGES_FILE)) return [];
  return JSON.parse(readFileSync(SITE_PAGES_FILE, "utf8")) as SitePage[];
}

let pageIndex: { at: number; mtime: number; byPath: Map<string, SitePage> } | undefined;
/** Exported pages by path, re-read when the file changes (checked at most every 30 s). */
function sitePageIndex(): Map<string, SitePage> {
  const now = Date.now();
  if (pageIndex && now - pageIndex.at < 30_000) return pageIndex.byPath;
  let mtime = 0;
  let pages: SitePage[] = [];
  try {
    mtime = existsSync(SITE_PAGES_FILE) ? statSync(SITE_PAGES_FILE).mtimeMs : 0;
    if (pageIndex?.mtime !== mtime) pages = readSitePages();
  } catch (err) {
    console.error("[server] cannot read site-pages.json", err);
  }
  if (!pageIndex || pageIndex.mtime !== mtime) {
    pageIndex = { at: now, mtime, byPath: new Map(pages.filter((p) => p.path.startsWith("/") && !p.path.includes("#")).map((p) => [p.path, p])) };
  }
  pageIndex.at = now;
  return pageIndex.byPath;
}

// ---- route matching ------------------------------------------------------------------------

export type RouteMatch =
  | { kind: "page"; path: string; title?: string; description?: string }
  | { kind: "blog"; path: string; category?: Category }
  | { kind: "post"; path: string; post: Post }
  | { kind: "admin"; path: string };

/** Mirrors BlogIndexPage's totalPages: page 1 holds `firstPage` posts, later pages PER_PAGE. */
const pageCount = (posts: number, firstPage: number) => 1 + Math.ceil(Math.max(0, posts - firstPage) / PER_PAGE);
/** Mirrors BlogIndexPage: Number(page) must be an integer in 1..totalPages. */
const validPage = (page: string | undefined, posts: number, firstPage = PER_PAGE) => {
  if (page === undefined) return 1;
  const n = Number(page);
  return Number.isInteger(n) && n >= 1 && n <= pageCount(posts, firstPage) ? n : 0;
};

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/**
 * The public route a path belongs to, with its canonical path, or null when the web app would
 * render its 404 page. Matching follows React Router: case-insensitive route paths, an optional
 * trailing slash, dynamic segments compared as the page components compare them.
 */
export function matchRoute(rawPath: string): RouteMatch | null {
  const p = rawPath.length > 1 ? rawPath.replace(/\/$/, "") : rawPath;
  const lower = p.toLowerCase();

  if (lower === "/admin" || lower.startsWith("/admin/")) return { kind: "admin", path: p };

  const page = STATIC_PAGES.find((s) => s.path === lower);
  if (page) {
    const exported = sitePageIndex().get(page.path);
    return { kind: "page", path: page.path, title: exported?.title ?? page.title, description: exported?.description };
  }

  let m: RegExpMatchArray | null;
  if ((m = p.match(/^\/service-page\/([^/]+)$/i))) {
    const slug = safeDecode(m[1]);
    const pagePath = `/service-page/${slug}`;
    const exported = sitePageIndex().get(pagePath);
    if (!SERVICE_SLUGS.includes(slug) && !exported) return null;
    return { kind: "page", path: pagePath, title: exported?.title, description: exported?.description };
  }

  if ((m = p.match(/^\/blog(?:\/page\/([^/]+))?$/i))) {
    const n = validPage(m[1], listPosts({ includeDrafts: false }).length, PER_PAGE + 1);
    return n ? { kind: "blog", path: n > 1 ? `/blog/page/${n}` : "/blog" } : null;
  }

  if ((m = p.match(/^\/blog\/categories\/([^/]+)(?:\/page\/([^/]+))?$/i))) {
    const slug = safeDecode(m[1]);
    const category = listCategories().find((c) => c.slug === slug);
    if (!category) return null;
    const posts = listPosts({ includeDrafts: false }).filter((x) => x.categories.includes(slug)).length;
    const n = validPage(m[2], posts);
    const base = `/blog/categories/${slug}`;
    return n ? { kind: "blog", path: n > 1 ? `${base}/page/${n}` : base, category } : null;
  }

  if ((m = p.match(/^\/post\/([^/]+)$/i))) {
    const post = getPostBySlug(safeDecode(m[1]), { includeDrafts: false });
    return post ? { kind: "post", path: `/post/${post.slug}`, post } : null;
  }

  return null;
}

/**
 * The visitor's page for the AI assistant's context: the canonical path of a known public
 * route, or undefined for anything else (the value is visitor-supplied).
 */
export function knownPagePath(page: unknown): string | undefined {
  if (typeof page !== "string" || page.length > 300 || !page.startsWith("/") || /^\/[/\\]/.test(page)) return undefined;
  const route = matchRoute(page.split(/[?#]/)[0]);
  return route && route.kind !== "admin" ? route.path : undefined;
}

// ---- legacy URLs ---------------------------------------------------------------------------

const LEGACY: [RegExp, string][] = [
  [/^\/copy-of-politica-de-confiden(t|ț|%C8%9B)ialitate\/?$/i, "/politica-cookies"],
  [/^\/cookies\/?$/, "/politica-cookies"],
  [/^\/politica-confidentialitate\/?$/, "/politica-de-confidentialitate"],
  [/^\/service-page\/workshop-mystart-plan-afaceri\/?$/, "/service-page/workshop-demo-prezentare"],
  [/^\/blog\/tags\/.*/, "/blog"],
  [/^\/profil\/.*/, "/blog"],
  [/^\/product-page\/.*/, "/"],
];

/** Pages of the old English (/en/...) Wix site that have a Romanian equivalent at the same path. */
const EN_PAGES = new Set(["noi", "contact", "servicii", "librarie", "blog", "search", "functionalitati", "solutii", "preturi"]);
/** English blog category slugs of the Wix site. */
const EN_CATEGORIES: Record<string, string> = {
  "social-economy": "economie-sociala",
  digitization: "digitalizare",
  partnerships: "parteneriate",
  "mip-tools": "instrumente-mip",
};

/** Where an old Wix URL now lives (301), or undefined when the path is not a legacy URL. */
export function legacyTarget(p: string): string | undefined {
  const fixed = LEGACY.find(([re]) => re.test(p))?.[1];
  if (fixed) return fixed;
  const en = p.match(/^\/en(?:\/(.*?))?\/?$/i);
  if (!en) return undefined;
  const rest = (en[1] ?? "").toLowerCase();
  if (EN_PAGES.has(rest)) return `/${rest}`;
  const category = rest.match(/^blog\/categories\/([^/]+)$/)?.[1];
  // Own keys only: "constructor" or "__proto__" must not reach Object.prototype.
  if (category && Object.hasOwn(EN_CATEGORIES, category)) return `/blog/categories/${EN_CATEGORIES[category]}`;
  return "/";
}

// ---- sitemap -------------------------------------------------------------------------------

const xmlEscape = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch]!);

/** Absolute URL on the public site for a path (non-ASCII characters percent-encoded). */
export const absoluteUrl = (p: string) => new URL(p, `${SITE_URL}/`).href;

/** sitemap.xml: static pages, service pages, the blog, categories with posts and every published post. */
export function sitemapXml(): string {
  const posts = listPosts({ includeDrafts: false });
  const used = new Set(posts.flatMap((p) => p.categories));
  const latest = posts.reduce<string | undefined>((max, p) => {
    const d = p.updated ?? p.date;
    return !max || d > max ? d : max;
  }, undefined);
  const urls: { loc: string; lastmod?: string }[] = [
    ...STATIC_PAGES.filter((s) => s.sitemap !== false).map((s) => ({ loc: s.path })),
    ...SERVICE_SLUGS.map((slug) => ({ loc: `/service-page/${slug}` })),
    { loc: "/blog", lastmod: latest },
    ...listCategories()
      .filter((c) => used.has(c.slug))
      .map((c) => ({ loc: `/blog/categories/${encodeURIComponent(c.slug)}` })),
    ...posts.map((p) => ({ loc: `/post/${encodeURIComponent(p.slug)}`, lastmod: p.updated ?? p.date })),
  ];
  const body = urls
    .map(({ loc, lastmod }) => `  <url><loc>${xmlEscape(absoluteUrl(loc))}</loc>${lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : ""}</url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

// ---- server-side meta tags -----------------------------------------------------------------

const htmlEscape = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

const fullTitle = (title: string) => (title === SITE_NAME ? title : `${title} | ${SITE_NAME}`);

/**
 * <head> tags for link previews and crawlers that do not run JavaScript. Every tag carries
 * data-server-meta: the web app removes them at startup and renders its own per page.
 */
export function serverMetaTags(route: RouteMatch | null): string {
  const tags: string[] = [];
  const attr = "data-server-meta";
  const meta = (key: "name" | "property", name: string, content: string) =>
    tags.push(`<meta ${attr} ${key}="${name}" content="${htmlEscape(content)}" />`);
  const head = (title: string | undefined, description: string | undefined, canonical: string | undefined) => {
    if (title) {
      tags.push(`<title ${attr}>${htmlEscape(fullTitle(title))}</title>`);
      meta("property", "og:title", fullTitle(title));
    }
    if (description) {
      meta("name", "description", description);
      meta("property", "og:description", description);
    }
    if (canonical) {
      tags.push(`<link ${attr} rel="canonical" href="${htmlEscape(absoluteUrl(canonical))}" />`);
      meta("property", "og:url", absoluteUrl(canonical));
    }
  };

  if (!route) {
    tags.push(`<title ${attr}>${htmlEscape(fullTitle("Pagina nu a fost găsită"))}</title>`);
    meta("name", "robots", "noindex");
  } else if (route.kind === "post") {
    const { post } = route;
    head(post.title, post.description || undefined, `/post/${encodeURIComponent(post.slug)}`);
    if (post.cover) {
      meta("property", "og:image", absoluteUrl(post.cover));
      if (post.coverAlt) meta("property", "og:image:alt", post.coverAlt);
    }
  } else if (route.kind === "blog") {
    const { category } = route;
    head(category ? `${category.label} | Blog` : "Blog", category?.description || BLOG_DESCRIPTION, route.path);
  } else if (route.kind === "page") {
    head(route.title, route.description, route.path);
  }
  return tags.join("\n    ");
}
