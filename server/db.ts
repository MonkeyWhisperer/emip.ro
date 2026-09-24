import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { estimateReadingTime, foldSlug, type Category, type Post, type PostInput, type PostSummary } from "../shared/blog.ts";

export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, "emip.sqlite"));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY,
    slug         TEXT NOT NULL,
    slug_key     TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    body         TEXT NOT NULL DEFAULT '',
    date         TEXT NOT NULL,
    updated      TEXT,
    author       TEXT NOT NULL DEFAULT 'Editor eMIP',
    reading_time INTEGER NOT NULL DEFAULT 1,
    cover        TEXT,
    cover_alt    TEXT,
    categories   TEXT NOT NULL DEFAULT '[]',
    tags         TEXT NOT NULL DEFAULT '[]',
    featured     INTEGER NOT NULL DEFAULT 0,
    pinned       INTEGER NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS posts_status_date ON posts (status, date DESC);

  CREATE TABLE IF NOT EXISTS categories (
    slug        TEXT PRIMARY KEY,
    label       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    position    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

type PostRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  body?: string;
  date: string;
  updated: string | null;
  author: string;
  reading_time: number;
  cover: string | null;
  cover_alt: string | null;
  categories: string;
  tags: string;
  featured: number;
  pinned: number;
  status: "draft" | "published";
};

const SUMMARY_COLUMNS =
  "id, slug, title, description, date, updated, author, reading_time, cover, cover_alt, categories, tags, featured, pinned, status";

function toSummary(row: PostRow): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    date: row.date,
    updated: row.updated,
    author: row.author,
    readingTime: row.reading_time,
    cover: row.cover,
    coverAlt: row.cover_alt,
    categories: JSON.parse(row.categories),
    tags: JSON.parse(row.tags),
    featured: row.featured === 1,
    pinned: row.pinned === 1,
    status: row.status,
  };
}

const toPost = (row: PostRow): Post => ({ ...toSummary(row), body: row.body ?? "" });

// ---- posts ---------------------------------------------------------------------

export function listPosts({ includeDrafts }: { includeDrafts: boolean }): PostSummary[] {
  const where = includeDrafts ? "" : "WHERE status = 'published'";
  const rows = db.prepare(`SELECT ${SUMMARY_COLUMNS} FROM posts ${where} ORDER BY date DESC, id DESC`).all() as PostRow[];
  return rows.map(toSummary);
}

export function getPostBySlug(slug: string, { includeDrafts }: { includeDrafts: boolean }): Post | undefined {
  const row = db.prepare("SELECT * FROM posts WHERE slug_key = ?").get(foldSlug(slug)) as PostRow | undefined;
  if (!row || (!includeDrafts && row.status !== "published")) return undefined;
  return toPost(row);
}

export function getPostById(id: number): Post | undefined {
  const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as PostRow | undefined;
  return row && toPost(row);
}

export function slugTaken(slug: string, exceptId?: number): boolean {
  const row = db.prepare("SELECT id FROM posts WHERE slug_key = ?").get(foldSlug(slug)) as { id: number } | undefined;
  return !!row && row.id !== exceptId;
}

function params(input: PostInput) {
  return {
    slug: input.slug,
    slug_key: foldSlug(input.slug),
    title: input.title,
    description: input.description,
    body: input.body,
    date: input.date,
    author: input.author,
    reading_time: estimateReadingTime(input.body),
    cover: input.cover,
    cover_alt: input.coverAlt,
    categories: JSON.stringify(input.categories),
    tags: JSON.stringify(input.tags),
    featured: input.featured ? 1 : 0,
    pinned: input.pinned ? 1 : 0,
    status: input.status,
  };
}

export function createPost(input: PostInput, extra: { updated?: string | null; readingTime?: number } = {}): Post {
  const p = params(input);
  const result = db
    .prepare(
      `INSERT INTO posts (slug, slug_key, title, description, body, date, updated, author, reading_time, cover, cover_alt,
         categories, tags, featured, pinned, status)
       VALUES (:slug, :slug_key, :title, :description, :body, :date, :updated, :author, :reading_time, :cover, :cover_alt,
         :categories, :tags, :featured, :pinned, :status)`,
    )
    .run({ ...p, updated: extra.updated ?? null, reading_time: extra.readingTime ?? p.reading_time });
  return getPostById(Number(result.lastInsertRowid))!;
}

export function updatePost(id: number, input: PostInput, updated: string): Post | undefined {
  const result = db
    .prepare(
      `UPDATE posts SET slug = :slug, slug_key = :slug_key, title = :title, description = :description, body = :body,
         date = :date, updated = :updated, author = :author, reading_time = :reading_time, cover = :cover,
         cover_alt = :cover_alt, categories = :categories, tags = :tags, featured = :featured, pinned = :pinned,
         status = :status, updated_at = datetime('now')
       WHERE id = :id`,
    )
    .run({ ...params(input), updated, id });
  return result.changes ? getPostById(id) : undefined;
}

export function deletePost(id: number): boolean {
  return db.prepare("DELETE FROM posts WHERE id = ?").run(id).changes > 0;
}

// ---- categories ----------------------------------------------------------------

export function listCategories(): Category[] {
  return db.prepare("SELECT slug, label, description FROM categories ORDER BY position, label").all() as Category[];
}

export function upsertCategory(category: Category, position?: number) {
  db.prepare(
    `INSERT INTO categories (slug, label, description, position)
     VALUES (:slug, :label, :description, COALESCE(:position, (SELECT COALESCE(MAX(position), 0) + 1 FROM categories)))
     ON CONFLICT (slug) DO UPDATE SET label = excluded.label, description = excluded.description`,
  ).run({ ...category, position: position ?? null });
}

/** Deletes the category and removes it from every post that used it. */
export function deleteCategory(slug: string): boolean {
  const posts = db.prepare("SELECT id, categories FROM posts WHERE categories LIKE ?").all(`%"${slug}"%`) as {
    id: number;
    categories: string;
  }[];
  const update = db.prepare("UPDATE posts SET categories = ? WHERE id = ?");
  for (const p of posts) {
    update.run(JSON.stringify((JSON.parse(p.categories) as string[]).filter((c) => c !== slug)), p.id);
  }
  return db.prepare("DELETE FROM categories WHERE slug = ?").run(slug).changes > 0;
}

// ---- meta ----------------------------------------------------------------------

export const getMeta = (key: string) =>
  (db.prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined)?.value;

export const setMeta = (key: string, value: string) =>
  db.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value").run(
    key,
    value,
  );
