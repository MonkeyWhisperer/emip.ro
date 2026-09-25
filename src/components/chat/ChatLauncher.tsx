import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { fetchChatConfig, type ChatConfig } from "../../lib/chat";

// The panel (with its Markdown renderer) is a separate chunk, fetched once the assistant is known to
// be on and kept as a plain component: React.lazy would hold the panel back for a moment on its first
// render even with the chunk already loaded, and the panel must open at once.
type Panel = typeof import("./ChatPanel").ChatPanel;
let panelPromise: Promise<Panel> | undefined;
const loadPanel = () => (panelPromise ??= import("./ChatPanel").then((m) => m.ChatPanel));

/** Floating "ask the assistant" button, bottom right, shown only when the assistant is enabled. */
export function ChatLauncher() {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [ChatPanel, setChatPanel] = useState<Panel | null>(null);
  const [open, setOpen] = useState(false);
  /** The panel has been opened: the button that comes back on close appears without the fade-up. */
  const [opened, setOpened] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Don't compete with the page's own loading.
    const timer = setTimeout(() => {
      fetchChatConfig()
        .then((c) => {
          if (!c.enabled) return;
          setConfig(c);
          // Fetched now, so it opens at once even without a hover first (touch screens).
          loadPanel()
            .then((panel) => setChatPanel(() => panel))
            .catch(() => (panelPromise = undefined)); // retried on hover, focus or click
        })
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  /** A click before the panel's code has arrived still opens it, as soon as it has. */
  const ensurePanel = () => {
    if (!ChatPanel) {
      loadPanel()
        .then((panel) => setChatPanel(() => panel))
        .catch(() => (panelPromise = undefined));
    }
  };

  if (!config) return null;

  return (
    <>
      {/* A round icon button, so it never hides page controls (booking buttons, footer links);
          the label slides out on hover and keyboard focus. The mint ring keeps it visible over
          the navy header, footer and dark sections. The label stays in the accessible name. The
          button sets the label's text size: the collapsed label's line must be no taller than the
          20px icon, or the closed button becomes an oval (a 16px/24px line made it 52×56).
          It stays put at the end of the page too; the footer leaves room for it under the legal links. */}
      {!open && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            ensurePanel();
            setOpen(true);
            setOpened(true);
          }}
          onPointerEnter={ensurePanel}
          onFocus={ensurePanel}
          aria-haspopup="dialog"
          className={`group fixed bottom-5 right-5 z-[55] flex items-center rounded-full bg-navy-950 p-4 text-sm font-semibold text-white shadow-xl shadow-navy-950/30 ring-1 ring-brand-400/40 transition-[background-color,box-shadow] hover:bg-navy-800 hover:ring-2 hover:ring-brand-400/80 focus-visible:ring-brand-400/80 ${opened ? "" : "animate-fade-up"}`}
        >
          <Sparkles aria-hidden className="size-5 shrink-0 text-brand-400" />
          {/* The label opens by animating a grid column from 0fr to 1fr, i.e. to exactly its text's
              width, so the easing runs to the very end (a max-width larger than the text would stop
              the growth early and the icon would halt abruptly). 500ms both ways; closing waits
              200ms (the resting state's delay) so a pointer that just slips off doesn't snap it
              shut, opening starts at once (the hover state's delay). */}
          <span className="grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] delay-200 duration-500 ease-in-out group-hover:grid-cols-[1fr] group-hover:opacity-100 group-hover:delay-0 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100 group-focus-visible:delay-0">
            <span className="min-w-0 overflow-hidden whitespace-nowrap">
              <span className="pl-2">Întrebați asistentul</span>
            </span>
          </span>
        </button>
      )}
      {open && ChatPanel && (
        <ChatPanel
          config={config}
          onClose={() => {
            setOpen(false);
            // The button re-mounts after close; move focus back to it.
            requestAnimationFrame(() => buttonRef.current?.focus());
          }}
        />
      )}
    </>
  );
}
