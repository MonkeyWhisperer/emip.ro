import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI, { toFile } from "openai";
import type { AiSource, AiSourceKind } from "../../shared/ai.ts";
import { DATA_DIR, db, getMeta, listPosts, getPostById, setMeta } from "../db.ts";
import { SITE_URL, readSitePages } from "../siteRoutes.ts";
import { ValidationError } from "../validate.ts";
import { getSettings } from "./settings.ts";

// Knowledge base for the site assistant: an OpenAI vector store (searched with the
// file_search tool) fed with admin-uploaded files and the site's own pages and posts.
// ai_sources mirrors what is in the store so the admin panel can show and manage it.

export const AI_MODEL = process.env.OPENAI_MODEL ?? "gpt-6-luna";
export const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const AI_UPLOADS_DIR = path.join(DATA_DIR, "ai-uploads");

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_sources (
    id             INTEGER PRIMARY KEY,
    kind           TEXT NOT NULL CHECK (kind IN ('upload', 'page', 'post')),
    key            TEXT NOT NULL UNIQUE,
    title          TEXT NOT NULL,
    url            TEXT,
    filename       TEXT NOT NULL,
    bytes          INTEGER NOT NULL,
    hash           TEXT NOT NULL,
    openai_file_id TEXT,
    status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    error          TEXT,
    local_path     TEXT,
    updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
  -- Sources the admin switched off: kept out of the vector store, so answers never use them.
  -- By key (page:/path, post:id, upload:uuid) and in their own table, so the choice survives
  -- site syncs, a page that disappears and comes back, and npm run ai:reset.
  CREATE TABLE IF NOT EXISTS ai_excluded (
    key TEXT PRIMARY KEY
  );
`);

const isExcluded = (key: string) => !!db.prepare("SELECT 1 FROM ai_excluded WHERE key = ?").get(key);

type SourceRow = {
  id: number;
  kind: AiSourceKind;
  key: string;
  title: string;
  url: string | null;
  filename: string;
  bytes: number;
  hash: string;
  openai_file_id: string | null;
  status: AiSource["status"];
  error: string | null;
  local_path: string | null;
  updated_at: string;
  /** 1 when the key is in ai_excluded (only set by queries that join it). */
  is_excluded?: number;
};

const toSource = (r: SourceRow): AiSource => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  url: r.url,
  filename: r.filename,
  bytes: r.bytes,
  status: r.status,
  error: r.error,
  updatedAt: r.updated_at,
  excluded: r.is_excluded === 1,
});

const sha256 = (data: Buffer | string) => createHash("sha256").update(data).digest("hex");

const SELECT_SOURCES = "SELECT s.*, e.key IS NOT NULL AS is_excluded FROM ai_sources s LEFT JOIN ai_excluded e ON e.key = s.key";

export function listSources(): AiSource[] {
  const rows = db.prepare(`${SELECT_SOURCES} ORDER BY s.kind, s.title`).all() as SourceRow[];
  return rows.map(toSource);
}

/** Whether any indexed document (optionally only of the given kinds) can be searched. */
export function hasReadySources(kinds?: readonly AiSourceKind[]): boolean {
  if (!kinds) return !!db.prepare("SELECT 1 FROM ai_sources WHERE status = 'ready' LIMIT 1").get();
  const placeholders = kinds.map(() => "?").join(",");
  return !!db.prepare(`SELECT 1 FROM ai_sources WHERE status = 'ready' AND kind IN (${placeholders}) LIMIT 1`).get(...kinds);
}

/** Maps OpenAI file ids (from citations) back to titles and URLs. */
export function sourcesByFileIds(fileIds: string[]) {
  if (!fileIds.length) return [];
  const rows = db
    .prepare(`SELECT title, url FROM ai_sources WHERE openai_file_id IN (${fileIds.map(() => "?").join(",")})`)
    .all(...fileIds) as { title: string; url: string | null }[];
  return rows;
}

// ---- vector store -------------------------------------------------------------------

let storeIdPromise: Promise<string> | undefined;

export function vectorStoreId(): Promise<string> {
  if (!openai) return Promise.reject(new Error("OPENAI_API_KEY is not configured"));
  storeIdPromise ??= (async () => {
    const existing = getMeta("ai_vector_store_id");
    if (existing) {
      try {
        await openai.vectorStores.retrieve(existing);
        return existing;
      } catch (err) {
        if (!(err instanceof OpenAI.NotFoundError)) throw err;
        // Store was deleted on the OpenAI side: everything must be uploaded again.
        db.exec("UPDATE ai_sources SET openai_file_id = NULL, status = 'pending'");
      }
    }
    const store = await openai.vectorStores.create({ name: "emip-site-knowledge" });
    setMeta("ai_vector_store_id", store.id);
    return store.id;
  })().catch((err) => {
    storeIdPromise = undefined;
    throw err;
  });
  return storeIdPromise;
}

/** The store id if one exists and has searchable content (of the given kinds), without creating anything. */
export function searchableStoreId(kinds?: readonly AiSourceKind[]): string | null {
  const id = getMeta("ai_vector_store_id");
  return id && hasReadySources(kinds) ? id : null;
}

async function removeRemote(fileId: string | null) {
  if (!openai || !fileId) return;
  const storeId = getMeta("ai_vector_store_id");
  const ignoreMissing = (err: unknown) => {
    if (!(err instanceof OpenAI.NotFoundError)) throw err;
  };
  if (storeId) await openai.vectorStores.files.delete(fileId, { vector_store_id: storeId }).catch(ignoreMissing);
  await openai.files.delete(fileId).catch(ignoreMissing);
}

async function waitUntilIndexed(id: number, fileId: string) {
  if (!openai) return;
  try {
    const result = await openai.vectorStores.files.poll(await vectorStoreId(), fileId, { pollIntervalMs: 2000 });
    const ok = result.status === "completed";
    db.prepare("UPDATE ai_sources SET status = ?, error = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? AND openai_file_id = ?").run(
      ok ? "ready" : "failed",
      ok ? null : (result.last_error?.message ?? `Indexare eșuată (${result.status}).`),
      id,
      fileId,
    );
  } catch (err) {
    db.prepare("UPDATE ai_sources SET status = 'failed', error = ? WHERE id = ? AND openai_file_id = ?").run(
      errorMessage(err),
      id,
      fileId,
    );
  }
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 500);

type Doc = { kind: AiSourceKind; key: string; title: string; url: string | null; filename: string; content: Buffer; localPath?: string };

/**
 * Adds or replaces one document in the vector store. Unchanged documents that are
 * already indexed are skipped. Indexing continues in the background.
 */
async function upsertDocument(doc: Doc): Promise<AiSource> {
  if (!openai) throw new Error("OPENAI_API_KEY is not configured");
  const existing = db.prepare("SELECT * FROM ai_sources WHERE key = ?").get(doc.key) as SourceRow | undefined;
  if (isExcluded(doc.key)) return keepOutOfStore(doc, existing);
  const hash = sha256(doc.content);
  // "pending" with a file id means an earlier upload stopped half-way: upload again.
  if (existing && existing.hash === hash && existing.openai_file_id && (existing.status === "ready" || existing.status === "processing")) {
    if (existing.title !== doc.title || existing.url !== doc.url) {
      db.prepare("UPDATE ai_sources SET title = ?, url = ? WHERE id = ?").run(doc.title, doc.url, existing.id);
    }
    return toSource({ ...existing, title: doc.title, url: doc.url });
  }

  const storeId = await vectorStoreId();
  await removeRemote(existing?.openai_file_id ?? null);
  const row = db
    .prepare(
      `INSERT INTO ai_sources (kind, key, title, url, filename, bytes, hash, status, local_path)
       VALUES (:kind, :key, :title, :url, :filename, :bytes, :hash, 'pending', :local_path)
       ON CONFLICT (key) DO UPDATE SET title = excluded.title, url = excluded.url, filename = excluded.filename,
         bytes = excluded.bytes, hash = excluded.hash, status = 'pending', error = NULL, openai_file_id = NULL,
         local_path = COALESCE(excluded.local_path, ai_sources.local_path), updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
       RETURNING *`,
    )
    .get({
      kind: doc.kind,
      key: doc.key,
      title: doc.title,
      url: doc.url,
      filename: doc.filename,
      bytes: doc.content.length,
      hash,
      local_path: doc.localPath ?? null,
    }) as SourceRow;

  let fileId: string | null = null;
  try {
    // OpenAI's retrieval rejects upper-case extensions (".PDF", ".MD"), so normalise the name it sees.
    const uploadName = doc.filename.replace(/\.[^.]+$/, (ext) => ext.toLowerCase());
    const file = await openai.files.create({ file: await toFile(doc.content, uploadName), purpose: "assistants" });
    fileId = file.id;
    // Recorded at once, so the file can always be found and deleted later (removeSource,
    // retry, ai-reset) even if adding it to the vector store fails or the process stops.
    db.prepare("UPDATE ai_sources SET openai_file_id = ? WHERE id = ?").run(fileId, row.id);
    await openai.vectorStores.files.create(storeId, {
      file_id: fileId,
      attributes: { kind: doc.kind, title: doc.title.slice(0, 500), url: doc.url ?? "" },
    });
    // Excluded by the admin while this upload was under way (a sync in progress): take it out again.
    if (isExcluded(doc.key)) return keepOutOfStore(doc, { ...row, openai_file_id: fileId });
    db.prepare("UPDATE ai_sources SET status = 'processing' WHERE id = ?").run(row.id);
    void waitUntilIndexed(row.id, fileId);
    return toSource({ ...row, openai_file_id: fileId, status: "processing" });
  } catch (err) {
    // Don't leave an orphan file at OpenAI; if deleting fails too, the recorded id lets a
    // later retry, delete or ai-reset clean it up.
    if (fileId) {
      try {
        await removeRemote(fileId);
        db.prepare("UPDATE ai_sources SET openai_file_id = NULL WHERE id = ? AND openai_file_id = ?").run(row.id, fileId);
      } catch (cleanupErr) {
        console.error("[ai] could not delete orphan file", fileId, cleanupErr);
      }
    }
    db.prepare("UPDATE ai_sources SET status = 'failed', error = ? WHERE id = ?").run(errorMessage(err), row.id);
    return toSource({ ...row, status: "failed", error: errorMessage(err) });
  }
}

/**
 * An excluded document: listed in the admin panel (so it can be switched back on) but not in the
 * vector store. The empty hash makes it upload again once it is included.
 */
async function keepOutOfStore(doc: Doc, existing: SourceRow | undefined): Promise<AiSource> {
  await removeRemote(existing?.openai_file_id ?? null);
  const row = db
    .prepare(
      `INSERT INTO ai_sources (kind, key, title, url, filename, bytes, hash, status, local_path)
       VALUES (:kind, :key, :title, :url, :filename, :bytes, '', 'pending', :local_path)
       ON CONFLICT (key) DO UPDATE SET title = excluded.title, url = excluded.url, filename = excluded.filename,
         bytes = excluded.bytes, hash = '', status = 'pending', error = NULL, openai_file_id = NULL,
         local_path = COALESCE(excluded.local_path, ai_sources.local_path)
       RETURNING *`,
    )
    .get({
      kind: doc.kind,
      key: doc.key,
      title: doc.title,
      url: doc.url,
      filename: doc.filename,
      bytes: doc.content.length,
      local_path: doc.localPath ?? null,
    }) as SourceRow;
  return toSource({ ...row, is_excluded: 1 });
}

/**
 * Switches sources off (out of the vector store) or back on. Included uploads are re-sent from
 * their local copy and included pages and posts with a site sync, both in the background.
 */
export async function setSourcesExcluded(ids: number[], exclude: boolean): Promise<AiSource[]> {
  const rows = ids
    .map((id) => db.prepare("SELECT * FROM ai_sources WHERE id = ?").get(id) as SourceRow | undefined)
    .filter((r): r is SourceRow => !!r);
  for (const row of rows) {
    if (exclude) {
      db.prepare("INSERT OR IGNORE INTO ai_excluded (key) VALUES (?)").run(row.key);
      await removeRemote(row.openai_file_id);
      db.prepare("UPDATE ai_sources SET openai_file_id = NULL, hash = '', status = 'pending', error = NULL WHERE id = ?").run(row.id);
    } else {
      db.prepare("DELETE FROM ai_excluded WHERE key = ?").run(row.key);
    }
  }
  if (!exclude && openai) {
    for (const row of rows.filter((r) => r.kind === "upload")) {
      void retrySource(row.id).catch((err) =>
        db.prepare("UPDATE ai_sources SET status = 'failed', error = ? WHERE id = ?").run(errorMessage(err), row.id),
      );
    }
    // With site content switched off, pages and posts are uploaded when it is switched back on.
    if (rows.some((r) => r.kind !== "upload") && getSettings().useSiteContent) void syncSite();
  }
  const changed = new Set(rows.map((r) => r.id));
  return listSources().filter((s) => changed.has(s.id));
}

export async function removeSource(id: number): Promise<boolean> {
  const row = db.prepare("SELECT * FROM ai_sources WHERE id = ?").get(id) as SourceRow | undefined;
  if (!row) return false;
  await removeRemote(row.openai_file_id);
  db.prepare("DELETE FROM ai_sources WHERE id = ?").run(id);
  // An upload's key is never reused; a page's or post's exclusion must outlive a sync that drops it.
  if (row.kind === "upload") db.prepare("DELETE FROM ai_excluded WHERE key = ?").run(row.key);
  if (row.local_path) await rm(row.local_path, { force: true });
  return true;
}

let lastRefresh = 0;

/**
 * Re-checks documents still being indexed after a restart killed their background poll
 * (waitUntilIndexed). Called by the admin status endpoint, which is polled every few seconds:
 * runs at most every 30 s and only looks at rows that have been processing for 2+ minutes,
 * since a live poll is still handling the newer ones.
 */
export async function refreshProcessing() {
  if (!openai) return;
  const storeId = getMeta("ai_vector_store_id");
  if (!storeId || Date.now() - lastRefresh < 30_000) return;
  lastRefresh = Date.now();
  const rows = db
    .prepare("SELECT id, openai_file_id FROM ai_sources WHERE status = 'processing' AND updated_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-2 minutes')")
    .all() as {
    id: number;
    openai_file_id: string;
  }[];
  await Promise.all(
    rows.map(async (r) => {
      try {
        const f = await openai.vectorStores.files.retrieve(r.openai_file_id, { vector_store_id: storeId });
        if (f.status === "completed") db.prepare("UPDATE ai_sources SET status = 'ready', error = NULL WHERE id = ?").run(r.id);
        else if (f.status === "failed" || f.status === "cancelled")
          db.prepare("UPDATE ai_sources SET status = 'failed', error = ? WHERE id = ?").run(f.last_error?.message ?? f.status, r.id);
      } catch (err) {
        if (err instanceof OpenAI.NotFoundError) db.prepare("UPDATE ai_sources SET status = 'failed', error = 'Fișierul nu mai există în OpenAI.' WHERE id = ?").run(r.id);
      }
    }),
  );
}

// ---- uploaded training files -----------------------------------------------------------

export const MAX_TRAINING_BYTES = 20 * 1024 * 1024;

// Formats the file_search tool can read. Office/PDF files are checked by signature,
// text formats must be valid UTF-8.
const TRAINING_TYPES: Record<string, "pdf" | "zip" | "text"> = {
  pdf: "pdf",
  docx: "zip",
  pptx: "zip",
  txt: "text",
  md: "text",
  html: "text",
  json: "text",
};
export const TRAINING_EXTENSIONS = Object.keys(TRAINING_TYPES);

/**
 * Office Open XML check: a ZIP local-file header, the package's [Content_Types].xml and the
 * main part of the document type. (Part names are stored uncompressed in ZIP headers.)
 */
function isOfficeFile(bytes: Buffer, ext: string): boolean {
  const mainPart = ext === "docx" ? "word/document.xml" : ext === "pptx" ? "ppt/presentation.xml" : null;
  return (
    !!mainPart &&
    bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) &&
    bytes.includes("[Content_Types].xml", 0, "latin1") &&
    bytes.includes(mainPart, 0, "latin1")
  );
}

export async function addTrainingFile(file: File, title?: string): Promise<AiSource> {
  const ext = path.extname(file.name).slice(1).toLowerCase();
  const kind = TRAINING_TYPES[ext];
  if (!kind) throw new ValidationError({ file: `Tip de fișier nepermis (.${ext || "?"}). Permise: ${TRAINING_EXTENSIONS.join(", ")}.` });
  if (file.size > MAX_TRAINING_BYTES) throw new ValidationError({ file: "Fișierul depășește 20 MB." });
  if (file.size === 0) throw new ValidationError({ file: "Fișierul este gol." });

  const bytes = Buffer.from(await file.arrayBuffer());
  const valid =
    kind === "pdf"
      ? bytes.subarray(0, 4).toString("latin1") === "%PDF"
      : kind === "zip"
        ? isOfficeFile(bytes, ext)
        : (() => {
            try {
              new TextDecoder("utf-8", { fatal: true }).decode(bytes);
              return true;
            } catch {
              return false;
            }
          })();
  if (!valid) throw new ValidationError({ file: "Conținutul fișierului nu corespunde extensiei (fișierele text trebuie să fie UTF-8)." });

  const id = randomUUID();
  await mkdir(AI_UPLOADS_DIR, { recursive: true });
  const localPath = path.join(AI_UPLOADS_DIR, `${id}.${ext}`);
  await writeFile(localPath, bytes);
  const cleanTitle = (title?.trim() || path.basename(file.name, path.extname(file.name))).slice(0, 200);
  return upsertDocument({
    kind: "upload",
    key: `upload:${id}`,
    title: cleanTitle,
    url: null,
    filename: file.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120),
    content: bytes,
    localPath,
  });
}

/** Re-uploads a failed or pending uploaded file from its local copy. */
export async function retrySource(id: number): Promise<AiSource | undefined> {
  const row = db.prepare("SELECT * FROM ai_sources WHERE id = ?").get(id) as SourceRow | undefined;
  if (!row) return undefined;
  if (row.kind !== "upload") {
    void syncSite();
    return toSource(row);
  }
  if (!row.local_path || !existsSync(row.local_path)) throw new ValidationError({ file: "Copia locală a fișierului lipsește; încărcați-l din nou." });
  db.prepare("UPDATE ai_sources SET hash = '' WHERE id = ?").run(id);
  return upsertDocument({
    kind: "upload",
    key: row.key,
    title: row.title,
    url: null,
    filename: row.filename,
    content: await readFile(row.local_path),
    localPath: row.local_path,
  });
}

// ---- site content ---------------------------------------------------------------------

// Drops renderer directives that mean nothing as plain text.
const postText = (body: string) => body.replace(/^::(youtube|video)\[[^\]]*\]\s*$/gm, "").replace(/^:::details\s+/gm, "### ").replace(/^:::\s*$/gm, "");

function siteDocuments(): Doc[] {
  const pages = readSitePages().map<Doc>((p) => ({
    kind: "page",
    key: `page:${p.path}`,
    title: p.title,
    url: p.path,
    filename: `pagina${p.path === "/" ? "-acasa" : p.path.replace(/[^a-z0-9]+/gi, "-")}.md`,
    content: Buffer.from(`# ${p.title}\n\nPagină a site-ului eMIP: ${SITE_URL}${p.path}\n\n${p.text}\n`),
  }));
  const posts = listPosts({ includeDrafts: false })
    .map((summary) => getPostById(summary.id)!)
    .map<Doc>((post) => ({
      kind: "post",
      key: `post:${post.id}`,
      title: post.title,
      url: `/post/${post.slug}`,
      filename: `articol-${post.id}.md`,
      content: Buffer.from(
        `# ${post.title}\n\nArticol de pe blogul eMIP: ${SITE_URL}/post/${post.slug}\nPublicat: ${post.date}${post.updated && post.updated !== post.date ? `, actualizat: ${post.updated}` : ""}\n\n${post.description}\n\n${postText(post.body)}\n`,
      ),
    }));
  return [...pages, ...posts];
}

let syncRunning: Promise<void> | undefined;
export const siteSyncRunning = () => !!syncRunning;

/** Brings page and post documents in the store in line with the site. Uploads only what changed. */
export function syncSite(): Promise<void> {
  if (!openai) return Promise.resolve();
  syncRunning ??= (async () => {
    const docs = siteDocuments();
    const pages = docs.filter((d) => d.kind === "page").length;
    try {
      const keys = new Set(docs.map((d) => d.key));
      const stale = db.prepare("SELECT id, key FROM ai_sources WHERE kind IN ('page', 'post')").all() as { id: number; key: string }[];
      for (const s of stale) if (!keys.has(s.key)) await removeSource(s.id);
      // A few uploads at a time keeps us well inside OpenAI rate limits.
      for (let i = 0; i < docs.length; i += 4) await Promise.all(docs.slice(i, i + 4).map(upsertDocument));
      setMeta(
        "ai_last_site_sync",
        JSON.stringify({ at: new Date().toISOString(), pages, posts: docs.length - pages, ...(pages === 0 && { error: "Textul paginilor lipsește: rulați npm run build (sau npm run knowledge:export)." }) }),
      );
    } catch (err) {
      console.error("[ai] site sync failed", err);
      setMeta("ai_last_site_sync", JSON.stringify({ at: new Date().toISOString(), pages, posts: docs.length - pages, error: errorMessage(err) }));
    }
  })().finally(() => {
    syncRunning = undefined;
  });
  return syncRunning;
}

let syncTimer: NodeJS.Timeout | undefined;
/**
 * Debounced sync after blog edits (and on production start), so a burst of saves results in
 * one upload round. Skipped while the assistant is set to use only uploaded files; switching
 * site content back on in the settings triggers a sync.
 */
export function scheduleSiteSync(delayMs = 30_000) {
  if (!openai || !getSettings().useSiteContent) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => void syncSite(), delayMs);
}

export function lastSiteSync() {
  const raw = getMeta("ai_last_site_sync");
  return raw ? (JSON.parse(raw) as { at: string; pages: number; posts: number; error?: string }) : null;
}
