import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { proseClass } from "../../ui/Markdown";
import { fullUrl, sameSitePath } from "./shared";

/*
 * Renders an assistant answer from the conversation log. The answers are model output that any
 * visitor can steer, shown to the site's most privileged user, so unlike the blog's <Markdown>:
 * - no images, videos or embeds (nothing loads from another server when the log is opened);
 * - no ::video, 📎 attachment or :::details directives (those lines stay plain text);
 * - only links to this site are clickable (opened in a new tab); any other link is plain text
 *   followed by its full address, with look-alike domains in their punycode (xn--) form;
 * - raw HTML is shown as text (react-markdown's default), javascript: & co. are dropped.
 */

type HastNode = { type?: string; value?: string; children?: HastNode[] };

const textOf = (node: HastNode | undefined): string =>
  !node ? "" : node.type === "text" ? (node.value ?? "") : (node.children ?? []).map(textOf).join("");

const sameText = (a: string, b: string) => a.replace(/\/$/, "") === b.replace(/\/$/, "");

const components: Components = {
  a: ({ href, children, node }) => {
    const path = sameSitePath(href);
    if (path) {
      return (
        <a href={path} target="_blank" rel="noopener">
          {children}
          <span className="sr-only"> (se deschide într-o filă nouă)</span>
        </a>
      );
    }
    if (!href) return <span>{children}</span>;
    const url = fullUrl(href);
    const text = textOf(node as HastNode | undefined).trim();
    // An autolinked address already shows itself; anything else also shows where it would lead.
    const visible = sameText(text, url) || url === `mailto:${text}`;
    return (
      <span data-offsite-link="">
        {children}
        {!visible && <span className="text-slate-500 wrap-anywhere"> ({url})</span>}
      </span>
    );
  },
  img: ({ alt, src }) => (
    <span data-blocked-image="" className="text-slate-500">
      [imagine neafișată{alt ? `: ${alt}` : ""}
      {typeof src === "string" && src ? <span className="wrap-anywhere"> ({fullUrl(src)})</span> : null}]
    </span>
  ),
  table: ({ node: _node, ...rest }) => (
    <div className="not-prose my-2 overflow-x-auto rounded-lg border border-slate-200">
      <table
        className="w-full text-left text-xs [&_td]:border-t [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold"
        {...rest}
      />
    </div>
  ),
};

// Compact typography (the site's prose styles are sized for articles). Code keeps normal word
// spacing: the admin shell's extra word spacing would widen every space in monospace text.
const answerClass =
  "prose-sm text-slate-700 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mb-1.5 prose-headings:mt-3 prose-headings:text-base prose-pre:my-2 [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_code]:[word-spacing:normal]";

export function SafeAnswer({ source }: { source: string }) {
  return (
    <div className={`${proseClass} ${answerClass} break-words`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
