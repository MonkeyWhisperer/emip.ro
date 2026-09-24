import { useLocation } from "react-router";

const SITE_NAME = "Platforma eMIP";

type Props = {
  title: string;
  description?: string;
  /** Site path or absolute URL; og:image must be absolute for link previews. */
  image?: string;
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
 * tags for the first load (link previews, crawlers); main.tsx removes those, so this component
 * owns them from then on, including the canonical URL of the current page.
 */
export function PageMeta({ title, description, image }: Props) {
  const { pathname } = useLocation();
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const imageUrl = image && absoluteUrl(image);
  const pageUrl = absoluteUrl(pathname);
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {pageUrl && <link rel="canonical" href={pageUrl} />}
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
    </>
  );
}
