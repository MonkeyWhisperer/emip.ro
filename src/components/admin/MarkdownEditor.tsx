import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import {
  Bold,
  ChevronsDownUp,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  LoaderCircle,
  Paperclip,
  Quote,
  SquarePlay,
  Table,
  type LucideIcon,
} from "lucide-react";
import { estimateReadingTime } from "../../../shared/blog";
import { DOCUMENT_TYPES, IMAGE_TYPES, MAX_UPLOAD_LABEL, uploadFile } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";
import { Markdown } from "../ui/Markdown";
import { PromptDialog } from "./Dialog";
import {
  DETAILS_SELECT,
  DETAILS_TEMPLATE,
  TABLE_SELECT,
  TABLE_TEMPLATE,
  fileMarkdown,
  imageMarkdown,
  insertBlock,
  insertLink,
  normalizeLinkUrl,
  parseYouTubeId,
  styleLines,
  wrapInline,
  type Edit,
  type LineStyle,
} from "./markdownEdit";
import { errorMessage, isUnauthorized } from "./ui";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** aria-describedby of the textarea (hint / error ids). */
  describedBy?: string;
  invalid?: boolean;
  /** Title shown above the live preview. */
  previewTitle?: string;
};

/** Applies an edit through the browser's editing commands so Ctrl+Z keeps working. */
function applyEdit(ta: HTMLTextAreaElement, edit: Edit) {
  ta.focus();
  ta.setSelectionRange(edit.start, edit.end);
  let done = false;
  try {
    done = document.execCommand("insertText", false, edit.text);
  } catch {
    done = false;
  }
  if (!done || ta.value.slice(edit.start, edit.start + edit.text.length) !== edit.text) {
    // Fallback: set the value directly (loses native undo) and notify React.
    const value = ta.value.slice(0, edit.start) + edit.text + ta.value.slice(edit.end);
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set?.call(ta, value);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  ta.setSelectionRange(edit.selStart, edit.selEnd);
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

type Tool = {
  key: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  run: () => void;
  disabled?: boolean;
};

type Prompt = "link" | "youtube" | null;
type Upload = { kind: "image" | "file"; name: string } | null;

export function MarkdownEditor({ id, value, onChange, describedBy, invalid, previewTitle }: Props) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  /** Selection when a dialog / file picker was opened, to insert at the right place later. */
  const pending = useRef({ start: 0, end: 0 });
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [upload, setUpload] = useState<Upload>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [focusIndex, setFocusIndex] = useState(0);
  const wide = useMediaQuery("(min-width: 80rem)");
  const preview = useDeferredValue(value);
  const uid = useId();
  const hintId = `${uid}-hint`;
  const statusId = `${uid}-status`;

  const selection = () => {
    const el = ta.current!;
    return { start: el.selectionStart, end: el.selectionEnd };
  };

  const run = (make: (value: string, start: number, end: number) => Edit, at = selection()) => {
    const el = ta.current;
    if (!el) return;
    const max = el.value.length;
    applyEdit(el, make(el.value, Math.min(at.start, max), Math.min(at.end, max)));
  };

  const inline = (marker: "**" | "_") => run((v, s, e) => wrapInline(v, s, e, marker));
  const lines = (style: LineStyle) => run((v, s, e) => styleLines(v, s, e, style));
  const block = (text: string, select?: [number, number]) => run((v, s, e) => insertBlock(v, s, e, text, select));

  const openPrompt = (kind: Exclude<Prompt, null>) => {
    pending.current = selection();
    setPrompt(kind);
  };

  /** Closes the dialog synchronously (the page stops being inert), then edits the text. */
  const closePromptThen = (after: () => void) => {
    flushSync(() => setPrompt(null));
    after();
  };

  async function uploadAndInsert(file: File, kind: "image" | "file", at = selection()) {
    if (upload) return;
    setUpload({ kind, name: file.name });
    setNotice(null);
    try {
      const result = await uploadFile(file);
      if (kind === "image") {
        const { block: md, select } = imageMarkdown(result.url, result.name);
        run((v, s, e) => insertBlock(v, s, e, md, select), at);
        setNotice({ tone: "ok", text: `Imaginea „${result.name}” a fost încărcată. Completați descrierea (textul selectat).` });
      } else {
        run((v, s, e) => insertBlock(v, s, e, fileMarkdown(result.url, result.name, result.size)), at);
        setNotice({ tone: "ok", text: `Fișierul „${result.name}” a fost încărcat și adăugat în text.` });
      }
    } catch (err) {
      if (!isUnauthorized(err)) {
        const text =
          err instanceof ApiError && err.fields.file
            ? err.fields.file
            : errorMessage(err, "Încărcarea a eșuat.", { uploadLimit: MAX_UPLOAD_LABEL });
        setNotice({ tone: "error", text });
      }
    } finally {
      setUpload(null);
    }
  }

  const pickFile = (kind: "image" | "file") => {
    pending.current = selection();
    (kind === "image" ? imageInput : fileInput).current?.click();
  };

  const tools: (Tool | "sep")[] = [
    { key: "h2", label: "Titlu de secțiune (H2)", icon: Heading2, run: () => lines("h2") },
    { key: "h3", label: "Subtitlu (H3)", icon: Heading3, run: () => lines("h3") },
    "sep",
    { key: "bold", label: "Îngroșat", icon: Bold, shortcut: "Ctrl+B", run: () => inline("**") },
    { key: "italic", label: "Cursiv", icon: Italic, shortcut: "Ctrl+I", run: () => inline("_") },
    { key: "link", label: "Link", icon: LinkIcon, shortcut: "Ctrl+K", run: () => openPrompt("link") },
    "sep",
    { key: "ul", label: "Listă cu puncte", icon: List, run: () => lines("ul") },
    { key: "ol", label: "Listă numerotată", icon: ListOrdered, run: () => lines("ol") },
    { key: "quote", label: "Citat", icon: Quote, run: () => lines("quote") },
    { key: "table", label: "Tabel", icon: Table, run: () => block(TABLE_TEMPLATE, TABLE_SELECT) },
    "sep",
    { key: "image", label: "Încarcă o imagine", icon: ImagePlus, run: () => pickFile("image"), disabled: !!upload },
    { key: "file", label: "Atașează un fișier (PDF, DOCX, XLSX, PPTX, ZIP)", icon: Paperclip, run: () => pickFile("file"), disabled: !!upload },
    { key: "youtube", label: "Video YouTube", icon: SquarePlay, run: () => openPrompt("youtube") },
    { key: "details", label: "Secțiune pliabilă", icon: ChevronsDownUp, run: () => block(DETAILS_TEMPLATE, DETAILS_SELECT) },
  ];
  const buttons = tools.filter((t): t is Tool => t !== "sep");

  // Toolbar keyboard pattern: one tab stop, arrow keys move between buttons.
  function onToolbarKey(e: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const step = moves[e.key];
    const next =
      step === -Infinity ? 0 : step === Infinity ? buttons.length - 1 : (focusIndex + step + buttons.length) % buttons.length;
    setFocusIndex(next);
    toolbarRef.current?.querySelectorAll<HTMLButtonElement>("button[data-tool]")[next]?.focus();
  }

  function onTextareaKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      inline("**");
    } else if (key === "i") {
      e.preventDefault();
      inline("_");
    } else if (key === "k") {
      e.preventDefault();
      openPrompt("link");
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    e.preventDefault();
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
    const named = file.name && file.name !== "image.png" ? file : new File([file], `imagine-${Date.now()}.${ext}`, { type: file.type });
    void uploadAndInsert(named, "image");
  }

  function onDrop(e: DragEvent<HTMLTextAreaElement>) {
    const file = e.dataTransfer.files[0];
    if (!file) return;
    e.preventDefault();
    const at = selection();
    void uploadAndInsert(file, file.type.startsWith("image/") ? "image" : "file", at);
  }

  // Links in the preview render as on the public page (router links for "/…" paths), which here
  // would navigate the admin tab away from the editor. Open them in a new tab instead.
  function onPreviewClick(e: MouseEvent<HTMLDivElement>) {
    const link = (e.target as Element).closest("a");
    if (!link || !e.currentTarget.contains(link)) return;
    e.preventDefault();
    e.stopPropagation();
    const href = link.getAttribute("href");
    if (href && href !== "#") window.open(link.href, "_blank", "noopener");
  }

  const words = value.split(/\s+/).filter(Boolean).length;
  const showEditor = wide || tab === "edit";
  const showPreview = wide || tab === "preview";

  const tabButton = (key: "edit" | "preview", label: string): ReactNode => (
    <button
      type="button"
      role="tab"
      id={`${uid}-tab-${key}`}
      aria-selected={tab === key}
      aria-controls={`${uid}-panel-${key}`}
      tabIndex={tab === key ? 0 : -1}
      onClick={() => setTab(key)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const other = key === "edit" ? "preview" : "edit";
          setTab(other);
          document.getElementById(`${uid}-tab-${other}`)?.focus();
        }
      }}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
        tab === key ? "bg-white text-navy-950 shadow-sm" : "text-slate-600 hover:text-navy-950"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition-colors has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-brand-500 ${
        invalid ? "border-red-500" : "border-slate-300 has-[textarea:focus-visible]:border-brand-600"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Formatare text"
          aria-controls={id}
          onKeyDown={onToolbarKey}
          className={`flex-wrap items-center gap-0.5 ${showEditor ? "flex" : "hidden"}`}
        >
          {tools.map((tool, i) => {
            if (tool === "sep") return <span key={`sep-${i}`} aria-hidden className="mx-1 h-5 w-px bg-slate-300" />;
            const index = buttons.indexOf(tool);
            const Icon = tool.icon;
            const label = tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label;
            return (
              <button
                key={tool.key}
                type="button"
                data-tool
                tabIndex={index === focusIndex ? 0 : -1}
                onFocus={() => setFocusIndex(index)}
                onClick={tool.run}
                disabled={tool.disabled}
                aria-label={label}
                title={label}
                className="flex size-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-navy-950 hover:shadow-sm disabled:opacity-40"
              >
                <Icon aria-hidden className="size-4.5" />
              </button>
            );
          })}
        </div>

        {!wide && (
          <div role="tablist" aria-label="Mod de afișare" className="order-first flex rounded-lg bg-slate-200/70 p-0.5">
            {tabButton("edit", "Editare")}
            {tabButton("preview", "Previzualizare")}
          </div>
        )}
      </div>

      <div className={wide ? "grid grid-cols-2" : ""}>
        <div
          id={`${uid}-panel-edit`}
          role={wide ? undefined : "tabpanel"}
          aria-labelledby={wide ? undefined : `${uid}-tab-edit`}
          hidden={!showEditor}
        >
          <textarea
            ref={ta}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onTextareaKey}
            onPaste={onPaste}
            onDrop={onDrop}
            aria-describedby={[describedBy, hintId, statusId].filter(Boolean).join(" ")}
            aria-invalid={invalid || undefined}
            spellCheck
            lang="ro"
            className="block h-[70vh] min-h-[26rem] w-full resize-y bg-white px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-navy-950 outline-none placeholder:text-slate-400"
            placeholder={"Scrieți articolul în Markdown…\n\n## Titlu de secțiune\n\nText cu **îngroșat**, _cursiv_ și [link](https://www.emip.ro)."}
          />
        </div>
        <div
          id={`${uid}-panel-preview`}
          role={wide ? "region" : "tabpanel"}
          aria-label={wide ? "Previzualizare" : undefined}
          aria-labelledby={wide ? undefined : `${uid}-tab-preview`}
          hidden={!showPreview}
          tabIndex={0}
          className={wide ? "relative border-l border-slate-200 bg-white" : "min-h-[26rem] bg-white"}
        >
          <div className={wide ? "absolute inset-0 overflow-y-auto px-6 py-5" : "px-4 py-5"} onClickCapture={onPreviewClick}>
            {previewTitle && (
              <p className="mb-6 text-2xl font-extrabold leading-tight tracking-tight text-navy-950">{previewTitle}</p>
            )}
            {preview.trim() ? (
              <Markdown source={preview} />
            ) : (
              <p className="text-sm text-slate-400">Previzualizarea apare aici pe măsură ce scrieți.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p id={statusId} role="status" className="min-h-4">
          {upload ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-navy-700">
              <LoaderCircle aria-hidden className="size-3.5 animate-spin" /> Se încarcă „{upload.name}”…
            </span>
          ) : notice ? (
            <span className={notice.tone === "error" ? "font-medium text-red-700" : "text-brand-800"}>{notice.text}</span>
          ) : null}
        </p>
        <p id={hintId} className="shrink-0">
          {words} {words === 1 ? "cuvânt" : "cuvinte"} · ≈ {estimateReadingTime(value)} min de citit · Markdown
        </p>
      </div>

      <input
        ref={imageInput}
        type="file"
        accept={IMAGE_TYPES}
        hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadAndInsert(file, "image", pending.current);
        }}
      />
      <input
        ref={fileInput}
        type="file"
        accept={DOCUMENT_TYPES}
        hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadAndInsert(file, "file", pending.current);
        }}
      />

      <PromptDialog
        open={prompt === "link"}
        title="Adaugă un link"
        label="Adresa (URL)"
        hint="Link extern (https://…), pagină a site-ului (/contact) sau adresă de email."
        placeholder="https://"
        inputMode="url"
        submitLabel="Adaugă linkul"
        validate={(v) => (normalizeLinkUrl(v) ? null : "Introduceți o adresă validă, de ex. https://www.exemplu.ro")}
        onCancel={() => setPrompt(null)}
        onSubmit={(v) => closePromptThen(() => run((val, s, e) => insertLink(val, s, e, normalizeLinkUrl(v)!), pending.current))}
      />
      <PromptDialog
        open={prompt === "youtube"}
        title="Adaugă un video YouTube"
        label="Link sau ID YouTube"
        hint="De ex. https://www.youtube.com/watch?v=6g-tOg4qApI sau https://youtu.be/6g-tOg4qApI"
        inputMode="url"
        submitLabel="Adaugă video"
        validate={(v) => (parseYouTubeId(v) ? null : "Linkul sau ID-ul YouTube nu este valid.")}
        onCancel={() => setPrompt(null)}
        onSubmit={(v) =>
          closePromptThen(() => run((val, s, e) => insertBlock(val, s, e, `::youtube[${parseYouTubeId(v)}]`), pending.current))
        }
      />
    </div>
  );
}
