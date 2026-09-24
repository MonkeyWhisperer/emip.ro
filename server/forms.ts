import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Submission, SubmissionKind } from "../shared/forms.ts";
import { clientKey } from "./auth.ts";
import { db } from "./db.ts";
import { RateLimiter } from "./rateLimit.ts";
import { ValidationError, objectBody } from "./validate.ts";

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id         INTEGER PRIMARY KEY,
    kind       TEXT NOT NULL CHECK (kind IN ('contact', 'newsletter')),
    name       TEXT,
    email      TEXT NOT NULL,
    phone      TEXT,
    company    TEXT,
    subject    TEXT,
    message    TEXT,
    read       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS submissions_newsletter_email ON submissions (email) WHERE kind = 'newsletter';
`);

// Plain addresses only: no mailto-style extras (?, &, %) that could smuggle headers into an
// admin's "reply" link, no quoted local parts or IP literals.
const EMAIL = /^[a-z0-9.!#$'*+/=^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const validEmail = (email: string) => email.length <= 254 && EMAIL.test(email);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** 10 submissions per client (IP, or IPv6 /64) per hour across both forms. */
const submissions = new RateLimiter(10, 60 * 60 * 1000);
const allow = (key: string) => submissions.hit(key);

type Row = Omit<Submission, "read" | "createdAt"> & { read: number; created_at: string };
const toSubmission = ({ read, created_at, ...rest }: Row): Submission => ({ ...rest, read: read === 1, createdAt: created_at });

// ---- public -------------------------------------------------------------------------
export const publicForms = new Hono();

publicForms.post("/contact", bodyLimit({ maxSize: 20_000 }), async (c) => {
  const body = objectBody(await c.req.json());
  if (str(body.website, 200)) return c.json({ ok: true }, 201); // honeypot: pretend success
  if (!allow(clientKey(c))) return c.json({ error: "Prea multe mesaje trimise. Încercați mai târziu." }, 429);

  const fields: Record<string, string> = {};
  const name = str(body.name, 120);
  const email = str(body.email, 200);
  const message = str(body.message, 5000);
  if (!name) fields.name = "Numele este obligatoriu.";
  if (!validEmail(email)) fields.email = "Adresa de email nu este validă.";
  if (message.length < 5) fields.message = "Mesajul este obligatoriu.";
  if (body.consent !== true) fields.consent = "Este necesar acordul pentru prelucrarea datelor.";
  if (Object.keys(fields).length) throw new ValidationError(fields);

  db.prepare(
    "INSERT INTO submissions (kind, name, email, phone, company, subject, message) VALUES ('contact', ?, ?, ?, ?, ?, ?)",
  ).run(name, email, str(body.phone, 40) || null, str(body.company, 160) || null, str(body.subject, 200) || null, message);
  return c.json({ ok: true }, 201);
});

publicForms.post("/newsletter", bodyLimit({ maxSize: 5_000 }), async (c) => {
  const body = objectBody(await c.req.json());
  if (str(body.website, 200)) return c.json({ ok: true }, 201);
  if (!allow(clientKey(c))) return c.json({ error: "Prea multe cereri. Încercați mai târziu." }, 429);

  const email = str(body.email, 200).toLowerCase();
  const fields: Record<string, string> = {};
  if (!validEmail(email)) fields.email = "Adresa de email nu este validă.";
  if (body.consent !== true) fields.consent = "Este necesar acordul pentru abonare.";
  if (Object.keys(fields).length) throw new ValidationError(fields);

  // Re-subscribing is a no-op, so the response never reveals whether an email is on the list.
  db.prepare("INSERT INTO submissions (kind, email) VALUES ('newsletter', ?) ON CONFLICT DO NOTHING").run(email);
  return c.json({ ok: true }, 201);
});

// ---- admin (mounted behind requireAdmin) -----------------------------------------------
export const adminForms = new Hono();

adminForms.get("/", (c) => {
  const kind = c.req.query("kind") as SubmissionKind | undefined;
  const rows = (
    kind === "contact" || kind === "newsletter"
      ? db.prepare("SELECT * FROM submissions WHERE kind = ? ORDER BY created_at DESC, id DESC").all(kind)
      : db.prepare("SELECT * FROM submissions ORDER BY created_at DESC, id DESC").all()
  ) as Row[];
  return c.json(rows.map(toSubmission));
});

adminForms.patch("/:id{[0-9]+}", bodyLimit({ maxSize: 1_000 }), async (c) => {
  const { read } = objectBody(await c.req.json());
  if (typeof read !== "boolean") throw new ValidationError({ read: "Valoare invalidă." });
  const changes = db.prepare("UPDATE submissions SET read = ? WHERE id = ?").run(read ? 1 : 0, Number(c.req.param("id"))).changes;
  return changes ? c.json({ ok: true }) : c.json({ error: "Mesajul nu a fost găsit." }, 404);
});

adminForms.delete("/:id{[0-9]+}", (c) => {
  const changes = db.prepare("DELETE FROM submissions WHERE id = ?").run(Number(c.req.param("id"))).changes;
  return changes ? c.json({ ok: true }) : c.json({ error: "Mesajul nu a fost găsit." }, 404);
});
