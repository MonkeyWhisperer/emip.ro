import type { AiConversation, AiConversationPage, AiConversationTurn, AiSettings, AiSource, AiStatus } from "../../shared/ai";
import { ApiError } from "./api";
import { adminFetch, notifyUnauthorized } from "./adminApi";

// Typed client for the AI assistant admin endpoints (server/ai/routes.ts, mounted at /api/admin/ai).
// Like the rest of adminApi.ts, a 401 ApiError means the session expired; it is reported to the
// admin layout's session-expired handler, which sends the admin to the login page.

export type { AiConversation, AiConversationPage, AiConversationTurn, AiSettings, AiSource, AiStatus };

// ---- status & settings -----------------------------------------------------------------

/** Knowledge sources, settings, last site sync and today's usage. Poll while documents are processing. */
export const getAiStatus = () => adminFetch<AiStatus>("/admin/ai/status");

export const saveAiSettings = (settings: AiSettings) =>
  adminFetch<AiSettings>("/admin/ai/settings", { method: "PUT", json: settings });

// ---- training files ----------------------------------------------------------------------

/** Size limit of training files, as shown to the admin. */
export const MAX_TRAINING_LABEL = "20 MB";
export const MAX_TRAINING_BYTES = 20 * 1024 * 1024;
export const TRAINING_FILE_TYPES = ".pdf,.docx,.pptx,.txt,.md,.html,.json";

type UploadOptions = {
  /** Share of the file sent to the server, 0…1 (the server then forwards it to OpenAI). */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

/**
 * Uploads a training document; it is indexed in the background (status "processing" -> "ready").
 * Uses XMLHttpRequest rather than fetch() because only XHR reports upload progress.
 */
export function uploadTrainingFile(file: File, title?: string, { onProgress, signal }: UploadOptions = {}) {
  if (file.size > MAX_TRAINING_BYTES) {
    const error = `Fișierul depășește ${MAX_TRAINING_LABEL}.`;
    return Promise.reject(new ApiError(413, { error, fields: { file: error } }));
  }
  const form = new FormData();
  // OpenAI rejects upper-case extensions for search ("Files with extensions [.PDF] are not
  // supported for retrieval"), which is how scanners and older Windows tools name files.
  form.append("file", file, file.name.replace(/\.[^.]+$/, (ext) => ext.toLowerCase()));
  if (title) form.append("title", title);

  return new Promise<AiSource>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Încărcare anulată.", "AbortError"));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/ai/sources");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as AiSource);
        return;
      }
      if (xhr.status === 401) notifyUnauthorized();
      reject(new ApiError(xhr.status, (body ?? {}) as ConstructorParameters<typeof ApiError>[1]));
    };
    // Same error type as a failed fetch(), so errorMessage() reports a connection problem.
    xhr.onerror = () => reject(new TypeError("Failed to fetch"));
    xhr.onabort = () => reject(new DOMException("Încărcare anulată.", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}

export const retryAiSource = (id: number) => adminFetch<AiSource>(`/admin/ai/sources/${id}/retry`, { method: "POST" });

export const deleteAiSource = (id: number) => adminFetch<{ ok: true }>(`/admin/ai/sources/${id}`, { method: "DELETE" });

/**
 * Switches sources off (the assistant no longer uses them) or back on (they are indexed again in
 * the background). Returns the updated sources.
 */
export const setAiSourcesExcluded = (ids: number[], excluded: boolean) =>
  adminFetch<AiSource[]>("/admin/ai/sources/excluded", { method: "POST", json: { ids, excluded } });

/** Re-indexes site pages and published posts (only changed ones are uploaded). Returns immediately. */
export const syncSiteKnowledge = () => adminFetch<{ ok: true }>("/admin/ai/sync-site", { method: "POST" });

// ---- conversation log ----------------------------------------------------------------------

/** Visitor conversations (all turns of one chat session), most recently active first; paginated by conversation. */
export const listAiConversations = (limit = 20, offset = 0) =>
  adminFetch<AiConversationPage>(`/admin/ai/conversations?limit=${limit}&offset=${offset}`);

/** Deletes a whole conversation (every turn of it). `id` is AiConversation.id and may contain any character. */
export const deleteAiConversation = (id: string) =>
  adminFetch<{ ok: true }>(`/admin/ai/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });

export const clearAiConversations = () => adminFetch<{ deleted: number }>("/admin/ai/conversations", { method: "DELETE" });
