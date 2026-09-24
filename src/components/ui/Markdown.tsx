import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, Download, FileText } from "lucide-react";
import { SmartLink } from "./SmartLink";

/*
 * Markdown renderer for blog posts and long-form pages (legal texts etc.).
 * Standard GFM plus a few block directives, each on its own line:
 *   ::youtube[VIDEO_ID]
 *   ::video[https://…/file.mp4]
 *   :::details Title          (closed by a line with just :::)
 *   📎 [File name.pdf](/media/…/file.pdf) (PDF, 231 KB)
 */

type Block =
  | { kind: "md"; text: string }
  | { kind: "youtube"; id: string }
  | { kind: "video"; src: string }
  | { kind: "details"; title: string; body: string }
  | { kind: "file"; name: string; href: string; info?: string };

const unescape = (s: string) => s.replace(/\\([\\`*_[\]<>])/g, "$1");

/**
 * Directive URLs bypass react-markdown's URL sanitizer, so allow only site paths and https.
 * "//host" and "/\host" are protocol-relative links to other sites and are rejected.
 */
const safeUrl = (url: string) => (/^\/(?![/\\])/.test(url) || /^https:\/\//i.test(url) ? url : undefined);

/** react-markdown's default sanitizer drops tel: links; allow plain phone numbers. */
const urlTransform = (url: string) => (/^tel:\+?[\d\s().-]+$/i.test(url) ? url : defaultUrlTransform(url));

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.split(/\r?\n/);
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.join("").trim()) blocks.push({ kind: "md", text: buffer.join("\n") });
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^::youtube\[([\w-]{11})\]\s*$/))) {
      flush();
      blocks.push({ kind: "youtube", id: m[1] });
    } else if ((m = line.match(/^::video\[(\S+)\]\s*$/)) && safeUrl(m[1])) {
      flush();
      blocks.push({ kind: "video", src: m[1] });
    } else if ((m = line.match(/^:::details\s+(.*)$/))) {
      flush();
      const body: string[] = [];
      while (++i < lines.length && lines[i].trim() !== ":::") body.push(lines[i]);
      blocks.push({ kind: "details", title: m[1].trim(), body: body.join("\n") });
    } else if ((m = line.match(/^📎 \[(.+)\]\((\S+)\)(?: \((.+)\))?\s*$/)) && safeUrl(m[2])) {
      flush();
      blocks.push({ kind: "file", name: unescape(m[1]), href: m[2], info: m[3] });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return blocks;
}

const components: Components = {
  a: ({ href = "", children, node: _node, ...rest }) => (
    <SmartLink href={href} {...rest}>
      {children}
    </SmartLink>
  ),
  img: ({ node: _node, alt = "", ...rest }) => (
    <img alt={alt} loading="lazy" decoding="async" className="rounded-xl" {...rest} />
  ),
  // Wide tables scroll sideways inside the wrapper; scroll-shadows-x (index.css) shades the edge
  // that still hides columns, so the cut-off column reads as "scroll me" rather than a layout bug.
  table: ({ node: _node, ...rest }) => (
    <div className="not-prose scroll-shadows-x my-8 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm [&_a]:font-medium [&_a]:text-brand-700 [&_a]:underline [&_a]:decoration-brand-300 [&_a]:underline-offset-2 [&_td]:border-t [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-3 [&_td]:align-top sm:[&_td]:px-4 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-3 [&_th]:font-semibold [&_th]:text-navy-950 sm:[&_th]:px-4" {...rest} />
    </div>
  ),
};

function Md({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={urlTransform}>
      {children}
    </ReactMarkdown>
  );
}

function BlockView({ block }: { block: Block }): ReactNode {
  switch (block.kind) {
    case "md":
      return <Md>{block.text}</Md>;
    case "youtube":
      return (
        <div className="not-prose my-8 aspect-video overflow-hidden rounded-xl bg-navy-950">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${block.id}`}
            title="Video YouTube"
            loading="lazy"
            // The server sends Referrer-Policy: no-referrer, and YouTube refuses to play embeds
            // without a Referer (player "Error 153"). Send only the site's origin to YouTube.
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        </div>
      );
    case "video":
      return (
        <video controls preload="metadata" className="not-prose my-8 w-full rounded-xl bg-navy-950">
          <source src={block.src} type="video/mp4" />
        </video>
      );
    case "details":
      return (
        // Only the summary opts out of prose styles: a not-prose ancestor would also strip the
        // typography from the body (Tailwind Typography ignores everything under .not-prose).
        <details className="group my-4 rounded-xl border border-slate-200 bg-white open:shadow-sm">
          <summary className="not-prose flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-navy-950 [&::-webkit-details-marker]:hidden">
            {block.title}
            <ChevronDown aria-hidden className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
            <Md>{block.body}</Md>
          </div>
        </details>
      );
    case "file":
      return (
        <a
          href={block.href}
          target="_blank"
          rel="noopener noreferrer"
          className="not-prose my-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 no-underline transition-colors hover:border-brand-500 hover:bg-brand-50"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm">
            <FileText aria-hidden className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 break-words font-semibold text-navy-950">{block.name}</span>
            {block.info && <span className="block text-sm text-slate-500">{block.info}</span>}
          </span>
          <Download aria-hidden className="size-5 shrink-0 text-slate-400" />
        </a>
      );
  }
}

export const proseClass =
  "prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-navy-950 prose-a:font-medium prose-a:text-brand-700 prose-a:decoration-brand-300 prose-a:underline-offset-2 hover:prose-a:text-brand-800 prose-strong:text-navy-950 prose-blockquote:border-l-brand-500 prose-blockquote:rounded-r-lg prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:font-normal prose-blockquote:not-italic [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none prose-img:mx-auto prose-li:marker:text-brand-600";

type Props = { source: string } & Omit<ComponentProps<"div">, "children">;

export function Markdown({ source, className = "", ...rest }: Props) {
  return (
    <div className={`${proseClass} ${className}`} {...rest}>
      {parseBlocks(source).map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}
