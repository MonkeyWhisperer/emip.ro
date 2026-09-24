import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** Static files served next to the app (PDFs, uploads, migrated media) are not router routes. */
const isFile = (href: string) =>
  /^\/(docs|media)\//.test(href) || /\.(pdf|zip|docx?|xlsx?|pptx?|jpe?g|png|gif|webp|avif|mp4)(\?|#|$)/i.test(href);

/**
 * The href as a browser reads it: URL parsing drops tabs and newlines anywhere and leading
 * spaces/control characters, so "/\t/host" is really "//host".
 */
const normalize = (href: string) => href.replace(/[\t\n\r]/g, "").replace(/^[\u0000- ]+/, "");

// "//host" and "/\host" (also "\\host", "\/host") are protocol-relative URLs to another site.
const isProtocolRelative = (href: string) => /^[/\\]{2}/.test(href);

const isRoute = (href: string) => /^\/(?![/\\])/.test(href) && !isFile(href);

/** Uses client-side routing for app pages and a plain anchor for everything else. */
export function SmartLink({ href, children, ...rest }: Props) {
  const url = normalize(href);
  if (isRoute(url)) {
    return (
      <Link to={url} {...rest}>
        {children}
      </Link>
    );
  }

  // Other sites (including protocol-relative links) and files open in a new tab, without opener.
  const opensNewTab = /^https?:\/\//i.test(url) || isProtocolRelative(url) || isFile(url);
  return (
    <a href={href} {...(opensNewTab && { target: "_blank", rel: "noopener noreferrer" })} {...rest}>
      {children}
    </a>
  );
}
