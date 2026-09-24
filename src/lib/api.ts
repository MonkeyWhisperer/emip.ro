import type { ApiErrorBody } from "../../shared/blog";

export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;
  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.error ?? `Eroare ${status}`);
    this.status = status;
    this.fields = body.fields ?? {};
  }
}

/** fetch() for the JSON API: sends cookies, throws ApiError on non-2xx responses. */
export async function apiFetch<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...rest,
    headers: {
      Accept: "application/json",
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body ?? {});
  return body as T;
}
