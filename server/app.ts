import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { etag } from "hono/etag";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  attemptLogin,
  clientIp,
  clientKey,
  createSession,
  destroySession,
  hasValidSession,
  requestHost,
  requireAdmin,
  sameOrigin,
  socketAddress,
  trustedProxies,
  warnUntrustedProxy,
} from "./auth.ts";
import {
  UPLOADS_DIR,
  createPost,
  db,
  deleteCategory,
  deletePost,
  getPostById,
  getPostBySlug,
  listCategories,
  listPosts,
  slugTaken,
  updatePost,
  upsertCategory,
} from "./db.ts";
import OpenAI from "openai";
import { chatRoutes } from "./ai/chat.ts";
import { scheduleSiteSync } from "./ai/knowledge.ts";
import { adminAi } from "./ai/routes.ts";
import { adminForms, publicForms } from "./forms.ts";
import { SITE_URL, legacyTarget, matchRoute, serverMetaTags, sitemapXml } from "./siteRoutes.ts";
import { MAX_UPLOAD_BYTES, saveUpload, uploadMime } from "./uploads.ts";
import { ValidationError, objectBody, parseCategoryInput, parsePostInput } from "./validate.ts";

const today = () => new Date().toISOString().slice(0, 10);

// ---- Content-Security-Policy for the web app's HTML (production) ---------------------------
// Four migrated blog videos still stream from Wix. Images and videos on other https hosts that
// saved posts use (covers, Markdown images, ::video) are added automatically, so the admin can
// still link external media; nothing else (e.g. model output in the chat) can load from other hosts.

const CSP_BASE = {
  img: ["'self'", "data:"],
  media: ["'self'", "https://video.wixstatic.com"],
};

// Cached until the posts change: the post routes below reset it, the stamp catches other writers.
let cspCache: { stamp: string; value: string } | undefined;

function contentSecurityPolicy(): string {
  const { n, changed } = db.prepare("SELECT COUNT(*) AS n, MAX(updated_at) AS changed FROM posts").get() as { n: number; changed: string | null };
  const stamp = `${n}|${changed}`;
  if (cspCache?.stamp === stamp) return cspCache.value;

  const img = new Set(CSP_BASE.img);
  const media = new Set(CSP_BASE.media);
  // Plain host names only: ";" or "," are valid in a URL host but would split the policy.
  const origin = (url: string) => {
    try {
      const o = new URL(url).origin;
      return /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*(?::\d{1,5})?$/.test(o) ? o : undefined;
    } catch {
      return undefined;
    }
  };
  const rows = db
    .prepare("SELECT cover, body FROM posts WHERE cover LIKE 'https://%' OR body LIKE '%https://%'")
    .all() as { cover: string | null; body: string }[];
  for (const { cover, body } of rows) {
    const c = cover && origin(cover);
    if (c) img.add(c);
    for (const m of body.matchAll(/!\[[^\]]*\]\((https:\/\/[^\s)]+)/g)) {
      const o = origin(m[1]);
      if (o) img.add(o);
    }
    for (const m of body.matchAll(/^::video\[(https:\/\/[^\]\s]+)\]/gm)) {
      const o = origin(m[1]);
      if (o) media.add(o);
    }
  }
  const value = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${[...img].join(" ")}`,
    `media-src ${[...media].join(" ")}`,
    // Vite inlines small font files (subsets of the site font under 4 KB) into the CSS as data: URLs.
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
  cspCache = { stamp, value };
  return value;
}

export function createApp({ dev, distDir }: { dev: boolean; distDir: string }) {
  const app = new Hono();

  app.use("*", secureHeaders({ crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: "same-origin" }));
  app.use("*", warnUntrustedProxy);

  // The bare domain (emip.ro) redirects to the canonical www host from SITE_URL, so the site isn't
  // served and indexed twice when both domains point here. Other hosts (the platform's own domain,
  // its health checks, localhost) are served as they are.
  const canonicalHost = new URL(SITE_URL).host;
  const bareHost = canonicalHost.startsWith("www.") ? canonicalHost.slice(4) : undefined;
  app.use("*", async (c, next) => {
    if (bareHost && (c.req.method === "GET" || c.req.method === "HEAD") && requestHost(c) === bareHost) {
      const { pathname, search } = new URL(c.req.url);
      return c.redirect(`${SITE_URL}${pathname}${search}`, 301);
    }
    await next();
  });

  app.onError((err, c) => {
    if (err instanceof ValidationError) return c.json({ error: err.message, fields: err.fields }, 400);
    if (err instanceof SyntaxError) return c.json({ error: "JSON invalid." }, 400);
    // Thrown by middleware such as bodyLimit (413); they carry their own status and response.
    if (err instanceof HTTPException) {
      return err.status === 413 ? c.json({ error: "Cererea este prea mare." }, 413) : err.getResponse();
    }
    if (err instanceof OpenAI.APIError) {
      console.error("[openai]", err.status, err.message);
      return c.json({ error: "Serviciul OpenAI a returnat o eroare. Încercați din nou." }, 502);
    }
    console.error(err);
    return c.json({ error: "Eroare internă de server." }, 500);
  });

  // ---- API ---------------------------------------------------------------------
  const api = new Hono();
  api.use("*", sameOrigin);
  api.use("*", async (c, next) => {
    await next();
    c.header("X-Robots-Tag", "noindex");
  });

  // Public, read-only. "no-cache" + ETag: browsers and CDNs revalidate every time, so edits,
  // unpublishing and deletions show up immediately, yet unchanged data costs only a 304.
  api.use("/categories", etag());
  api.use("/posts/*", etag());
  api.use("/posts", etag());
  api.get("/categories", (c) => {
    c.header("Cache-Control", "no-cache");
    return c.json(listCategories());
  });
  api.get("/posts", (c) => {
    c.header("Cache-Control", "no-cache");
    return c.json(listPosts({ includeDrafts: false }));
  });
  api.get("/posts/:slug", (c) => {
    // Drafts are visible to the logged-in admin so they can be previewed on the real page.
    const post = getPostBySlug(c.req.param("slug"), { includeDrafts: hasValidSession(c) });
    if (!post) {
      c.header("Cache-Control", "no-store");
      return c.json({ error: "Articolul nu a fost găsit." }, 404);
    }
    c.header("Cache-Control", post.status === "published" ? "no-cache" : "private, no-store");
    return c.json(post);
  });

  // Auth
  api.post("/auth/login", bodyLimit({ maxSize: 10_000 }), async (c) => {
    const key = clientKey(c);
    const { email, password } = objectBody(await c.req.json());
    if (typeof email !== "string" || typeof password !== "string" || password.length > 200) {
      return c.json({ error: "Email sau parolă incorecte." }, 401);
    }
    const result = await attemptLogin(key, email, password);
    if (result === "locked") return c.json({ error: "Prea multe încercări eșuate. Încercați din nou peste 15 minute." }, 429);
    if (result === "busy") return c.json({ error: "Prea multe încercări de autentificare în acest moment. Încercați din nou în câteva secunde." }, 429);
    if (result === "invalid") return c.json({ error: "Email sau parolă incorecte." }, 401);
    createSession(c, !dev);
    return c.json({ email: process.env.ADMIN_EMAIL });
  });
  api.post("/auth/logout", (c) => {
    destroySession(c);
    return c.json({ ok: true });
  });
  api.get("/auth/session", (c) => {
    c.header("Cache-Control", "no-store");
    return hasValidSession(c) ? c.json({ email: process.env.ADMIN_EMAIL }) : c.json({ error: "Neautentificat." }, 401);
  });

  // Admin
  const admin = new Hono();
  admin.use("*", requireAdmin);
  admin.use("*", async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store");
  });

  admin.get("/posts", (c) => c.json(listPosts({ includeDrafts: true })));
  admin.get("/posts/:id{[0-9]+}", (c) => {
    const post = getPostById(Number(c.req.param("id")));
    return post ? c.json(post) : c.json({ error: "Articolul nu a fost găsit." }, 404);
  });
  admin.post("/posts", bodyLimit({ maxSize: 1_000_000 }), async (c) => {
    const input = parsePostInput(await c.req.json());
    if (slugTaken(input.slug)) throw new ValidationError({ slug: "Există deja un articol cu acest slug." });
    const post = createPost(input);
    cspCache = undefined;
    if (post.status === "published") scheduleSiteSync();
    return c.json(post, 201);
  });
  admin.put("/posts/:id{[0-9]+}", bodyLimit({ maxSize: 1_000_000 }), async (c) => {
    const id = Number(c.req.param("id"));
    const existing = getPostById(id);
    if (!existing) return c.json({ error: "Articolul nu a fost găsit." }, 404);
    const input = parsePostInput(await c.req.json());
    if (slugTaken(input.slug, id)) throw new ValidationError({ slug: "Există deja un articol cu acest slug." });
    const contentChanged = existing.body !== input.body || existing.title !== input.title;
    const updated = input.status === "published" && contentChanged ? today() : existing.updated;
    const post = updatePost(id, input, updated ?? input.date);
    cspCache = undefined;
    // Keep the assistant's knowledge in step with what is published.
    if (post?.status === "published" || existing.status === "published") scheduleSiteSync();
    return c.json(post);
  });
  admin.delete("/posts/:id{[0-9]+}", (c) => {
    if (!deletePost(Number(c.req.param("id")))) return c.json({ error: "Articolul nu a fost găsit." }, 404);
    cspCache = undefined;
    scheduleSiteSync();
    return c.json({ ok: true });
  });

  admin.get("/categories", (c) => c.json(listCategories()));
  admin.post("/categories", bodyLimit({ maxSize: 10_000 }), async (c) => {
    const category = parseCategoryInput(await c.req.json());
    if (listCategories().some((x) => x.slug === category.slug)) {
      throw new ValidationError({ slug: "Există deja o categorie cu acest slug." });
    }
    upsertCategory(category);
    return c.json(category, 201);
  });
  admin.put("/categories/:slug", bodyLimit({ maxSize: 10_000 }), async (c) => {
    const slug = c.req.param("slug");
    if (!listCategories().some((x) => x.slug === slug)) return c.json({ error: "Categoria nu a fost găsită." }, 404);
    const category = parseCategoryInput(await c.req.json(), slug);
    upsertCategory(category);
    return c.json(category);
  });
  admin.delete("/categories/:slug", (c) =>
    deleteCategory(c.req.param("slug")) ? c.json({ ok: true }) : c.json({ error: "Categoria nu a fost găsită." }, 404),
  );

  admin.post("/uploads", bodyLimit({ maxSize: MAX_UPLOAD_BYTES + 100_000 }), async (c) => {
    const form = await c.req.parseBody();
    const file = form.file;
    if (!(file instanceof File)) throw new ValidationError({ file: "Niciun fișier trimis." });
    return c.json(await saveUpload(file), 201);
  });

  admin.route("/submissions", adminForms);
  admin.route("/ai", adminAi);

  api.route("/chat", chatRoutes);
  api.route("/forms", publicForms);
  api.route("/admin", admin);

  // For the host's health check (Railway: deploy.healthcheckPath): answers only once the
  // database on the data volume can be read.
  api.get("/health", (c) => {
    db.prepare("SELECT 1").get();
    c.header("Cache-Control", "no-store");
    return c.json({ ok: true });
  });

  // Temporary check for the TRUST_PROXY value after a deploy (README, "Client IPs on Railway"):
  // with DEBUG_CLIENT_IP=1, shows the caller's own proxy headers and the IP the limits would use.
  if (process.env.DEBUG_CLIENT_IP === "1") {
    api.get("/debug/client-ip", (c) => {
      c.header("Cache-Control", "no-store");
      return c.json({
        trustProxy: trustedProxies(),
        clientIp: clientIp(c),
        xForwardedFor: c.req.header("x-forwarded-for") ?? null,
        xRealIp: c.req.header("x-real-ip") ?? null,
        fastlyClientIp: c.req.header("fastly-client-ip") ?? null,
        socketAddress: socketAddress(c) ?? null,
      });
    });
  }
  api.all("*", (c) => c.json({ error: "Endpoint inexistent." }, 404));
  app.route("/api", api);

  // ---- legacy Wix URLs ------------------------------------------------------------------
  // Permanent redirects so search engines transfer rankings (the web app also redirects client-side).
  app.use("*", async (c, next) => {
    if (c.req.method === "GET" || c.req.method === "HEAD") {
      const target = legacyTarget(c.req.path);
      if (target) return c.redirect(target, 301);
    }
    await next();
  });

  // ---- SEO ---------------------------------------------------------------------------
  // (robots.txt is a static file: public/robots.txt, copied into dist/ by the build.)
  app.get("/sitemap.xml", (c) => {
    c.header("Content-Type", "application/xml; charset=utf-8");
    c.header("Cache-Control", "public, max-age=3600");
    return c.body(sitemapXml());
  });

  // ---- uploaded media -------------------------------------------------------------
  app.get("/media/uploads/*", async (c) => {
    let rel: string;
    try {
      rel = decodeURIComponent(c.req.path.slice("/media/uploads/".length));
    } catch {
      return c.notFound(); // malformed percent-encoding
    }
    const file = path.resolve(UPLOADS_DIR, rel);
    const mime = uploadMime(file);
    if (!file.startsWith(UPLOADS_DIR + path.sep) || !mime) return c.notFound();
    try {
      if (!(await stat(file)).isFile()) return c.notFound();
    } catch {
      return c.notFound();
    }
    c.header("Content-Type", mime);
    c.header("X-Content-Type-Options", "nosniff");
    // Uploaded files never need to run anything, even if a polyglot slips past validation.
    c.header("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    if (!mime.startsWith("image/") && mime !== "application/pdf") c.header("Content-Disposition", "attachment");
    return c.body(await readFile(file));
  });

  // ---- built web app (production) ------------------------------------------------------
  if (!dev) {
    const root = path.relative(process.cwd(), distDir) || ".";
    app.use(
      "/assets/*",
      serveStatic({
        root,
        onFound: (_p, c) => {
          c.header("Cache-Control", "public, max-age=31536000, immutable");
        },
      }),
    );
    const staticFiles = serveStatic({
      root,
      onFound: (_p, c) => {
        c.header("Cache-Control", "public, max-age=86400");
      },
    });
    // The HTML shell is never served as a plain file: it always goes through the handler below
    // (status code, meta tags, CSP). serveStatic would answer "/" with dist/index.html.
    app.use("*", (c, next) => (c.req.path.endsWith("/") || c.req.path.endsWith(".html") ? next() : staticFiles(c, next)));

    let indexHtml: string | undefined;
    app.get("*", async (c) => {
      const p = c.req.path;
      if (p === "/index.html") return c.redirect("/", 301);
      // Missing files (e.g. a stale /assets/*.js after a deploy) must 404, not receive the HTML shell.
      if (p.startsWith("/assets/") || p.startsWith("/media/") || /\.\w{2,5}$/.test(p)) {
        return c.text("Not found", 404);
      }
      indexHtml ??= await readFile(path.join(distDir, "index.html"), "utf8");
      // Unknown paths get the same page (the app renders its 404 view) with a real 404 status,
      // so search engines don't index them as pages ("soft 404s").
      const route = matchRoute(p);
      const tags = serverMetaTags(route);
      const html = tags ? indexHtml.replace("</head>", () => `  ${tags}\n  </head>`) : indexHtml;
      c.header("Cache-Control", "no-cache");
      c.header("Content-Security-Policy", contentSecurityPolicy());
      if (route?.kind === "admin") c.header("X-Robots-Tag", "noindex, nofollow");
      return c.html(html, route ? 200 : 404);
    });
  }

  return app;
}
