# emip.ro

Rebuild of the eMIP marketing site (previously on Wix): a React web app plus a small Node server that
hosts the blog API, a single-user admin panel, and the contact/newsletter forms.

- **Web app:** React 19, Vite, TypeScript, Tailwind CSS v4, React Router (`src/`)
- **Server:** Node 24 running TypeScript directly, Hono, SQLite via the built-in `node:sqlite` (`server/`)
- **Shared types:** `shared/`

## Getting started

Requires **Node 24+**.

```sh
npm install
cp .env.example .env            # then fill in the admin credentials (below)
npm run dev                     # API on :3001 + Vite on :5173 (proxies /api)
```

On first start the server creates `data/emip.sqlite` and imports the 42 blog posts migrated from Wix
(`server/seed/`). After that the database is the source of truth; edit posts in the admin panel.

## Admin panel

`/admin`, one account, configured in `.env`:

```sh
npm run admin:hash-password     # prompts for the password (hidden, asked twice), prints ADMIN_PASSWORD_HASH='...'
```

Put `ADMIN_EMAIL` and the printed `ADMIN_PASSWORD_HASH` in `.env`. Only the scrypt hash is stored,
never the password. Sessions are HttpOnly, SameSite=Strict cookies (7 days). Login is rate-limited:
5 failed attempts lock that client (IP address, or IPv6 /64) out for 15 minutes; when more than 30
logins have failed site-wide in 15 minutes, attempts are queued and spaced out (up to 5 s apart, at
most 20 waiting), and at most 2 passwords are checked at the same time. Changing `ADMIN_EMAIL` or
`ADMIN_PASSWORD_HASH` signs out every session on the next start.

From the admin panel you can write and publish posts (Markdown with live preview, image/PDF uploads,
drafts that are visible only to you on the real page), manage categories, and read contact-form
messages and newsletter sign-ups.

## AI assistant

A chat panel on the right side of every public page answers visitors' questions with OpenAI
(`gpt-6-luna` by default, `OPENAI_MODEL` to change) using the site as its knowledge base:

- **Site content:** every static page listed in `src/knowledge/pages.tsx` (rendered to text at build time
  by `npm run knowledge:export`, part of `npm run build`; pages about past events are left out) and every
  published blog post. Blog changes re-sync automatically; the admin panel also has a manual "sync" button.
- **Training files:** PDF, DOCX, PPTX, TXT, MD, HTML or JSON uploaded in the admin panel (Asistent AI).
- The setting "Folosește conținutul site-ului" (in Setări, and as a switch on the Surse tab) can switch the
  site content off, so answers come **only from the uploaded files** (the search is filtered to uploads;
  switching it back on re-syncs the site).
- Each page, post or file can be unchecked on the Surse tab: it is then removed from the vector store and
  skipped by later syncs (it stays listed so it can be checked again, which re-indexes it). Exclusions are
  stored by source key in `ai_excluded`, so they survive syncs and `npm run ai:reset`.

Documents are indexed in an OpenAI vector store and retrieved with the `file_search` tool; the
sources each answer used are recorded in the conversation log (admin panel), not shown to visitors.
The key (`OPENAI_API_KEY`) stays on the server. OpenAI is asked not to store
responses (`store: false`).

**Cost limits** (anonymous visitors can use the chat, so every request is bounded; days are UTC):

| Limit | Value | Answer when reached |
| --- | --- | --- |
| Per request | last 6 messages of the conversation; earlier answers cut to 800 characters; 6,000 characters (and 7,000 UTF-8 bytes) in total, 2,000 per question; at most 40 messages; body ≤ 16 KB | 400 / 413 "conversation too long" |
| | at most 2 searches (`max_tool_calls`), 5 results each; answer ≤ 2,500 output tokens | |
| Per visitor | 5 questions per minute, 30 per hour | 429 |
| | `AI_IP_DAILY_TOKEN_LIMIT` tokens per day (default 200,000 ≈ 28 questions) | 429 |
| Whole site | daily number of answers (admin setting, default 1,000) | 429 |
| | `AI_DAILY_TOKEN_LIMIT` tokens per day (default 3,000,000 ≈ 400 questions) | 429 |
| | at most 5 answers being generated at the same time | 503 "try again in a few seconds" |

A visitor is an IP address; IPv6 addresses count per /64 (one host usually controls a whole /64),
IPv4-mapped IPv6 addresses count as the IPv4 address, and a source port that some proxies append
(`203.0.113.7:51234`, `[2001:db8::1]:51234`) is ignored. Tokens are the input + output tokens
OpenAI reports for each answer (a question costs about 7,000, mostly search results); failed or
interrupted answers are charged an estimate (characters / 2). The site-wide token count is stored
in the database (returned by the admin status endpoint as `tokensToday` / `dailyTokenLimit`); the
per-visitor counters are kept in memory and start again after a restart. `OPENAI_REASONING_EFFORT` can set the model's reasoning effort (default: the
model's own; `low` was tried and was not faster, and it missed a contradiction the default caught).

The visitor's current page is passed to the model only if it is a known page of the site (as quoted
data). Questions and answers are logged for 90 days for review in the admin panel (can be turned off);
older entries are deleted on start, once a day and whenever the log is opened, whatever the setting.
Interrupted answers are not logged.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API (watch mode) + Vite dev server |
| `npm run build` | Typecheck web + server, build the web app into `dist/` |
| `npm start` | Production: serve `dist/` + API on `PORT` (default 3000) |
| `npm run typecheck` | Typecheck only |
| `npm run knowledge:export` | Re-export page text for the AI assistant (`server/generated/`) |
| `npm run ai:reset -- --force` | Deletes the assistant's OpenAI vector store and files (the next sync rebuilds it) |
| `npm run admin:hash-password` | Generate the admin password hash |
| `npm run db:reseed -- --force` | **Deletes all posts and categories** and re-imports the Wix migration |

## Structure

- `src/content/`: page copy as typed data (edit text here, not in components)
- `src/pages/`: one folder per page; `home/` is the landing page, `blog/` the public blog, `admin/` the admin panel
- `src/components/ui/`: shared building blocks (`Section`, `PageHeader`, `PageMeta`, `Markdown`, …)
- `server/app.ts`: all HTTP routes; `server/db.ts` schema and queries; `server/auth.ts` login and sessions
- `server/siteRoutes.ts`: the web app's routes as the server knows them (status codes, meta tags, sitemap, legacy redirects)
- `server/seed/`: the migrated Wix posts (Markdown with JSON frontmatter), imported once
- `public/media/blog/`: images and attachments of the migrated posts; `public/docs/`: certificates and other PDFs

URLs mirror the old Wix paths (`/functionalitati`, `/post/<slug>`, `/blog/categories/<slug>`, …; the About page
moved from `/noi` to `/despre-noi`, and `/noi` redirects there) so
existing links and search rankings keep working; Wix-only URLs answer with a 301 (server) and a client-side
redirect (`src/router.tsx`). Old English pages go to their Romanian equivalent when there is one (`/en/noi` →
`/despre-noi`, `/en/blog/categories/social-economy` → `/blog/categories/economie-sociala`, …), otherwise to `/`.

## SEO and security headers (production)

- `/robots.txt` (`public/robots.txt`) keeps crawlers out of `/admin` and `/api/` and points to `/sitemap.xml`,
  which the server builds from the static pages, the service pages, the blog categories that have posts and
  every published post (`lastmod` = last update). Absolute URLs use `SITE_URL` (default `https://www.emip.ro`);
  if the domain changes, update `public/robots.txt` too.
- Pages that don't exist (unknown paths, unpublished or missing posts, unknown categories, blog pages past the
  last one, unknown service pages) get the app's 404 view **with status 404**.
- The HTML of posts and static pages carries a server-rendered `<title>`, description, canonical URL, Open Graph
  tags (`og:type` `article` with publication dates for posts) and a `summary_large_image` card, so link previews
  work without JavaScript. `og:image` is the post's cover, or `public/og-image.jpg` (1200×630) for pages without
  one. The home page adds schema.org JSON-LD for the organisation and the site, and posts add a `BlogPosting`
  with its breadcrumb (`shared/seo.ts`, used by both the server and `PageMeta`). These tags are marked
  `data-server-meta`; the web app removes them at startup and renders its own. Static page titles and
  descriptions come from `server/generated/site-pages.json` (`npm run knowledge:export`).
- `server/siteRoutes.ts` mirrors `src/router.tsx`, the service slugs in `src/content/servicii.ts` and the blog
  page size: when a route or service page is added, add it there too.
- The HTML has a strict Content-Security-Policy: scripts only from the site, no inline scripts, images from the
  site (and `data:`), videos from the site and `video.wixstatic.com` (4 migrated posts still stream from Wix),
  frames only from `youtube-nocookie.com`. Hosts of images and videos used by saved posts (https covers, Markdown
  images, `::video[]`) are allowed automatically; in the editor preview, an external image shows only after the
  post is saved. `npm run dev` sends no CSP (Vite injects inline scripts).

## Deployment

The site needs a Node host (a VPS, or a PaaS such as Railway, Render or Fly.io); static hosting (Vercel,
Netlify, GitHub Pages) is no longer enough: the blog, forms, AI assistant and admin panel need the server and its
data folder. For Railway, see [Railway](#railway) below.

```sh
npm ci
npm run build
npm start                       # or run under systemd / pm2 / a container
```

- Set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `OPENAI_API_KEY` and optionally `PORT`, `HOST`, `DATA_DIR`,
  `SITE_URL`, `AI_DAILY_TOKEN_LIMIT`, `AI_IP_DAILY_TOKEN_LIMIT` in the environment or `.env` (see `.env.example`).
- The assistant's site knowledge re-syncs automatically a few seconds after each start (only changed pages are uploaded) and after blog edits.
- Put it behind HTTPS (nginx, Caddy, or the platform's router). The session cookie is `Secure` in production,
  so HTTPS is required for logging in.
- **Persist and back up `DATA_DIR`** (default `./data`): it holds the database and uploaded files.
  On a PaaS, mount a persistent volume there.
- After each deploy, restart the process (it caches `index.html`).

**Reverse proxy, client IPs and `HOST`.** Every per-visitor limit (chat, forms, login lockout) is keyed by the
client IP. Behind a proxy, set `TRUST_PROXY` to the number of proxies in front of the server (usually `1`): the
client IP is then read from `X-Forwarded-For`, counting from the right. Two ways to get this wrong:

1. **Proxy, but `TRUST_PROXY` not set**: every visitor appears to come from the proxy's address, so the limits
   apply to everyone together: 30 chat questions per hour for the whole site, and 5 wrong passwords typed by
   anyone lock *everyone* out of the admin panel, the real admin included, for 15 minutes. The server logs a
   warning (once) when requests carry `X-Forwarded-For` while `TRUST_PROXY` is not set.
2. **`TRUST_PROXY` set, but the Node port also reachable directly**: anyone can send their own
   `X-Forwarded-For` and get fresh limits on every request. So with `TRUST_PROXY` set and no `HOST`, the server
   listens on `127.0.0.1` only (the proxy must run on the same machine). If the proxy connects over a network
   (a container network, a PaaS router such as Render, Railway or Fly.io), set `HOST=0.0.0.0` and make sure
   the port is reachable only through the proxy.

Without `TRUST_PROXY` (no proxy), the server listens on `0.0.0.0` unless `HOST` says otherwise.

### Railway

The repository deploys to Railway as it is. `railway.json` selects Railpack, which installs the dependencies, runs
`npm run build`, starts `npm start` with Node 24 (from `engines`), and waits for `/api/health` to answer before
switching traffic to a new deploy.

1. **New project → Deploy from GitHub repo** → `MonkeyWhisperer/emip.ro`, branch `main`.
2. **Volume:** add a volume to the service with mount path `/data`. A service with a volume runs as a single
   replica, and each redeploy has a few seconds of downtime (the old container stops before the new one mounts it).
3. **Variables** (service → Variables):

   | Variable | Value |
   |---|---|
   | `HOST` | `0.0.0.0`. Required: with `TRUST_PROXY` set, the server would otherwise listen on 127.0.0.1 only and Railway could not reach it. |
   | `DATA_DIR` | `/data` (the volume) |
   | `TRUST_PROXY` | `2` to start with; confirm it as described under "Client IPs on Railway" below |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `OPENAI_API_KEY` | from `.env`. Paste the password hash without the quotes around it in `.env`. |
   | `SITE_URL` | `https://www.emip.ro` (also the default) |

   Don't set `NPM_CONFIG_PRODUCTION` or `NPM_CONFIG_OMIT`: the build needs the dev dependencies (Vite, TypeScript).
4. **Networking → Generate Domain** gives the service a `*.up.railway.app` address to test on. The first start
   imports the 42 blog posts into the new, empty database.
5. **Backups:** the volume holds the database and every uploaded file. In the service's Backups tab, enable a
   daily schedule (if your plan doesn't offer backups, download copies of `/data` regularly).
6. **Custom domains:** under Networking, add `www.emip.ro` and, if the DNS provider allows it, `emip.ro`. Railway
   shows a CNAME and a TXT record for each; HTTPS certificates follow automatically once DNS resolves. A CNAME on
   the bare domain needs a provider with CNAME flattening or ALIAS/ANAME records (e.g. Cloudflare); otherwise
   redirect `emip.ro` to `www.emip.ro` at the DNS provider. Requests that do reach the server for `emip.ro` are
   redirected to `https://www.emip.ro` by the server itself.

Railway's Hobby plan is meant for personal projects; for a commercial site Railway recommends the Pro plan.

**Client IPs on Railway.** Public traffic reaches the service through Railway's edge network (Fastly), and
Railway doesn't document how that builds `X-Forwarded-For`. So confirm `TRUST_PROXY` once after the first deploy:

1. Set `DEBUG_CLIENT_IP=1` (the service redeploys).
2. Open `https://<domain>/api/debug/client-ip`: `clientIp` must be your own public IP, not an address from the
   edge network.
3. Run `curl -H "X-Forwarded-For: 1.2.3.4" https://<domain>/api/debug/client-ip`: `clientIp` must still be your
   IP, not `1.2.3.4`.
4. If either check fails, adjust `TRUST_PROXY` (it counts the entries of `xForwardedFor` from the right) and
   repeat. Then delete `DEBUG_CLIENT_IP`.
