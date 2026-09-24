import type { LucideIcon } from "lucide-react";
import { Cookie, Scale, ShieldCheck } from "lucide-react";
import { APP_URL } from "../site";

/*
 * Metadata for the three legal documents. The texts themselves live next to
 * this file as Markdown (termeni.md, confidentialitate.md, cookies.md) and are
 * imported by each page with the `?raw` suffix, so every page only ships its own text.
 *
 * Markdown conventions used by the legal layout:
 *   ## Heading   starts a chapter (anchor + table of contents entry)
 *   ***          on its own line separates the closing note from the body
 */

export type LegalDoc = {
  href: string;
  /** Label in the document switcher (same wording as the footer's legal links). */
  label: string;
  icon: LucideIcon;
  title: string;
  text: string;
  meta: { title: string; description: string };
  version: string;
  updated: string;
  /** Extra badge in the header, shown without a label (the live subtitle "Conform GDPR (…)"). */
  compliance?: string;
  /** Markdown notice shown above the text, e.g. when the page is an excerpt. */
  notice?: string;
};

export const termeni: LegalDoc = {
  href: "/termeni-si-conditii-legale",
  label: "Termeni și condiții",
  icon: Scale,
  title: "Termeni și Condiții de utilizare",
  text: "Platforma eMIP® – www.emip.ro și subdomeniile acesteia",
  meta: {
    title: "Termeni și Condiții",
    description:
      "Termeni și condiții eMIP®: reguli de utilizare, drepturi și obligații, licențiere și tarife, confidențialitate, securitate (GDPR/ISO), retenția datelor și modalități de contact pentru suport și solicitări.",
  },
  version: "3.0",
  updated: "Februarie 2026",
};

export const confidentialitate: LegalDoc = {
  href: "/politica-de-confidentialitate",
  label: "Politica de Confidențialitate",
  icon: ShieldCheck,
  title: "Politica de Confidențialitate",
  text: "Platforma eMIP® – www.emip.ro și subdomeniile acesteia",
  meta: {
    title: "Politica de Confidențialitate",
    description:
      "Politica de confidențialitate eMIP®: ce date colectăm, temeiul legal, perioadele de retenție, drepturile dumneavoastră conform GDPR, transferurile internaționale, cookie-urile și datele de contact pentru protecția datelor.",
  },
  version: "3.0",
  updated: "Februarie 2026",
  compliance: "Conform GDPR (Regulamentul UE 2016/679)",
};

// The live site has no standalone cookie policy: its "Politica privind Cookies" page
// (/copy-of-politica-de-confidențialitate) is an older copy of the privacy policy.
// Until the owner provides one, this page carries chapter 5 of the privacy policy.
export const cookies: LegalDoc = {
  href: "/politica-cookies",
  label: "Politica privind cookies",
  icon: Cookie,
  title: "Politica privind cookies",
  text: "Platforma eMIP® – www.emip.ro și subdomeniile acesteia",
  meta: {
    title: "Politica privind cookies",
    description:
      "Politica eMIP® privind cookie-urile: ce sunt cookie-urile, tipurile de cookie-uri utilizate și cum le puteți gestiona.",
  },
  version: "3.0",
  updated: "Februarie 2026",
  compliance: "Conform GDPR (Regulamentul UE 2016/679)",
  notice:
    "Textul de mai jos reproduce Capitolul 5, „Cookie-uri și tehnologii similare”, din [Politica de Confidențialitate](/politica-de-confidentialitate) a Platformei eMIP®.",
};

/** Order of the document switcher. */
export const legalDocs: LegalDoc[] = [termeni, confidentialitate, cookies];

export const legalLabels = {
  eyebrow: "Secțiune legislativă",
  documents: "Documente legale",
  toc: "Cuprins",
  facts: "Despre document",
  updated: "Ultima actualizare",
  version: "Versiunea",
};

// Call to action shown under every legal document on the live site.
export const legalCta = {
  title: "Găsește soluția potrivită pentru tine",
  text: "Programează o prezentare personalizată și descoperă cum eMIP poate ajuta organizația ta.",
  primary: { label: "Accesează cont demo", href: APP_URL },
  secondary: { label: "Solicită o Prezentare", href: "/contact" },
};
