import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { CircleAlert, FileUp, LoaderCircle, RotateCcw, Upload, X } from "lucide-react";
import type { AiSource } from "../../../../shared/ai";
import { MAX_TRAINING_BYTES, MAX_TRAINING_LABEL, TRAINING_FILE_TYPES, uploadTrainingFile } from "../../../lib/aiAdminApi";
import { ApiError } from "../../../lib/api";
import { Button, inputClass, isUnauthorized, plural } from "../ui";
import { aiErrorMessage, formatBytes } from "./shared";

// Upload area for training files: drag & drop or file picker (several at once), an optional
// title per file, then one upload after the other with a progress bar and per-file errors.

const EXTENSIONS = TRAINING_FILE_TYPES.split(",").map((e) => e.slice(1));
const TYPES_LABEL = EXTENSIONS.map((e) => e.toUpperCase()).join(", ");
const TITLE_MAX = 200;

type ItemState =
  /** Rejected here or by the server (type, size, empty, content): the same file would fail again, so it can only be removed. */
  | { kind: "invalid"; error: string }
  | { kind: "queued" }
  /** Bytes going to our server. */
  | { kind: "uploading"; progress: number }
  /** All bytes sent; the server is handing the file to OpenAI. */
  | { kind: "sending" }
  | { kind: "error"; error: string };

type Item = { key: string; file: File; title: string; state: ItemState };

const extensionOf = (name: string) => name.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? "";
const defaultTitle = (name: string) => name.replace(/\.[^.]+$/, "");

function check(file: File): ItemState {
  const ext = extensionOf(file.name);
  if (!EXTENSIONS.includes(ext)) return { kind: "invalid", error: `Tip de fișier nepermis${ext ? ` (.${ext})` : ""}. Permise: ${TYPES_LABEL}.` };
  if (file.size > MAX_TRAINING_BYTES) {
    return { kind: "invalid", error: `Fișierul are ${formatBytes(file.size)}; limita este ${MAX_TRAINING_LABEL}.` };
  }
  if (file.size === 0) return { kind: "invalid", error: "Fișierul este gol." };
  return { kind: "queued" };
}

type Props = {
  /** False when OPENAI_API_KEY is missing. */
  enabled: boolean;
  onUploaded: (source: AiSource) => void;
};

export function TrainingUpload({ enabled, onUploaded }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  const abortRef = useRef<AbortController | null>(null);
  const nextKey = useRef(1);
  const uid = useId();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Stop an upload in progress when leaving the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Closing or reloading the browser tab mid-upload loses the file being sent and the rest of the queue.
  useEffect(() => {
    if (!running) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [running]);

  // A file dropped next to the drop zone would make the browser open it instead of this page.
  useEffect(() => {
    const block = (e: globalThis.DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  const patch = (key: string, change: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...change } : it)));

  function add(files: FileList | File[]) {
    const added = [...files].map<Item>((file) => ({ key: `f${nextKey.current++}`, file, title: "", state: check(file) }));
    if (added.length) setItems((list) => [...list, ...added]);
  }

  const remove = (key: string) => setItems((list) => list.filter((it) => it.key !== key));

  // Removing a row (or the whole list) takes the focused button with it: move focus to the next
  // row's remove button, or to "Alegeți fișiere", instead of losing it to the top of the page.
  const chooseId = `${uid}-choose`;
  const uploadId = `${uid}-upload`;
  const listRef = useRef<HTMLUListElement>(null);
  const focusRow = (index: number) =>
    requestAnimationFrame(() => {
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-remove]:not(:disabled)");
      const next = buttons?.length ? buttons[Math.min(index, buttons.length - 1)] : null;
      (next ?? document.getElementById(chooseId))?.focus();
    });
  const removeAndFocus = (key: string) => {
    focusRow(items.findIndex((it) => it.key === key));
    remove(key);
  };

  async function uploadAll(onlyKey?: string) {
    if (running) return;
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const todo = itemsRef.current.filter(
      (it) => (it.state.kind === "queued" || it.state.kind === "error") && (!onlyKey || it.key === onlyKey),
    );
    for (const item of todo) {
      if (controller.signal.aborted) break;
      // Still in the list? (it may have been removed while an earlier file was uploading)
      const current = itemsRef.current.find((it) => it.key === item.key);
      if (!current) continue;
      patch(item.key, { state: { kind: "uploading", progress: 0 } });
      try {
        const source = await uploadTrainingFile(current.file, current.title.trim() || undefined, {
          signal: controller.signal,
          onProgress: (fraction) =>
            patch(item.key, { state: fraction >= 1 ? { kind: "sending" } : { kind: "uploading", progress: fraction } }),
        });
        remove(item.key);
        onUploaded(source);
      } catch (err) {
        if (controller.signal.aborted) break;
        if (isUnauthorized(err)) break; // the admin layout sends us to the login page
        const error = aiErrorMessage(err, "Încărcarea a eșuat.");
        // 400 / 413: the server refused this file (wrong content, too big); retrying the same bytes cannot help.
        // Network problems and 5xx stay retryable.
        const final = err instanceof ApiError && (err.status === 400 || err.status === 413 || err.status === 415);
        patch(item.key, { state: final ? { kind: "invalid", error } : { kind: "error", error } });
      }
    }
    abortRef.current = null;
    if (controller.signal.aborted) return;
    setRunning(false);
    // The upload button was disabled during the run (focus fell to the page) and the queue may be gone.
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active && active !== document.body && active.isConnected) return;
      const upload = document.getElementById(uploadId) as HTMLButtonElement | null;
      (upload && !upload.disabled ? upload : document.getElementById(chooseId))?.focus();
    });
  }

  const dropProps = enabled
    ? {
        onDragEnter: (e: DragEvent) => {
          e.preventDefault();
          setDragging(true);
        },
        onDragOver: (e: DragEvent) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDragging(true);
        },
        onDragLeave: (e: DragEvent) => {
          // Leaving for a child element is not leaving the zone.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        },
      }
    : {};

  const uploadable = items.filter((it) => it.state.kind === "queued" || it.state.kind === "error").length;
  const hintId = `${uid}-hint`;

  return (
    <div>
      <div
        {...dropProps}
        className={`flex flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          !enabled
            ? "border-slate-200 bg-slate-50 opacity-70"
            : dragging
              ? "border-brand-500 bg-brand-50"
              : "border-slate-300 bg-slate-50"
        }`}
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
          <FileUp aria-hidden className="size-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-navy-950">
          {dragging ? "Eliberați pentru a adăuga fișierele" : "Trageți fișierele aici sau"}
        </p>
        <Button
          id={chooseId}
          variant="secondary"
          size="sm"
          icon={Upload}
          className="mt-3"
          disabled={!enabled}
          aria-describedby={hintId}
          onClick={() => inputRef.current?.click()}
        >
          Alegeți fișiere
        </Button>
        <p id={hintId} className="mt-3 max-w-md text-xs leading-relaxed text-slate-500">
          {TYPES_LABEL} · max. {MAX_TRAINING_LABEL} fiecare · puteți adăuga mai multe deodată.
          {!enabled && " Încărcarea este indisponibilă până la configurarea cheii OpenAI."}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={TRAINING_FILE_TYPES}
          hidden
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200">
          <p className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs leading-relaxed text-slate-600">
            Titlul apare ca sursă sub răspunsurile asistentului; dacă îl lăsați gol, se folosește numele fișierului.
          </p>
          <ul ref={listRef} className="divide-y divide-slate-100">
            {items.map((item) => (
              <QueueRow
                key={item.key}
                item={item}
                disabled={running}
                onTitle={(title) => patch(item.key, { title })}
                onRemove={() => removeAndFocus(item.key)}
                onRetry={() => void uploadAll(item.key)}
              />
            ))}
          </ul>
          <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={running}
              onClick={() => {
                setItems([]);
                focusRow(0);
              }}
            >
              Golește lista
            </Button>
            <Button id={uploadId} size="sm" icon={Upload} busy={running} disabled={!enabled || uploadable === 0} onClick={() => void uploadAll()}>
              {running ? "Se încarcă…" : uploadable > 0 ? `Încarcă ${plural(uploadable, "fișier", "fișiere")}` : "Încarcă"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueRow({
  item,
  disabled,
  onTitle,
  onRemove,
  onRetry,
}: {
  item: Item;
  disabled: boolean;
  onTitle: (title: string) => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const id = useId();
  const { state, file } = item;
  const busy = state.kind === "uploading" || state.kind === "sending";
  const error = state.kind === "invalid" || state.kind === "error" ? state.error : null;

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-all text-sm font-semibold text-navy-950">{file.name}</p>
          <p className="text-xs text-slate-500">
            {extensionOf(file.name).toUpperCase() || "Fără extensie"} · {formatBytes(file.size)}
          </p>
        </div>
        {!busy && (
          <button
            type="button"
            data-remove
            onClick={onRemove}
            disabled={disabled && state.kind !== "invalid"}
            aria-label={`Scoate din listă: ${file.name}`}
            title="Scoate din listă"
            className="-mr-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-950 disabled:opacity-50"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      {state.kind !== "invalid" && (
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor={`${id}-title`} className="shrink-0 text-xs font-semibold text-slate-600">
            Titlu<span className="font-normal text-slate-500"> (opțional)</span>
            <span className="sr-only"> pentru {file.name}</span>
          </label>
          <input
            id={`${id}-title`}
            type="text"
            value={item.title}
            maxLength={TITLE_MAX}
            disabled={busy}
            placeholder={defaultTitle(file.name)}
            onChange={(e) => onTitle(e.target.value)}
            className={`${inputClass} sm:flex-1`}
          />
        </div>
      )}

      {state.kind === "uploading" && (
        <div className="mt-2 flex items-center gap-3">
          <progress
            value={state.progress}
            max={1}
            aria-label={`Încărcare ${file.name}`}
            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 [&::-moz-progress-bar]:bg-brand-600 [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-brand-600"
          />
          <span className="w-10 text-right text-xs tabular-nums text-slate-600">{Math.round(state.progress * 100)}%</span>
        </div>
      )}
      {state.kind === "sending" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-navy-700">
          <LoaderCircle aria-hidden className="size-3.5 motion-safe:animate-spin" /> Se trimite spre indexare…
        </p>
      )}
      {error && (
        <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
          <p role="alert" className="flex min-w-0 items-start gap-1.5 text-sm font-medium text-red-700">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </p>
          {state.kind === "error" && (
            <Button variant="secondary" size="sm" icon={RotateCcw} disabled={disabled} onClick={onRetry}>
              Reîncearcă
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
