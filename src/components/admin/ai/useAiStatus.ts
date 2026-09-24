import { useCallback, useEffect, useRef, useState } from "react";
import type { AiStatus } from "../../../../shared/ai";
import { getAiStatus } from "../../../lib/aiAdminApi";
import { errorMessage, isUnauthorized } from "../ui";
import { isIndexing } from "./shared";

const POLL_MS = 3000;
/** After this long of continuous indexing (a big sync, a slow file) poll less often. */
const SLOW_AFTER_MS = 2 * 60 * 1000;
const SLOW_POLL_MS = 10_000;

/** True while the knowledge base is changing: a site sync or documents still being indexed. */
const isBusy = (status: AiStatus | null) =>
  !!status && (status.siteSyncRunning || status.sources.some((s) => isIndexing(s, status.siteSyncRunning)));

/**
 * Loads GET /api/admin/ai/status and keeps it fresh: polls every ~3 s while anything is
 * pending / processing or a site sync runs, stops when idle or on unmount, skips polls
 * while the browser tab is hidden and refreshes once when it becomes visible again.
 */
export function useAiStatus() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** The last background refresh failed (the data shown may be out of date). */
  const [stale, setStale] = useState(false);
  const mounted = useRef(true);
  const hasStatus = useRef(false);
  // Responses can arrive out of order (a poll and a refresh after an action): apply only the newest.
  const issued = useRef(0);
  const applied = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async (): Promise<AiStatus | null> => {
    const id = ++issued.current;
    try {
      const next = await getAiStatus();
      if (!mounted.current || id < applied.current) return null;
      applied.current = id;
      hasStatus.current = true;
      setStatus(next);
      setError(null);
      setStale(false);
      return next;
    } catch (err) {
      // 401: the admin layout is already on its way to the login page.
      if (!mounted.current || isUnauthorized(err)) return null;
      if (hasStatus.current) setStale(true);
      else setError(errorMessage(err, "Nu am putut încărca starea asistentului."));
      return null;
    }
  }, []);

  /** Local update after an action; responses to requests sent before it are ignored. */
  const patch = useCallback((fn: (status: AiStatus) => AiStatus) => {
    applied.current = ++issued.current;
    setStatus((s) => (s ? fn(s) : s));
  }, []);

  const retry = useCallback(() => {
    setError(null);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const busy = isBusy(status);
  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    let cancelled = false;
    let timer: number | undefined;
    const schedule = () => {
      timer = window.setTimeout(tick, Date.now() - started > SLOW_AFTER_MS ? SLOW_POLL_MS : POLL_MS);
    };
    const tick = async () => {
      if (!document.hidden) await refresh();
      if (!cancelled) schedule();
    };
    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [busy, refresh]);

  // Back to this browser tab: the knowledge base may have changed meanwhile (blog edits sync on their own).
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && hasStatus.current) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return { status, error, stale, busy, refresh, patch, retry };
}
