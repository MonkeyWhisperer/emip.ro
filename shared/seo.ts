// Search-engine metadata shared by the server (tags in the first HTML response, for crawlers and
// link previews that don't run scripts) and the web app (PageMeta), so both describe a page alike.

import type { Category, PostSummary } from "./blog.ts";

export const SITE_NAME = "Platforma eMIP";

/** Link-preview image for pages without a cover of their own (public/og-image.jpg). */
export const DEFAULT_SHARE_IMAGE = {
  path: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Platforma eMIP: platforma #1 pentru implementarea proiectelor PEO & PIDS",
};

/** The admin panel's default byline: the site itself, not a person. */
const HOUSE_AUTHOR = "Editor eMIP";

type JsonLd = Record<string, unknown>;

/** Absolute URL for a site path; `origin` is the public site URL (server) or location.origin (browser). */
const abs = (origin: string, p: string) => new URL(p, `${origin}/`).href;

const organizationId = (origin: string) => abs(origin, "/#organization");

function organization(origin: string): JsonLd {
  return {
    "@type": "Organization",
    "@id": organizationId(origin),
    name: SITE_NAME,
    legalName: "EMIP SRL",
    url: abs(origin, "/"),
    logo: { "@type": "ImageObject", url: abs(origin, "/favicon.png"), width: 192, height: 192 },
    email: "office@emip.ro",
  };
}

/** Home page: who publishes the site, and the site's name for search results. */
export function homeJsonLd(origin: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization(origin),
      {
        "@type": "WebSite",
        "@id": abs(origin, "/#website"),
        name: SITE_NAME,
        url: abs(origin, "/"),
        inLanguage: "ro-RO",
        publisher: { "@id": organizationId(origin) },
      },
    ],
  };
}

/** A blog post as a BlogPosting, with its breadcrumb (Acasă › Blog › category › post). */
export function postJsonLd(post: PostSummary, category: Category | undefined, origin: string): JsonLd {
  const url = abs(origin, `/post/${encodeURIComponent(post.slug)}`);
  const crumbs: [string, string][] = [
    ["Acasă", abs(origin, "/")],
    ["Blog", abs(origin, "/blog")],
    ...(category ? [[category.label, abs(origin, `/blog/categories/${encodeURIComponent(category.slug)}`)] as [string, string]] : []),
    [post.title, url],
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization(origin),
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        mainEntityOfPage: url,
        headline: post.title,
        description: post.description || undefined,
        image: abs(origin, post.cover ?? DEFAULT_SHARE_IMAGE.path),
        datePublished: post.date,
        dateModified: post.updated ?? post.date,
        author: post.author === HOUSE_AUTHOR ? { "@id": organizationId(origin) } : { "@type": "Person", name: post.author },
        publisher: { "@id": organizationId(origin) },
        articleSection: category?.label,
        keywords: post.tags.length ? post.tags.join(", ") : undefined,
        inLanguage: "ro-RO",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
      },
    ],
  };
}

/** JSON for a <script type="application/ld+json">; "<" is escaped so the text can't close the tag. */
export const jsonLdText = (data: JsonLd) => JSON.stringify(data).replace(/</g, "\\u003c");
