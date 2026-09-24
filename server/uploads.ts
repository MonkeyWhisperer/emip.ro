import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { foldSlug, type UploadResult } from "../shared/blog.ts";
import { UPLOADS_DIR } from "./db.ts";
import { ValidationError } from "./validate.ts";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

type Kind = { mime: string; magic: (b: Buffer) => boolean };

const startsWith = (b: Buffer, bytes: number[], offset = 0) => bytes.every((x, i) => b[offset + i] === x);
const ascii = (b: Buffer, s: string, offset = 0) => b.subarray(offset, offset + s.length).toString("latin1") === s;
const zip = (b: Buffer) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]);

// SVG and HTML are deliberately absent: both can carry scripts.
const ALLOWED: Record<string, Kind> = {
  jpg: { mime: "image/jpeg", magic: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  jpeg: { mime: "image/jpeg", magic: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  png: { mime: "image/png", magic: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]) },
  gif: { mime: "image/gif", magic: (b) => ascii(b, "GIF8") },
  webp: { mime: "image/webp", magic: (b) => ascii(b, "RIFF") && ascii(b, "WEBP", 8) },
  avif: { mime: "image/avif", magic: (b) => ascii(b, "ftyp", 4) && (ascii(b, "avif", 8) || ascii(b, "avis", 8)) },
  pdf: { mime: "application/pdf", magic: (b) => ascii(b, "%PDF") },
  zip: { mime: "application/zip", magic: zip },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: zip },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", magic: zip },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", magic: zip },
};

export const uploadMime = (file: string) => ALLOWED[path.extname(file).slice(1).toLowerCase()]?.mime;

export async function saveUpload(file: File): Promise<UploadResult> {
  const ext = path.extname(file.name).slice(1).toLowerCase();
  const kind = ALLOWED[ext];
  if (!kind) throw new ValidationError({ file: `Tip de fișier nepermis (.${ext || "?"}). Permise: ${Object.keys(ALLOWED).join(", ")}.` });
  if (file.size > MAX_UPLOAD_BYTES) throw new ValidationError({ file: "Fișierul depășește 15 MB." });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!kind.magic(bytes)) throw new ValidationError({ file: "Conținutul fișierului nu corespunde extensiei." });

  const now = new Date();
  const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const base = foldSlug(path.basename(file.name, path.extname(file.name))).slice(0, 60) || "fisier";
  const name = `${randomBytes(4).toString("hex")}-${base}.${ext}`;
  await mkdir(path.join(UPLOADS_DIR, dir), { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, dir, name), bytes);

  return { url: `/media/uploads/${dir}/${name}`, name: file.name, size: file.size, type: kind.mime };
}
