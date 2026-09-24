import path from "node:path";
import { serve } from "@hono/node-server";
import { scheduleLogPurge } from "./ai/chat.ts";
import { openai, scheduleSiteSync } from "./ai/knowledge.ts";
import { createApp } from "./app.ts";
import { assertAuthConfigured, revokeSessionsIfCredentialsChanged, trustedProxies } from "./auth.ts";
import { seedIfNeeded } from "./seed.ts";

// `--dev`: API only (Vite serves the web app and proxies /api here).
// Otherwise: API + the built web app from dist/.
const dev = process.argv.includes("--dev");
const port = Number(process.env.PORT ?? (dev ? 3001 : 3000));

// Behind a reverse proxy (TRUST_PROXY > 0) the client address comes from X-Forwarded-For, which
// anyone who can reach the port directly could forge: listen on loopback unless HOST says
// otherwise (e.g. HOST=0.0.0.0 on a PaaS, where the platform's router is the only way in).
let hostname = process.env.HOST;
if (!hostname) {
  hostname = dev || trustedProxies() > 0 ? "127.0.0.1" : "0.0.0.0";
  if (!dev && trustedProxies() > 0) {
    console.log("[server] TRUST_PROXY is set and HOST is not: listening on 127.0.0.1 only (set HOST if the proxy connects over the network).");
  }
}

assertAuthConfigured();
revokeSessionsIfCredentialsChanged();
seedIfNeeded();
// Conversation log retention (90 days): now and once a day.
scheduleLogPurge();
// Refresh the AI assistant's knowledge after each deploy; unchanged documents are skipped.
if (!dev) scheduleSiteSync(10_000);
// Without the key the site simply doesn't show the chat button; say why in the deploy log.
if (!openai) console.warn("[ai] OPENAI_API_KEY is not set: the AI assistant is disabled and its button is hidden.");

const app = createApp({ dev, distDir: path.resolve("dist") });
serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(`[server] ${dev ? "API (dev)" : "eMIP"} listening on http://${info.address}:${info.port}`);
});
