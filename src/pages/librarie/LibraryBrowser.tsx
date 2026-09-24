import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CirclePlay,
  Download,
  ExternalLink,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderLock,
  Lock,
  Presentation,
} from "lucide-react";
import { librarie, type LibraryFile, type LibraryFileFormat, type LibraryFolder } from "../../content/librarie";
import { SmartLink } from "../../components/ui/SmartLink";

const { browser, membersOnly, folders } = librarie;

// Dates are calendar days (YYYY-MM-DD), parsed as UTC midnight: format them in UTC too,
// otherwise visitors west of Greenwich see the previous day.
const dateFormat = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const formatDate = (iso: string) => dateFormat.format(new Date(iso));

const formatIcons: Record<LibraryFileFormat, LucideIcon> = {
  PDF: FileText,
  DOC: FileText,
  XLS: FileSpreadsheet,
  PPT: Presentation,
  ZIP: FileArchive,
  VIDEO: CirclePlay,
  LINK: ExternalLink,
};

const formatLabels: Record<LibraryFileFormat, string> = {
  PDF: "PDF",
  DOC: "Word",
  XLS: "Excel",
  PPT: "PowerPoint",
  ZIP: "ZIP",
  VIDEO: "Video",
  LINK: "",
};

/** Romanian plural: "1 element", "5 elemente", "20 de elemente". */
function countItems(n: number) {
  if (n === 1) return "1 element";
  const needsDe = n !== 0 && (n % 100 === 0 || n % 100 >= 20);
  return `${n}${needsDe ? " de" : ""} elemente`;
}

// Name | last update | action. Below md every row stacks and the column labels move into the rows.
const mdColumns = "md:grid-cols-[minmax(0,1fr)_12rem_11rem] md:items-center md:gap-6";
const columns = `grid gap-3 ${mdColumns}`;
const actionClass =
  "inline-flex items-center gap-1.5 rounded-full border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:border-navy-600 hover:bg-navy-50";

/** The "last update" cell; `indent` lines it up with the name on small screens. */
function Updated({ iso, indent }: { iso?: string; indent: string }) {
  if (!iso) {
    return (
      <p aria-hidden className="hidden text-sm text-slate-400 md:block">
        –
      </p>
    );
  }
  return (
    <p className={`${indent} text-sm text-slate-600 md:pl-0`}>
      <span className="md:sr-only">{browser.columns.updated}: </span>
      <time dateTime={iso}>{formatDate(iso)}</time>
    </p>
  );
}

function FileRow({ file }: { file: LibraryFile }) {
  const Icon = formatIcons[file.format];
  const external = /^https?:\/\//.test(file.href);
  const label = external ? browser.open : browser.download;
  const ActionIcon = external ? ExternalLink : Download;
  const details = [formatLabels[file.format], file.size].filter(Boolean).join(" · ");

  return (
    <li className={`${columns} px-5 py-4 sm:px-6 md:pl-21`}>
      <div className="flex min-w-0 items-center gap-3">
        <Icon aria-hidden className="size-5 shrink-0 text-brand-700" />
        <div className="min-w-0">
          <p className="font-medium break-words text-navy-950">{file.title}</p>
          {details && <p className="text-xs text-slate-500">{details}</p>}
        </div>
      </div>
      <Updated iso={file.updated} indent="pl-8" />
      <div className="pl-8 md:pl-0 md:text-right">
        {/* Plain anchor: "Descarcă" must download every local file, PDFs included, while
            SmartLink would open /docs/*.pdf in a new tab. */}
        <a
          href={file.href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : { download: "" })}
          aria-label={`${label}: ${file.title}`}
          className={actionClass}
        >
          <ActionIcon aria-hidden className="size-4" />
          {label}
        </a>
      </div>
    </li>
  );
}

function FolderRow({ folder }: { folder: LibraryFolder }) {
  const locked = folder.access === "members";
  const Icon = locked ? FolderLock : Folder;

  return (
    <li>
      <div className={`${columns} px-5 py-5 sm:px-6`}>
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-brand-400">
            <Icon aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold break-words">{folder.name}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-slate-500">
              <span>{countItems(folder.itemCount ?? folder.files.length)}</span>
              {locked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                  <Lock aria-hidden className="size-3" />
                  {membersOnly.badge}
                </span>
              )}
            </p>
          </div>
        </div>
        <Updated iso={folder.updated} indent="pl-15" />
        {locked && (
          <div className="pl-15 md:pl-0 md:text-right">
            <SmartLink
              href={membersOnly.cta.href}
              aria-label={`${membersOnly.cta.label}: ${folder.name}`}
              className={`group ${actionClass}`}
            >
              {membersOnly.cta.label}
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
            </SmartLink>
          </div>
        )}
      </div>

      {folder.files.length > 0 && (
        <ul aria-label={folder.name} className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/60">
          {folder.files.map((file) => (
            <FileRow key={file.href} file={file} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** File-browser view of the library, replacing the Wix File Share widget. */
export function LibraryBrowser() {
  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-navy-900/5">
      <h2 className="border-b border-slate-200 px-5 py-5 text-xl font-bold tracking-tight sm:px-6">{browser.title}</h2>

      {folders.length === 0 ? (
        <p className="px-6 py-16 text-center text-slate-600">{browser.empty}</p>
      ) : (
        <>
          <div
            aria-hidden
            className={`${mdColumns} hidden bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 md:grid`}
          >
            <span>{browser.columns.name}</span>
            <span>{browser.columns.updated}</span>
          </div>
          <ul className="divide-y divide-slate-200 border-slate-200 md:border-t">
            {folders.map((folder) => (
              <FolderRow key={folder.name} folder={folder} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
