import { useEffect, useRef, useState, type ComponentProps, type FormEvent, type KeyboardEvent } from "react";
import { useLocation } from "react-router";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { ApiError } from "../../lib/api";
import { streamChat, type ChatConfig } from "../../lib/chat";
import { SmartLink } from "../ui/SmartLink";

// Visitors don't see the answer's sources (the conversation log in the admin panel does).
type Message = { role: "user" | "assistant"; content: string; error?: boolean };

const STORAGE_KEY = "emip-chat";
const MAX_CHARS = 1900;

// Conversation survives navigation and reloads within the tab (a per-visitor convenience only).
function loadState(): { messages: Message[]; sessionId: string } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && Array.isArray(saved.messages) && typeof saved.sessionId === "string") return saved;
  } catch {}
  return { messages: [], sessionId: crypto.randomUUID() };
}

function saveState(state: { messages: Message[]; sessionId: string }) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/*
 * Answers are model output, which a visitor (or a poisoned document) can steer, so they get a
 * strict link policy: only the site's own pages, the eMIP app, the office address and phone
 * numbers stay clickable. Everything else renders as plain text, and images are never loaded.
 */
const SITE_URL = /^https:\/\/(?:www\.)?emip\.ro(?=[/?#]|$)/i;
const ALLOWED_URLS = [
  /^\/(?![/\\])/, // site paths, not protocol-relative "//host" or "/\host"
  SITE_URL,
  /^https:\/\/pro\.emip\.ro(?=[/?#]|$)/i,
  /^mailto:office@emip\.ro$/i,
  /^tel:\+?[\d\s().-]+$/i,
];

/** The URL when it is on the allow-list, otherwise "" (rendered as plain text). */
function chatUrl(url: string) {
  // URL parsing drops tabs and newlines ("/\t/host" is "//host"): reject control characters outright.
  if (/[\u0000-\u001f\u007f]/.test(url)) return "";
  return ALLOWED_URLS.some((re) => re.test(url)) ? url : "";
}

/** Absolute links to this site become app paths, so they open in the same tab like the others. */
function toSitePath(url: string) {
  const match = url.match(SITE_URL);
  return match ? `/${url.slice(match[0].length).replace(/^[/\\]+/, "")}` : url;
}

const linkClass = "font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800";

function ChatLink({ href = "", children }: ComponentProps<"a">) {
  if (!href) return <>{children}</>;
  return (
    <SmartLink href={toSitePath(href)} className={linkClass}>
      {children}
    </SmartLink>
  );
}

const markdownComponents: Components = {
  a: ChatLink,
  img: () => null,
};

function Answer({ text }: { text: string }) {
  return (
    // Tables (e.g. price breakdowns) scroll sideways inside the bubble instead of widening it.
    <div className="space-y-2 [&_li]:ml-4 [&_ol]:list-decimal [&_strong]:font-semibold [&_strong]:text-navy-950 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:text-xs [&_td]:border-t [&_td]:border-slate-200 [&_td]:py-1.5 [&_td]:pr-4 [&_td]:align-top [&_th]:pb-1.5 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-navy-950 [&_ul]:list-disc">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents} urlTransform={chatUrl}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** Below the sm breakpoint the panel covers the screen: keep the page behind it from scrolling. */
function useMobileScrollLock() {
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 639.98px)");
    const root = document.documentElement;
    const apply = () => {
      root.style.overflow = mobile.matches ? "hidden" : "";
    };
    apply();
    mobile.addEventListener("change", apply);
    return () => {
      mobile.removeEventListener("change", apply);
      root.style.overflow = "";
    };
  }, []);
}

export function ChatPanel({ config, onClose }: { config: ChatConfig; onClose: () => void }) {
  const { pathname } = useLocation();
  const [state, setState] = useState(loadState);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages } = state;

  useMobileScrollLock();
  useEffect(() => saveState(state), [state]);
  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      abortRef.current?.abort();
    };
  }, [onClose]);

  const update = (fn: (messages: Message[]) => Message[]) => setState((s) => ({ ...s, messages: fn(s.messages) }));

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    setInput("");
    const history = [...messages.filter((m) => !m.error), { role: "user" as const, content: question }];
    update(() => [...history, { role: "assistant", content: "" }]);
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const patchLast = (patch: (m: Message) => Message) =>
      update((ms) => [...ms.slice(0, -1), patch(ms[ms.length - 1])]);

    // The server only uses the last 6 messages (assistant turns cut to 800 characters), so send
    // just those: long conversations would otherwise exceed the request size limit.
    const recent = history.slice(-6).map(({ role, content }) => ({
      role,
      content: role === "assistant" && content.length > 800 ? `${content.slice(0, 800)}…` : content,
    }));

    try {
      await streamChat(
        { messages: recent, page: pathname, sessionId: state.sessionId },
        { onDelta: (delta) => patchLast((m) => ({ ...m, content: m.content + delta })) },
        controller.signal,
      );
    } catch (err) {
      if (controller.signal.aborted) {
        patchLast((m) => (m.content ? m : { ...m, content: "_Răspuns oprit._" }));
      } else {
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "Nu am putut genera un răspuns. Vă rugăm să încercați din nou.";
        patchLast((m) => ({ ...m, content: message, error: true }));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  }

  const reset = () => {
    abortRef.current?.abort();
    setState({ messages: [], sessionId: crypto.randomUUID() });
    inputRef.current?.focus();
  };

  const lastIsPending = streaming && messages[messages.length - 1]?.content === "";

  return (
    // Full screen on phones; from sm up a side panel under the sticky site header (65px: h-16 plus
    // its bottom border) and below it in z-order, so the header and its menu stay usable.
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-title"
      className="fixed inset-0 z-[60] flex flex-col bg-white shadow-2xl shadow-navy-950/30 sm:inset-auto sm:bottom-0 sm:right-0 sm:top-[65px] sm:z-40 sm:w-[420px] sm:border-l sm:border-slate-200"
    >
      <header className="flex items-center gap-3 bg-navy-950 px-4 py-3 text-white">
        <span className="flex size-9 items-center justify-center rounded-full bg-brand-400/15">
          <Sparkles aria-hidden className="size-5 text-brand-400" />
        </span>
        <h2 id="chat-title" className="min-w-0 flex-1 text-sm font-semibold text-white">
          Asistent Inteligent eMIP
        </h2>
        {messages.length > 0 && (
          <button type="button" onClick={reset} aria-label="Conversație nouă" title="Conversație nouă" className="rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white">
            <RotateCcw aria-hidden className="size-4" />
          </button>
        )}
        <button type="button" onClick={onClose} aria-label="Închide asistentul" className="rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white">
          <X aria-hidden className="size-5" />
        </button>
      </header>

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-5"
        aria-live="polite"
        aria-busy={streaming}
      >
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200">
          {config.welcome}
        </div>

        {messages.length === 0 && config.suggestions.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Întrebări sugerate">
            {config.suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-brand-500/40 bg-white px-3 py-1.5 text-left text-xs font-medium text-brand-800 hover:border-brand-600 hover:bg-brand-50"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-navy-900 px-4 py-3 text-sm leading-relaxed text-white">
              {m.content}
            </div>
          ) : (
            <div key={i} className="max-w-[92%]">
              {m.content === "" && lastIsPending && i === messages.length - 1 ? (
                // The search and the model take several seconds before the first words arrive.
                <div className="inline-flex items-center gap-3 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <span aria-hidden className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="size-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                  <span className="text-sm text-slate-600">Caut pe site…</span>
                </div>
              ) : (
                <div
                  className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-sm ring-1 ${
                    m.error ? "bg-red-50 text-red-800 ring-red-200" : "bg-white text-slate-700 ring-slate-200"
                  }`}
                >
                  <Answer text={m.content} />
                </div>
              )}
            </div>
          ),
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-200 bg-white p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-300 px-3 py-2 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-500/20">
          <label htmlFor="chat-input" className="sr-only">
            Întrebarea dumneavoastră
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Scrieți o întrebare…"
            // One line = 20px text + 2 x 6px padding = 32px, the send button's height, so the text is
            // vertically centred in the box; longer messages grow upwards with the button at the bottom.
            className="max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm leading-5 text-navy-950 placeholder:text-slate-400 focus:outline-none [field-sizing:content]"
          />
          {streaming ? (
            <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Oprește răspunsul" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-navy-900 hover:bg-slate-300">
              <Square aria-hidden className="size-3.5 fill-current" />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} aria-label="Trimite" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-400 text-navy-950 hover:bg-brand-300 disabled:bg-slate-200 disabled:text-slate-400">
              <ArrowUp aria-hidden className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-2 px-1 text-[11px] leading-snug text-slate-500">
          Asistentul AI poate greși. Vezi{" "}
          <SmartLink href="/politica-de-confidentialitate" className="underline hover:text-slate-700">
            politica de confidențialitate
          </SmartLink>
          .
        </p>
      </form>
    </aside>
  );
}
