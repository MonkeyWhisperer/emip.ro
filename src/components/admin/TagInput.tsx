import { useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { X } from "lucide-react";

const MAX_TAGS = 30;
const MAX_LENGTH = 60;

type Props = {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  describedBy?: string;
};

/** Free-form tags as chips: type and press Enter or comma; Backspace removes the last one. */
export function TagInput({ id, tags, onChange, describedBy }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const next = [...tags];
    for (const part of raw.split(",")) {
      const tag = part.trim().replace(/\s+/g, " ").slice(0, MAX_LENGTH);
      const key = tag.toLocaleLowerCase("ro");
      if (tag && next.length < MAX_TAGS && !next.some((t) => t.toLocaleLowerCase("ro") === key)) next.push(tag);
    }
    if (next.length !== tags.length) onChange(next);
  };

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      // Commit the typed tag synchronously: the editor's Ctrl+S handler (on window) runs
      // right after this one and saves the form as it is at that moment.
      flushSync(() => {
        add(draft);
        setDraft("");
      });
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
      setDraft("");
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      e.preventDefault();
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 transition-colors hover:border-slate-400 has-[input:focus-visible]:border-brand-600 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-brand-500">
      {tags.length > 0 && (
        <ul className="contents" aria-label="Etichete adăugate">
          {tags.map((tag) => (
            <li key={tag} className="inline-flex items-center gap-1 rounded-md bg-navy-50 py-0.5 pl-2 pr-0.5 text-sm font-medium text-navy-800">
              {tag}
              <button
                type="button"
                onClick={() => {
                  onChange(tags.filter((t) => t !== tag));
                  document.getElementById(id)?.focus();
                }}
                aria-label={`Elimină eticheta ${tag}`}
                className="rounded p-0.5 text-navy-600 hover:bg-navy-100 hover:text-navy-950"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => {
          const value = e.target.value;
          if (value.includes(",")) {
            const parts = value.split(",");
            add(parts.slice(0, -1).join(","));
            setDraft(parts[parts.length - 1]);
          } else setDraft(value);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          add(draft);
          setDraft("");
        }}
        aria-describedby={describedBy}
        disabled={tags.length >= MAX_TAGS}
        placeholder={tags.length ? "Adaugă…" : "ex. PNRR, digitalizare"}
        className="min-w-32 flex-1 border-0 bg-transparent px-1 py-1 text-sm text-navy-950 outline-none placeholder:text-slate-400 focus-visible:outline-none"
      />
    </div>
  );
}
