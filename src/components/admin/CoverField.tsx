import { useId, useRef, useState, type DragEvent } from "react";
import { ImagePlus, ImageUp, LoaderCircle, Trash } from "lucide-react";
import { IMAGE_TYPES, MAX_UPLOAD_LABEL, uploadFile } from "../../lib/adminApi";
import { ApiError } from "../../lib/api";
import { Button, Field, FieldError, fieldAria, inputClass, errorMessage, isUnauthorized } from "./ui";

type Props = {
  cover: string;
  alt: string;
  onCoverChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  error?: string;
  altId: string;
};

/** Cover image: upload (button or drag & drop), preview, remove, alt text. */
export function CoverField({ cover, alt, onCoverChange, onAltChange, error, altId }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const errorId = useId();
  const shownError = uploadError ?? error;

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("Alegeți o imagine (JPG, PNG, WebP, AVIF sau GIF).");
      return;
    }
    setBusy(true);
    setUploadError(null);
    try {
      const result = await uploadFile(file);
      onCoverChange(result.url);
    } catch (err) {
      if (!isUnauthorized(err)) {
        setUploadError(
          err instanceof ApiError && err.fields.file
            ? err.fields.file
            : errorMessage(err, "Încărcarea a eșuat.", { uploadLimit: MAX_UPLOAD_LABEL }),
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const dropProps = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) void upload(file);
    },
  };

  return (
    <div className="space-y-4">
      {cover ? (
        <figure {...dropProps} className={`relative overflow-hidden rounded-xl bg-slate-100 ${dragging ? "ring-2 ring-brand-500" : ""}`}>
          <img
            src={cover}
            alt={alt ? `Imagine de copertă: ${alt}` : "Imagine de copertă"}
            className="aspect-[16/9] w-full object-cover"
          />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <LoaderCircle aria-hidden className="size-6 animate-spin text-navy-700" />
            </div>
          )}
        </figure>
      ) : (
        <button
          type="button"
          {...dropProps}
          onClick={() => input.current?.click()}
          disabled={busy}
          aria-describedby={shownError ? errorId : undefined}
          className={`flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition-colors ${
            dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
          }`}
        >
          {busy ? (
            <LoaderCircle aria-hidden className="size-7 animate-spin text-navy-700" />
          ) : (
            <ImagePlus aria-hidden className="size-7 text-slate-400" />
          )}
          <span className="text-sm font-semibold text-navy-900">{busy ? "Se încarcă…" : "Încarcă imaginea de copertă"}</span>
          <span className="text-xs text-slate-500">sau trageți fișierul aici · JPG, PNG, WebP, AVIF, GIF · max. 15 MB</span>
        </button>
      )}

      <FieldError id={errorId} error={shownError} />

      {cover && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={ImageUp} busy={busy} onClick={() => input.current?.click()}>
            Înlocuiește
          </Button>
          <Button
            variant="danger-outline"
            size="sm"
            icon={Trash}
            disabled={busy}
            onClick={() => {
              onCoverChange("");
              setUploadError(null);
            }}
          >
            Elimină
          </Button>
        </div>
      )}

      <Field
        id={altId}
        label="Text alternativ"
        optional={!cover}
        hint="Descrieți pe scurt imaginea, pentru cititoarele de ecran și motoarele de căutare."
      >
        <input
          {...fieldAria(altId, { hint: true })}
          type="text"
          value={alt}
          maxLength={200}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="ex. Captură de ecran din platforma eMIP"
          className={inputClass}
        />
      </Field>

      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES}
        hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
