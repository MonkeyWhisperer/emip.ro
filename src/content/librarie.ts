type Cta = { label: string; href: string };

export type LibraryFileFormat = "PDF" | "DOC" | "XLS" | "PPT" | "ZIP" | "VIDEO" | "LINK";

export type LibraryFile = {
  title: string;
  /** A file under /docs/librarie/ or an external URL (videos, online resources). */
  href: string;
  format: LibraryFileFormat;
  /** Human-readable size, e.g. "231 KB". */
  size?: string;
  /** ISO date of the last update. */
  updated?: string;
};

export type LibraryFolder = {
  name: string;
  /** ISO date of the last change inside the folder. */
  updated: string;
  /**
   * "members": the folder was visible on the Wix site but only logged-in members could
   * open or download its content, so the files themselves are not published here.
   */
  access: "public" | "members";
  /** Items in the folder when they are not listed in `files` (members-only folders). */
  itemCount?: number;
  files: LibraryFile[];
};

// Mirrors the Wix File Share widget on www.emip.ro/librarie (checked 23.09.2026).
// To publish a document: copy it to public/docs/librarie/ and add it to a public
// folder, e.g. { title: "Ghid", href: "/docs/librarie/ghid.pdf", format: "PDF", size: "231 KB" }.
const folders: LibraryFolder[] = [
  {
    name: "FAQ",
    updated: "2026-01-20",
    access: "members",
    itemCount: 1,
    files: [],
  },
];

export const librarie = {
  meta: {
    title: "Librărie",
    description:
      "Librăria eMIP este o bază de cunoștințe valoroase care sunt structurate pe tipuri de activități gestionate în site și cursuri.",
  },
  header: {
    eyebrow: "Bază de cunoștințe",
    title: "Librăria eMIP",
    text: "Librăria eMIP este o bază de cunoștințe valoroase care sunt structurate pe tipuri de activități gestionate în site și cursuri.",
  },
  browser: {
    title: "Fișiere și foldere",
    columns: { name: "Numele elementului", updated: "Ultima actualizare" },
    empty: "Nu există încă fișiere publicate în librărie.",
    download: "Descarcă",
    open: "Deschide",
  },
  membersOnly: {
    badge: "Doar pentru membri",
    cta: { label: "Solicită acces", href: "/contact" } satisfies Cta,
  },
  folders,
};
