// Pure text transformations behind the Markdown toolbar. Each returns the range of
// the current value to replace, the replacement, and the selection to set afterwards
// (absolute offsets in the new value).

export type Edit = { start: number; end: number; text: string; selStart: number; selEnd: number };

export type LineStyle = "h2" | "h3" | "ul" | "ol" | "quote";

const INLINE_PLACEHOLDER = { "**": "text îngroșat", _: "text cursiv" } as const;

/** Bold / italic: wraps the selection, or unwraps it if it is already wrapped. */
export function wrapInline(value: string, start: number, end: number, marker: "**" | "_"): Edit {
  // Double-click selections often include the trailing space; keep it outside the markers.
  while (end > start && /\s/.test(value[end - 1])) end--;
  const m = marker.length;
  const selected = value.slice(start, end);

  if (selected && value.slice(start - m, start) === marker && value.slice(end, end + m) === marker) {
    return { start: start - m, end: end + m, text: selected, selStart: start - m, selEnd: end - m };
  }
  if (selected.length > 2 * m && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(m, -m);
    return { start, end, text: inner, selStart: start, selEnd: start + inner.length };
  }
  const inner = selected || INLINE_PLACEHOLDER[marker];
  return { start, end, text: `${marker}${inner}${marker}`, selStart: start + m, selEnd: start + m + inner.length };
}

const LINE_PLACEHOLDER: Record<LineStyle, string> = {
  h2: "Titlu secțiune",
  h3: "Subtitlu",
  ul: "Element listă",
  ol: "Element listă",
  quote: "Citat",
};

const HEADING = /^#{1,6}\s+/;
const BULLET = /^\s*[-*+]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;
const QUOTE = /^>\s?/;

/** Headings, lists and quotes: applied to every line touched by the selection (toggles off if all lines have it). */
export function styleLines(value: string, start: number, end: number, style: LineStyle): Edit {
  if (end > start && value[end - 1] === "\n") end--;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nl = value.indexOf("\n", end);
  const lineEnd = nl === -1 ? value.length : nl;
  const lines = value.slice(lineStart, lineEnd).split("\n");

  if (lines.length === 1 && lines[0].trim() === "") {
    const prefix = style === "h2" ? "## " : style === "h3" ? "### " : style === "ul" ? "- " : style === "ol" ? "1. " : "> ";
    const placeholder = LINE_PLACEHOLDER[style];
    return {
      start: lineStart,
      end: lineEnd,
      text: prefix + placeholder,
      selStart: lineStart + prefix.length,
      selEnd: lineStart + prefix.length + placeholder.length,
    };
  }

  const content = lines.filter((l) => l.trim() !== "");
  let out: string[];
  switch (style) {
    case "h2":
    case "h3": {
      const prefix = style === "h2" ? "## " : "### ";
      const has = content.every((l) => l.startsWith(prefix) && !l.startsWith(`${prefix.trim()}#`));
      out = lines.map((l) => (l.trim() === "" ? l : has ? l.slice(prefix.length) : prefix + l.replace(HEADING, "")));
      break;
    }
    case "ul": {
      const has = content.every((l) => BULLET.test(l));
      out = lines.map((l) => (l.trim() === "" ? l : has ? l.replace(BULLET, "") : `- ${l.replace(NUMBER, "")}`));
      break;
    }
    case "ol": {
      const has = content.every((l) => NUMBER.test(l));
      let n = 0;
      out = lines.map((l) => (l.trim() === "" ? l : has ? l.replace(NUMBER, "") : `${++n}. ${l.replace(BULLET, "")}`));
      break;
    }
    case "quote": {
      const has = content.every((l) => QUOTE.test(l));
      out = lines.map((l) => (has ? l.replace(QUOTE, "") : l.trim() === "" ? ">" : `> ${l}`));
      break;
    }
  }
  const text = out.join("\n");
  const collapsed = start === end && lines.length === 1;
  return {
    start: lineStart,
    end: lineEnd,
    text,
    selStart: collapsed ? lineStart + text.length : lineStart,
    selEnd: lineStart + text.length,
  };
}

/**
 * Inserts `block` as its own paragraph at the selection (replacing it), adding blank
 * lines around it as needed. `select` is a [from, to] range inside `block` to select.
 */
export function insertBlock(value: string, start: number, end: number, block: string, select?: [number, number]): Edit {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trail = after.startsWith("\n\n") ? "" : after.startsWith("\n") || after === "" ? "\n" : "\n\n";
  const text = lead + block + trail;
  const base = start + lead.length;
  const [a, b] = select ?? [block.length, block.length];
  return { start, end, text, selStart: base + a, selEnd: base + b };
}

/** [text](url) around the selection; selects the text when it is a placeholder. */
export function insertLink(value: string, start: number, end: number, url: string): Edit {
  while (end > start && /\s/.test(value[end - 1])) end--;
  const selected = value.slice(start, end).replace(/[[\]]/g, "");
  const label = selected || "textul linkului";
  const text = `[${label}](${url})`;
  return selected
    ? { start, end, text, selStart: start + text.length, selEnd: start + text.length }
    : { start, end, text, selStart: start + 1, selEnd: start + 1 + label.length };
}

// ---- directive templates ----------------------------------------------------------

export const TABLE_TEMPLATE = "| Coloana 1 | Coloana 2 | Coloana 3 |\n| --- | --- | --- |\n| Text | Text | Text |\n| Text | Text | Text |";
export const TABLE_SELECT: [number, number] = [2, 11];

export const DETAILS_TITLE = "Titlul secțiunii";
export const DETAILS_TEMPLATE = `:::details ${DETAILS_TITLE}\nConținutul secțiunii, vizibil după deschidere.\n:::`;
export const DETAILS_SELECT: [number, number] = [11, 11 + DETAILS_TITLE.length];

/** Markdown image; the alt text is selected so it can be typed over. */
export function imageMarkdown(url: string, fileName: string): { block: string; select: [number, number] } {
  const alt =
    fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[[\]]/g, "")
      .replace(/[-_]+/g, " ")
      .trim() || "Descrierea imaginii";
  return { block: `![${alt}](${url})`, select: [2, 2 + alt.length] };
}

/** Same convention as the migrated posts: "248 KB", "1.57 MB". */
export function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

/** The renderer's download line: 📎 [Name.pdf](/media/…) (PDF, 231 KB) */
export function fileMarkdown(url: string, fileName: string, size: number) {
  const name = fileName.replace(/([\\`*_[\]<>])/g, "\\$1");
  const ext = (fileName.match(/\.([a-z0-9]+)$/i)?.[1] ?? "fișier").toUpperCase();
  return `📎 [${name}](${url}) (${ext}, ${formatFileSize(size)})`;
}

/** Accepts a bare 11-character ID or any common YouTube URL. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.pathname === "/watch" ? url.searchParams.get("v") : (url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]+)/)?.[1] ?? null);
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** Normalises what the admin typed as a link target; null if it can't be a link. */
export function normalizeLinkUrl(input: string): string | null {
  const s = input.trim();
  if (!s || /\s/.test(s)) return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return s;
  if (s.startsWith("/") || s.startsWith("#")) return s;
  if (/^[^\s/@]+@[^\s@]+\.[a-z]{2,}$/i.test(s)) return `mailto:${s}`;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(s)) return `https://${s}`;
  return null;
}
