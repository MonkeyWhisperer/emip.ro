import { foldSlug, type Category, type PostInput } from "../shared/blog.ts";
import { listCategories } from "./db.ts";

/** Answered with 400 { error: message, fields } by app.onError. */
export class ValidationError extends Error {
  readonly fields: Record<string, string>;
  constructor(fields: Record<string, string>, message = "Date invalide.") {
    super(message);
    this.fields = fields;
  }
}

/** A parsed JSON request body that must be an object: null, arrays and primitives are a 400. */
export function objectBody(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ValidationError({ body: "Corpul cererii trebuie să fie un obiect JSON." });
  }
  return raw as Record<string, unknown>;
}

// Migrated Wix slugs contain diacritics and underscores (e.g. "anexa18-raport_lunar_de_activitate").
const SLUG = /^[\p{Ll}\p{Nd}_]+(?:-[\p{Ll}\p{Nd}_]+)*$/u;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
// Covers are either migrated/uploaded files on this site or absolute https URLs.
const isMediaUrl = (v: string) => /^\/media\/[\w./-]+$/.test(v) || /^https:\/\/[^\s"'<>]+$/.test(v);

export function parsePostInput(raw: unknown): PostInput {
  const body = (raw ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const title = str(body.title);
  if (!title) fields.title = "Titlul este obligatoriu.";
  else if (title.length > 200) fields.title = "Titlul poate avea cel mult 200 de caractere.";

  const slug = str(body.slug).normalize("NFC");
  if (!slug) fields.slug = "Slug-ul este obligatoriu.";
  else if (slug.length > 200 || !SLUG.test(slug) || !foldSlug(slug))
    fields.slug = "Folosiți doar litere mici, cifre și cratime.";

  const description = str(body.description);
  if (description.length > 500) fields.description = "Descrierea poate avea cel mult 500 de caractere.";

  const markdown = typeof body.body === "string" ? body.body : "";
  if (markdown.length > 500_000) fields.body = "Conținutul este prea lung.";

  const date = str(body.date);
  if (!isDate(date)) fields.date = "Data trebuie să fie în formatul AAAA-LL-ZZ.";

  const author = str(body.author) || "Editor eMIP";
  if (author.length > 100) fields.author = "Autorul poate avea cel mult 100 de caractere.";

  const cover = str(body.cover) || null;
  if (cover && !isMediaUrl(cover)) fields.cover = "Imaginea de copertă trebuie să fie o imagine încărcată sau un URL https.";
  const coverAlt = str(body.coverAlt) || null;
  if (coverAlt && coverAlt.length > 200) fields.coverAlt = "Textul alternativ poate avea cel mult 200 de caractere.";

  const known = new Set(listCategories().map((c) => c.slug));
  const categories = Array.isArray(body.categories) ? [...new Set(body.categories.map(str))].filter(Boolean) : [];
  const unknown = categories.filter((c) => !known.has(c));
  if (unknown.length) fields.categories = `Categorii necunoscute: ${unknown.join(", ")}`;

  const tags = Array.isArray(body.tags) ? [...new Set(body.tags.map(str))].filter(Boolean).slice(0, 30) : [];
  if (tags.some((t) => t.length > 60)) fields.tags = "Etichetele pot avea cel mult 60 de caractere.";

  const status = body.status === "published" ? "published" : body.status === "draft" ? "draft" : null;
  if (!status) fields.status = "Status invalid.";

  if (Object.keys(fields).length) throw new ValidationError(fields);
  return {
    slug,
    title,
    description,
    body: markdown,
    date,
    author,
    cover,
    coverAlt,
    categories,
    tags,
    featured: body.featured === true,
    pinned: body.pinned === true,
    status: status!,
  };
}

export function parseCategoryInput(raw: unknown, slugFromPath?: string): Category {
  const body = (raw ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const slug = slugFromPath ?? str(body.slug);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) fields.slug = "Folosiți doar litere mici, cifre și cratime.";
  const label = str(body.label);
  if (!label || label.length > 80) fields.label = "Numele este obligatoriu (max. 80 de caractere).";
  const description = str(body.description);
  if (description.length > 500) fields.description = "Descrierea poate avea cel mult 500 de caractere.";
  if (Object.keys(fields).length) throw new ValidationError(fields);
  return { slug, label, description };
}
