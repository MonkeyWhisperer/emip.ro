import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { AiStatus } from "../../shared/ai.ts";
import { ValidationError, objectBody } from "../validate.ts";
import { DAILY_TOKEN_LIMIT, clearConversations, deleteConversation, listConversations, tokensToday, usageToday } from "./chat.ts";
import { getSettings, saveSettings } from "./settings.ts";
import {
  AI_MODEL,
  MAX_TRAINING_BYTES,
  addTrainingFile,
  lastSiteSync,
  listSources,
  openai,
  refreshProcessing,
  removeSource,
  retrySource,
  setSourcesExcluded,
  siteSyncRunning,
  syncSite,
} from "./knowledge.ts";

// Admin endpoints for the AI assistant, mounted at /api/admin/ai behind requireAdmin.
export const adminAi = new Hono();

const requireKey = () => {
  if (!openai) throw new ValidationError({ openai: "OPENAI_API_KEY nu este configurată pe server." });
};

adminAi.get("/status", async (c) => {
  await refreshProcessing().catch((err) => console.error("[ai] status refresh failed", err));
  const status: AiStatus = {
    configured: !!openai,
    model: AI_MODEL,
    settings: getSettings(),
    sources: listSources(),
    lastSiteSync: lastSiteSync(),
    siteSyncRunning: siteSyncRunning(),
    usageToday: usageToday(),
    tokensToday: tokensToday(),
    dailyTokenLimit: DAILY_TOKEN_LIMIT,
  };
  return c.json(status);
});

adminAi.put("/settings", bodyLimit({ maxSize: 20_000 }), async (c) => {
  const before = getSettings();
  const settings = saveSettings(await c.req.json());
  // Site content was skipped while switched off; bring it up to date when it is switched back on.
  if (settings.useSiteContent && !before.useSiteContent && openai) void syncSite();
  return c.json(settings);
});

adminAi.post("/sources", bodyLimit({ maxSize: MAX_TRAINING_BYTES + 100_000 }), async (c) => {
  requireKey();
  const form = await c.req.parseBody();
  if (!(form.file instanceof File)) throw new ValidationError({ file: "Niciun fișier trimis." });
  const title = typeof form.title === "string" ? form.title : undefined;
  return c.json(await addTrainingFile(form.file, title), 201);
});

adminAi.post("/sources/:id{[0-9]+}/retry", async (c) => {
  requireKey();
  const source = await retrySource(Number(c.req.param("id")));
  return source ? c.json(source) : c.json({ error: "Sursa nu a fost găsită." }, 404);
});

/**
 * Switches sources off or back on: { ids: number[], excluded: boolean }. Excluded sources leave the
 * vector store (answers never use them) but stay listed; the response lists the updated sources.
 */
adminAi.post("/sources/excluded", bodyLimit({ maxSize: 20_000 }), async (c) => {
  requireKey();
  const body = objectBody(await c.req.json());
  const { ids, excluded } = body;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 1000 || !ids.every((id) => Number.isSafeInteger(id) && id > 0)) {
    throw new ValidationError({ ids: "Lista de surse este invalidă." });
  }
  if (typeof excluded !== "boolean") throw new ValidationError({ excluded: "Valoare invalidă." });
  return c.json(await setSourcesExcluded(ids as number[], excluded));
});

adminAi.delete("/sources/:id{[0-9]+}", async (c) =>
  (await removeSource(Number(c.req.param("id")))) ? c.json({ ok: true }) : c.json({ error: "Sursa nu a fost găsită." }, 404),
);

/** Starts a sync of site pages and published posts; poll /status for progress. */
adminAi.post("/sync-site", (c) => {
  requireKey();
  void syncSite();
  return c.json({ ok: true }, 202);
});

/** An integer query parameter clamped to [min, max]; missing or malformed values give `fallback`. */
const intParam = (raw: string | undefined, fallback: number, min: number, max: number) => {
  const n = Math.trunc(Number(raw ?? fallback));
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
};

/** Paginated by conversation (not by message): ?limit=20&offset=0. */
adminAi.get("/conversations", (c) => {
  const limit = intParam(c.req.query("limit"), 20, 1, 100);
  const offset = intParam(c.req.query("offset"), 0, 0, 1_000_000);
  return c.json(listConversations(limit, offset));
});

// Ids are session ids or "single:<turn id>"; clients send them through encodeURIComponent
// (":" arrives as %3A, which the router does not decode, so "%" is part of the pattern).
adminAi.delete("/conversations/:id{[\\w:%-]{1,200}}", (c) =>
  deleteConversation(c.req.param("id")) ? c.json({ ok: true }) : c.json({ error: "Conversația nu a fost găsită." }, 404),
);

adminAi.delete("/conversations", (c) => c.json({ deleted: clearConversations() }));
