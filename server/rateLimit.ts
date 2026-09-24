import { isIPv4, isIPv6 } from "node:net";

/** Most keys any limiter keeps; beyond that the oldest entries are dropped (bounded memory and CPU). */
const MAX_KEYS = 50_000;
const PRUNE_EVERY_MS = 60_000;

/** In-memory fixed-window counter per key (usually a client address, see rateLimitKey). */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  private readonly limit: number;
  private readonly windowMs: number;
  private lastPrune = 0;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /** Counts one hit; false once the key is over the limit for the current window. */
  hit(key: string): boolean {
    return this.add(key) <= this.limit;
  }

  /** Whether the key is already at the limit (without counting a hit). */
  blocked(key: string): boolean {
    const e = this.hits.get(key);
    return !!e && e.resetAt > Date.now() && e.count >= this.limit;
  }

  count(key: string): number {
    const e = this.hits.get(key);
    return e && e.resetAt > Date.now() ? e.count : 0;
  }

  add(key: string): number {
    const now = Date.now();
    this.prune(now);
    const e = this.hits.get(key);
    if (e && e.resetAt > now) return ++e.count;
    // (Re)insert so the map stays ordered by window start: the first entries are the oldest.
    this.hits.delete(key);
    if (this.hits.size >= MAX_KEYS) {
      // Full: drop the oldest tenth in one pass (cheaper than evicting one key per insert).
      let drop = MAX_KEYS / 10;
      for (const k of this.hits.keys()) {
        this.hits.delete(k);
        if (--drop <= 0) break;
      }
    }
    this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
    return 1;
  }

  reset(key: string) {
    this.hits.delete(key);
  }

  /** Drops expired windows, at most once a minute whatever the size (the cap bounds the rest). */
  private prune(now: number) {
    if (now - this.lastPrune < PRUNE_EVERY_MS) return;
    this.lastPrune = now;
    for (const [key, e] of this.hits) if (e.resetAt <= now) this.hits.delete(key);
  }
}

/** The 8 hextets of an IPv6 address ("::" expanded, an embedded IPv4 tail converted), or null. */
function ipv6Hextets(ip: string): number[] | null {
  let addr = ip;
  // Embedded IPv4 tail, e.g. ::ffff:192.0.2.1 or 64:ff9b::192.0.2.1.
  const v4 = addr.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4) {
    if (!isIPv4(v4[2])) return null;
    const [a, b, c, d] = v4[2].split(".").map(Number);
    addr = `${v4[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const parse = (s: string) => (s ? s.split(":").map((h) => parseInt(h, 16)) : []);
  const head = parse(halves[0]);
  const tail = halves.length === 2 ? parse(halves[1]) : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  const all = [...head, ...Array<number>(Math.max(0, missing)).fill(0), ...tail];
  return all.length === 8 && all.every((h) => Number.isInteger(h) && h >= 0 && h <= 0xffff) ? all : null;
}

/**
 * Rate-limit key for a client address. IPv4 addresses are used as they are; IPv4-mapped IPv6
 * addresses (::ffff:192.0.2.1) count as the IPv4 address; other IPv6 clients are limited per
 * /64, because one host usually controls a whole /64 and could otherwise rotate addresses
 * to get fresh limits.
 */
export function rateLimitKey(ip: string): string {
  let addr = ip.trim().toLowerCase();
  // Some proxies (e.g. Azure App Service) append the client's source port: "a.b.c.d:port",
  // "[v6]:port". A new port for every connection must not mean a new key.
  const bracketed = addr.match(/^\[([^\]]*)\](?::\d{1,5})?$/);
  addr = bracketed ? bracketed[1] : addr.replace(/^(\d{1,3}(?:\.\d{1,3}){3}):\d{1,5}$/, "$1");
  addr = addr.replace(/%.*$/, ""); // zone id (fe80::1%eth0)
  if (isIPv4(addr)) return addr;
  if (!isIPv6(addr)) return addr || "unknown";
  const h = ipv6Hextets(addr);
  if (!h) return addr;
  if (h.slice(0, 5).every((x) => x === 0) && h[5] === 0xffff) {
    return [h[6] >> 8, h[6] & 0xff, h[7] >> 8, h[7] & 0xff].join(".");
  }
  return `${h.slice(0, 4).map((x) => x.toString(16)).join(":")}::/64`;
}
