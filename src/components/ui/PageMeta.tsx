import { useEffect } from "react";
import { useLocation } from "react-router";
import { DEFAULT_SHARE_IMAGE, SITE_NAME, jsonLdText } from "../../../shared/seo";

type Props = {
  title: string;
  description?: string;
  /** Site path or absolute URL; og:image must be absolute for link previews. Defaults to the site's share image. */
  image?: string;
  imageAlt?: string;
  /** Blog posts: og:type "article" with its dates (YYYY-MM-DD). */
  article?: { published: string; modified: string };
  /** schema.org structured data, built from the page's origin (shared/seo.ts). */
  jsonLd?: (origin: string) => Record<string, unknown>;
};

function absoluteUrl(url: string) {
  try {
    return new URL(url, location.origin).href;
  } catch {
    return undefined; // malformed URL, or no browser (server-side text export): leave the tag out
  }
}

/**
 * React 19 hoists these tags into <head>. Every page renders one. The server injects the same
 * tags for the first load (link previews, crawlers; server/siteRoutes.ts serverMetaTags); main.tsx
 * removes those, so this component owns them from then on, including the canonical URL of the
 * current page.
 */
export function PageMeta({ title, description, image, imageAlt, article, jsonLd }: Props) {
  const { pathname } = useLocation();
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const imageUrl = absoluteUrl(image ?? DEFAULT_SHARE_IMAGE.path);
  const imageAltText = image ? imageAlt : DEFAULT_SHARE_IMAGE.alt;
  const pageUrl = absoluteUrl(pathname);

  // React 19 hoists <title>, <meta> and <link> but not inline scripts, so the JSON-LD goes into
  // <head> from an effect, which also takes it out when the page changes.
  const ld = jsonLd && typeof location !== "undefined" ? jsonLdText(jsonLd(location.origin)) : undefined;
  useEffect(() => {
    if (!ld) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = ld;
    document.head.appendChild(script);
    return () => script.remove();
  }, [ld]);

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {pageUrl && <link rel="canonical" href={pageUrl} />}
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      <meta property="og:type" content={article ? "article" : "website"} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {!image && <meta property="og:image:width" content={String(DEFAULT_SHARE_IMAGE.width)} />}
      {!image && <meta property="og:image:height" content={String(DEFAULT_SHARE_IMAGE.height)} />}
      {imageAltText && <meta property="og:image:alt" content={imageAltText} />}
      <meta name="twitter:card" content="summary_large_image" />
      {article && <meta property="article:published_time" content={article.published} />}
      {article && <meta property="article:modified_time" content={article.modified} />}
    </>
  );
}
