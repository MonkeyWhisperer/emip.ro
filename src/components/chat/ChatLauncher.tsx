import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { fetchChatConfig, type ChatConfig } from "../../lib/chat";

// The panel (with its Markdown renderer) is only downloaded when someone shows interest.
const loadPanel = () => import("./ChatPanel");
const ChatPanel = lazy(() => loadPanel().then((m) => ({ default: m.ChatPanel })));

/** Floating "ask the assistant" button, bottom right, shown only when the assistant is enabled. */
export function ChatLauncher() {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Don't compete with the page's own loading.
    const timer = setTimeout(() => {
      fetchChatConfig()
        .then((c) => c.enabled && setConfig(c))
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!config) return null;

  return (
    <>
      {/* A round icon button, so it never hides page controls (booking buttons, footer links);
          the label slides out on hover and keyboard focus. The mint ring keeps it visible over
          the navy header, footer and dark sections. The label stays in the accessible name.
          It stays put at the end of the page too; the footer leaves room for it under the legal links. */}
      {!open && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          onPointerEnter={() => void loadPanel()}
          onFocus={() => void loadPanel()}
          aria-haspopup="dialog"
          className="group fixed bottom-5 right-5 z-[55] flex items-center rounded-full bg-navy-950 p-4 text-white shadow-xl shadow-navy-950/30 ring-1 ring-brand-400/40 transition-[background-color,box-shadow] hover:bg-navy-800 hover:ring-2 hover:ring-brand-400/80 focus-visible:ring-brand-400/80 animate-fade-up"
        >
          <Sparkles aria-hidden className="size-5 shrink-0 text-brand-400 transition-transform group-hover:rotate-12" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-[max-width,margin,opacity] duration-300 ease-out group-hover:ml-2 group-hover:max-w-48 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-48 group-focus-visible:opacity-100">
            Întrebați asistentul
          </span>
        </button>
      )}
      {open && (
        <Suspense fallback={null}>
          <ChatPanel
            config={config}
            onClose={() => {
              setOpen(false);
              // The button re-mounts after close; move focus back to it.
              requestAnimationFrame(() => buttonRef.current?.focus());
            }}
          />
        </Suspense>
      )}
    </>
  );
}
