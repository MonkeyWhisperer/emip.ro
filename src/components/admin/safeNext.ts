export const ADMIN_HOME = "/admin";
export const LOGIN_PATH = "/admin/login";

/**
 * Returns `next` if it is a same-site path inside the admin panel, otherwise "/admin".
 * Guards the post-login redirect against open redirects ("//evil.com", "/\evil.com",
 * "https://…", control characters) and path tricks ("/admin/../x", "/admin/%2e%2e/x").
 */
export function safeAdminPath(next: string | null | undefined, origin = window.location.origin): string {
  if (!next || next.length > 2000) return ADMIN_HOME;
  // Must be a plain absolute path: no scheme, no protocol-relative "//", no backslashes,
  // no control characters (browsers strip tabs/newlines, turning "/\t/x" into "//x").
  if (!next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) return ADMIN_HOME;
  // Dot segments and encoded dots/slashes have no business in admin URLs; refuse instead of guessing.
  if (/%2e|%2f|%5c/i.test(next) || /\/\.{1,2}(?=[/?#]|$)/.test(next)) return ADMIN_HOME;

  let url: URL;
  try {
    url = new URL(next, origin);
  } catch {
    return ADMIN_HOME;
  }
  if (url.origin !== new URL(origin).origin) return ADMIN_HOME;

  // URL() has resolved any "." / ".." segments, so this checks where the browser would really go.
  const path = url.pathname;
  if (path !== ADMIN_HOME && !path.startsWith(`${ADMIN_HOME}/`)) return ADMIN_HOME;
  if (path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}/`)) return ADMIN_HOME;
  return `${path}${url.search}${url.hash}`;
}

/** Login URL that brings the user back to `path` afterwards. */
export function loginUrl(path: string, expired = false) {
  const params = new URLSearchParams();
  const next = safeAdminPath(path);
  if (next !== ADMIN_HOME) params.set("next", next);
  if (expired) params.set("expired", "1");
  const query = params.toString();
  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}
