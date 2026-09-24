// Renders the static pages (src/knowledge/pages.tsx) with Vite SSR and writes their visible
// text to server/generated/site-pages.json, which the AI assistant's site sync uploads.
// Runs as part of `npm run build`; run it alone with `npm run knowledge:export`.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "server", "generated", "site-pages.json");

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const decodeEntities = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, e: string) =>
    e[0] !== "#"
      ? (ENTITIES[e] ?? match)
      : String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))),
  );

type RenderedPage = { path: string; title: string; html: string; error?: string };

/** Visible text of a React-rendered fragment, lightly structured as Markdown. */
function htmlToText(html: string): string {
  const text = html
    .replace(/<(script|style|svg|title|meta|noscript)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(meta|link)[^>]*>/gi, "")
    .replace(/<img[^>]*alt="([^"]+)"[^>]*>/gi, " [imagine: $1] ")
    .replace(/<h([1-6])[^>]*>/gi, (_m, level: string) => `\n\n${"#".repeat(Math.min(Number(level) + 1, 6))} `)
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<(td|th)[^>]*>/gi, " | ")
    .replace(/<\/(p|div|section|article|header|footer|ul|ol|tr|table|blockquote|dl|dd|dt|figure|nav|form|label)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(a|button|span)>/gi, " ")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(text)
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const vite = await createServer({
  root: ROOT,
  configFile: path.join(ROOT, "vite.config.ts"),
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const mod = (await vite.ssrLoadModule("/src/knowledge/pages.tsx")) as { renderPages(): RenderedPage[] };
  const pages = mod.renderPages().map((p) => {
    // The page's <meta name="description"> (rendered by PageMeta); the server reuses it for link previews.
    const description = p.html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    return {
      path: p.path,
      title: decodeEntities(p.title),
      ...(description && { description: decodeEntities(description) }),
      text: htmlToText(p.html),
      error: p.error,
    };
  });
  for (const p of pages) {
    if (p.error) console.warn(`[knowledge] ${p.path}: render failed: ${p.error}`);
    else if (p.text.length < 200) console.warn(`[knowledge] ${p.path}: very little text (${p.text.length} chars); is the page still a placeholder?`);
  }
  const usable = pages.filter((p) => !p.error && p.text.length >= 200).map(({ error: _e, ...p }) => p);
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(usable, null, 2) + "\n", "utf8");
  console.log(`[knowledge] wrote ${usable.length} pages (${usable.reduce((n, p) => n + p.text.length, 0)} chars) to ${path.relative(ROOT, OUT)}`);
} finally {
  await vite.close();
}
