import type { Category, Post, PostInput, PostSummary, UploadResult } from "../../shared/blog";
import type { Submission, SubmissionKind } from "../../shared/forms";
import { ApiError, apiFetch } from "./api";
import { invalidateBlogCache } from "./blog";

// Typed client for the admin endpoints in server/app.ts. Every call requires the
// session cookie set by login(); a 401 ApiError means the session expired.

// ---- session expiry --------------------------------------------------------------
// The admin layout registers a handler that sends the user back to the login page
// whenever an admin call answers 401. Auth calls (session/login/logout) are exempt:
// for them a 401 is an expected answer, not an expired session.

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | undefined;

/** Registers the 401 handler; returns a function that unregisters it. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler;
  return () => {
    if (onUnauthorized === handler) onUnauthorized = undefined;
  };
}

/**
 * Reports an expired session to the admin layout (which sends the admin to the login page).
 * For admin requests that do not go through adminFetch, e.g. an XMLHttpRequest upload.
 */
export function notifyUnauthorized() {
  onUnauthorized?.();
}

/** apiFetch() for admin endpoints: a 401 answer also reports the expired session. */
export async function adminFetch<T>(path: string, init?: Parameters<typeof apiFetch>[1]): Promise<T> {
  try {
    return await apiFetch<T>(path, init);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) notifyUnauthorized();
    throw err;
  }
}

// ---- auth --------------------------------------------------------------------------

export const getSession = () => apiFetch<{ email: string }>("/auth/session");

export const login = (email: string, password: string) =>
  apiFetch<{ email: string }>("/auth/login", { method: "POST", json: { email, password } });

export const logout = () => apiFetch<{ ok: true }>("/auth/logout", { method: "POST" });

// ---- public caches -------------------------------------------------------------------
// The public endpoints send Cache-Control: max-age=60, so after an edit this browser would
// keep showing the old post / list (in the preview tab, on /blog) for up to a minute.
// Besides the in-memory cache, re-fetch those URLs with cache: "reload", which replaces
// (or, for a draft / deleted post, drops) the browser's cached copy.

const publicPostPath = (slug: string) => `/api/posts/${encodeURIComponent(slug)}`;

async function refreshPublicCache(paths: string[]) {
  invalidateBlogCache();
  await Promise.allSettled(
    [...new Set(paths)].map((path) => fetch(path, { cache: "reload", credentials: "same-origin", headers: { Accept: "application/json" } })),
  );
}

// ---- posts -------------------------------------------------------------------------

export const listAdminPosts = () => adminFetch<PostSummary[]>("/admin/posts");

export const getAdminPost = (id: number) => adminFetch<Post>(`/admin/posts/${id}`);

export async function createPost(input: PostInput) {
  const post = await adminFetch<Post>("/admin/posts", { method: "POST", json: input });
  await refreshPublicCache(["/api/posts", publicPostPath(post.slug)]);
  return post;
}

/** `previousSlug`: the slug before this save, so a cached copy at the old address is dropped too. */
export async function updatePost(id: number, input: PostInput, previousSlug?: string) {
  const post = await adminFetch<Post>(`/admin/posts/${id}`, { method: "PUT", json: input });
  await refreshPublicCache(["/api/posts", publicPostPath(post.slug), ...(previousSlug ? [publicPostPath(previousSlug)] : [])]);
  return post;
}

export async function deletePost(id: number, slug?: string) {
  await adminFetch<{ ok: true }>(`/admin/posts/${id}`, { method: "DELETE" });
  await refreshPublicCache(["/api/posts", ...(slug ? [publicPostPath(slug)] : [])]);
}

// ---- categories --------------------------------------------------------------------

export const listAdminCategories = () => adminFetch<Category[]>("/admin/categories");

export async function createCategory(category: Category) {
  const result = await adminFetch<Category>("/admin/categories", { method: "POST", json: category });
  await refreshPublicCache(["/api/categories"]);
  return result;
}

export async function updateCategory(slug: string, category: Omit<Category, "slug">) {
  const result = await adminFetch<Category>(`/admin/categories/${encodeURIComponent(slug)}`, {
    method: "PUT",
    json: category,
  });
  await refreshPublicCache(["/api/categories"]);
  return result;
}

export async function deleteCategory(slug: string) {
  await adminFetch<{ ok: true }>(`/admin/categories/${encodeURIComponent(slug)}`, { method: "DELETE" });
  // Deleting a category also removes it from the posts that used it.
  await refreshPublicCache(["/api/categories", "/api/posts"]);
}

// ---- form submissions --------------------------------------------------------------

/** Contact-form messages and newsletter sign-ups, newest first. */
export const listSubmissions = (kind?: SubmissionKind) =>
  adminFetch<Submission[]>(`/admin/submissions${kind ? `?kind=${kind}` : ""}`);

export const markSubmissionRead = (id: number, read: boolean) =>
  adminFetch<{ ok: true }>(`/admin/submissions/${id}`, { method: "PATCH", json: { read } });

export const deleteSubmission = (id: number) =>
  adminFetch<{ ok: true }>(`/admin/submissions/${id}`, { method: "DELETE" });

// ---- uploads -----------------------------------------------------------------------

/** Size limit of blog uploads, as shown to the admin (e.g. in errorMessage(err, …, { uploadLimit })). */
export const MAX_UPLOAD_LABEL = "15 MB";
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const IMAGE_TYPES = ".jpg,.jpeg,.png,.gif,.webp,.avif";
export const DOCUMENT_TYPES = ".pdf,.zip,.docx,.xlsx,.pptx";

/** Images (jpg, png, gif, webp, avif) and documents (pdf, zip, docx, xlsx, pptx), max 15 MB. */
export function uploadFile(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    const error = `Fișierul depășește ${MAX_UPLOAD_LABEL}.`;
    return Promise.reject(new ApiError(413, { error, fields: { file: error } }));
  }
  const form = new FormData();
  form.append("file", file);
  return adminFetch<UploadResult>("/admin/uploads", { method: "POST", body: form });
}
