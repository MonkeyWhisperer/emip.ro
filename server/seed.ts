import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Category, PostInput } from "../shared/blog.ts";
import { createPost, db, getMeta, setMeta, upsertCategory } from "./db.ts";

// Posts migrated from the Wix blog. They are imported once, into an empty database;
// after that the admin panel (SQLite) is the source of truth.
const SEED_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "seed");
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseMarkdown(file: string) {
  const raw = readFileSync(file, "utf8");
  const match = raw.match(FRONTMATTER);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const meta: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = JSON.parse(line.slice(i + 1).trim());
  }
  return { meta, body: raw.slice(match[0].length).trim() };
}

export function seed() {
  const categories = JSON.parse(readFileSync(path.join(SEED_DIR, "categories.json"), "utf8")) as Category[];
  categories.forEach((c, i) => upsertCategory(c, i));

  const files = readdirSync(path.join(SEED_DIR, "posts")).filter((f) => f.endsWith(".md"));
  db.exec("BEGIN");
  try {
    for (const file of files) {
      const { meta, body } = parseMarkdown(path.join(SEED_DIR, "posts", file));
      const input: PostInput = {
        slug: String(meta.slug).normalize("NFC"),
        title: String(meta.title),
        description: String(meta.description ?? ""),
        body,
        date: String(meta.date),
        author: String(meta.author ?? "Editor eMIP"),
        cover: (meta.cover as string) ?? null,
        coverAlt: (meta.coverAlt as string) ?? null,
        categories: (meta.categories as string[]) ?? [],
        tags: (meta.tags as string[]) ?? [],
        featured: meta.featured === true,
        pinned: meta.pinned === true,
        status: "published",
      };
      createPost(input, { updated: (meta.updated as string) ?? null, readingTime: meta.readingTime as number | undefined });
    }
    setMeta("seeded", new Date().toISOString());
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return { categories: categories.length, posts: files.length };
}

export function seedIfNeeded() {
  if (getMeta("seeded")) return;
  const result = seed();
  console.log(`[seed] imported ${result.posts} posts and ${result.categories} categories`);
}
