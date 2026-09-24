import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { getConnInfo } from "@hono/node-server/conninfo";
import { db, getMeta, setMeta } from "./db.ts";
import { RateLimiter, rateLimitKey } from "./rateLimit.ts";

// Single admin account, configured through the environment (see .env.example):
//   ADMIN_EMAIL          login email
//   ADMIN_PASSWORD_HASH  output of `npm run admin:hash-password`

const COOKIE = "emip_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

const scryptAsync = (password: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );

/** Format: scrypt$N$r$p$salt(base64)$hash(base64) */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, SCRYPT.keylen, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, N, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return timingSafeEqual(actual, expected);
}

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const adminEmail = () => (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const adminHash = () => process.env.ADMIN_PASSWORD_HASH ?? "";

export function assertAuthConfigured() {
  if (!adminEmail() || !adminHash().startsWith("scrypt$")) {
    console.warn("[auth] ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not set: the admin panel will reject every login.");
  }
}

export async function checkCredentials(email: string, password: string): Promise<boolean> {
  const configured = adminHash();
  // Always run scrypt so response time doesn't reveal whether the email matched.
  const passwordOk = configured
    ? await verifyPassword(password, configured)
    : (await hashPassword(password), false);
  return safeEqual(email.trim().toLowerCase(), adminEmail()) && passwordOk && adminEmail() !== "";
}

// ---- sessions ------------------------------------------------------------------

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export function createSession(c: Context, secure: boolean) {
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)").run(tokenHash(token), Date.now() + SESSION_TTL_MS);
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function destroySession(c: Context) {
  const token = getCookie(c, COOKIE);
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
  deleteCookie(c, COOKIE, { path: "/" });
}

export function hasValidSession(c: Context): boolean {
  const token = getCookie(c, COOKIE);
  if (!token) return false;
  const row = db.prepare("SELECT expires_at FROM sessions WHERE token_hash = ?").get(tokenHash(token)) as
    | { expires_at: number }
    | undefined;
  return !!row && row.expires_at > Date.now();
}

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  if (!hasValidSession(c)) return c.json({ error: "Autentificare necesară." }, 401);
  await next();
};

// ---- request hardening ---------------------------------------------------------

/**
 * Client IP for rate limiting. Behind a reverse proxy (TRUST_PROXY = number of proxies,
 * usually 1) the address comes from X-Forwarded-For, counted from the RIGHT: the left
 * entries are supplied by the client and can be forged, the right ones by our proxies.
 */
export function clientIp(c: Context): string {
  const hops = trustedProxies();
  if (hops > 0) {
    const chain = (c.req.header("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const ip = chain[chain.length - hops];
    if (ip) return ip;
  }
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** Key for the per-client rate limits: the client IP, with IPv6 clients grouped per /64. */
export const clientKey = (c: Context) => rateLimitKey(clientIp(c));

/** TRUST_PROXY: how many reverse proxies in front of the server append to X-Forwarded-For (0 = none). */
export function trustedProxies(): number {
  const hops = Number(process.env.TRUST_PROXY ?? 0);
  return Number.isInteger(hops) && hops > 0 ? hops : 0;
}

let proxyWarningShown = false;
/**
 * Behind a proxy without TRUST_PROXY every visitor appears to come from the proxy's address,
 * so the per-IP limits (chat, forms, login lockout) are shared by everyone. Warn once.
 */
export const warnUntrustedProxy: MiddlewareHandler = async (c, next) => {
  if (!proxyWarningShown && trustedProxies() === 0 && c.req.header("x-forwarded-for")) {
    proxyWarningShown = true;
    console.warn(
      "[server] Requests carry X-Forwarded-For but TRUST_PROXY is not set: all clients share the proxy's address for rate limits " +
        "(chat, forms, login lockout). Set TRUST_PROXY=1 when the server runs behind one reverse proxy (see README, Deployment).",
    );
  }
  await next();
};

/**
 * Rejects cross-site state-changing requests. The session cookie is already
 * SameSite=Strict; this is defence in depth for older browsers.
 */
export const sameOrigin: MiddlewareHandler = async (c, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const origin = c.req.header("origin");
    const host = (trustedProxies() > 0 && c.req.header("x-forwarded-host")) || c.req.header("host");
    let originHost: string | undefined;
    try {
      originHost = origin ? new URL(origin).host : undefined;
    } catch {
      originHost = undefined;
    }
    if (!originHost || !host || originHost !== host) {
      return c.json({ error: "Cerere respinsă (origine invalidă)." }, 403);
    }
  }
  await next();
};

// Login throttling: 5 failures per IP per 15 minutes is a hard block for that IP.
// Failures across all IPs only slow logins down (never block them), so a distributed
// attacker cannot lock the real admin out.
const failuresPerIp = new RateLimiter(5, 15 * 60 * 1000);
const failuresGlobal = new RateLimiter(Number.MAX_SAFE_INTEGER, 15 * 60 * 1000);
const GLOBAL_SLOWDOWN_AFTER = 30;

/** Delay to apply before checking credentials while many logins are failing site-wide. */
function loginDelayMs(): number {
  const failures = failuresGlobal.count("all");
  return failures > GLOBAL_SLOWDOWN_AFTER ? Math.min(5000, (failures - GLOBAL_SLOWDOWN_AFTER) * 200) : 0;
}

// Parallel attempts must not get around the slowdown: while it is active, attempts pass one
// at a time through a gate, each after the delay (spaced out, not waiting side by side), and
// the number of waiting and running credential checks is capped.
const MAX_CONCURRENT_CHECKS = 2;
const MAX_WAITING = 20;
let gate: Promise<void> = Promise.resolve();
let waiting = 0;
let checking = 0;

/**
 * - "locked": this client (see clientKey) had 5 failed logins in the last 15 minutes
 * - "busy": too many attempts are already waiting or being checked (answer 429, try again soon)
 */
export type LoginResult = "ok" | "invalid" | "locked" | "busy";

/** One login attempt by the client with rate-limit key `key`, under the throttles above. */
export async function attemptLogin(key: string, email: string, password: string): Promise<LoginResult> {
  if (failuresPerIp.blocked(key)) return "locked";
  const delay = loginDelayMs();
  if (delay) {
    if (waiting >= MAX_WAITING) return "busy";
    waiting++;
    const turn = gate.then(() => new Promise<void>((resolve) => setTimeout(resolve, delay)));
    gate = turn;
    try {
      await turn;
    } finally {
      waiting--;
    }
    // Other attempts from the same client may have failed while this one waited.
    if (failuresPerIp.blocked(key)) return "locked";
  }
  if (checking >= MAX_CONCURRENT_CHECKS) return "busy";
  checking++;
  try {
    if (await checkCredentials(email, password)) {
      failuresPerIp.reset(key);
      return "ok";
    }
    failuresPerIp.add(key);
    failuresGlobal.add("all");
    return "invalid";
  } finally {
    checking--;
  }
}

/**
 * Sessions are only valid for the credentials they were created with: when ADMIN_EMAIL or
 * ADMIN_PASSWORD_HASH changes (e.g. after a suspected leak), all sessions are revoked on start.
 */
export function revokeSessionsIfCredentialsChanged() {
  const fingerprint = createHash("sha256").update(`${adminEmail()}\n${adminHash()}`).digest("hex");
  if (getMeta("auth_fingerprint") !== fingerprint) {
    db.exec("DELETE FROM sessions");
    setMeta("auth_fingerprint", fingerprint);
  }
}
