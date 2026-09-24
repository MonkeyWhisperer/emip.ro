import type { LucideIcon } from "lucide-react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { APP_URL, contact } from "./site";
import gligorPaul from "../assets/contact/gligor-paul.webp";
import mertaPaul from "../assets/contact/merta-paul.webp";
import neagLenuta from "../assets/contact/neag-lenuta.webp";
import pisecDan from "../assets/contact/pisec-dan.webp";
import pisecIurai from "../assets/contact/pisec-iurai.webp";
import pisecMariaIoana from "../assets/contact/pisec-maria-ioana.webp";
import rusanNicolaeAlexandru from "../assets/contact/rusan-nicolae-alexandru.webp";

type Link = { label: string; href: string };

type DetailItem = {
  icon: LucideIcon;
  label: string;
  /** Each entry renders on its own line. */
  lines: string[];
  /** Makes the first line a link (mailto:, tel:). */
  href?: string;
  /** Extra link under the value, e.g. the map. */
  extra?: Link;
};

const address = `${contact.street}, ${contact.city}, România`;

export const contactPage = {
  meta: {
    title: "Contact",
    description:
      "Contactează echipa eMIP® pentru întrebări, suport sau o prezentare DEMO. Trimite un mesaj din formular sau folosește datele de contact (email, telefon) și programul de lucru afișat pe pagină.",
  },

  header: {
    eyebrow: "Contact",
    title: "Suntem aici să te ajutăm",
    text: "Ai întrebări despre eMIP? Vrei o prezentare personalizată? Completează formularul și te contactăm în cel mai scurt timp.",
    cta: { label: "Accesează cont demo", href: APP_URL } satisfies Link,
  },

  // The live contact page lists its own phone number and working hours, which differ from
  // the footer (site.ts). They are kept here as published on the page until the owner
  // confirms which values are correct; then phone and hours should come from site.ts.
  details: {
    title: "Contact",
    items: [
      { icon: Mail, label: "Email", lines: [contact.email], href: `mailto:${contact.email}` },
      { icon: Phone, label: "Telefon", lines: ["+40 (0)745 039 592"], href: "tel:+40745039592" },
      {
        icon: MapPin,
        label: "Adresă",
        lines: [contact.street, contact.city],
        // A plain link instead of an embedded map: no third-party cookies on this page.
        extra: {
          label: "Deschide în Google Maps",
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        },
      },
      {
        icon: Clock,
        label: "Program de lucru",
        lines: ["Luni – Vineri: 9:00 – 18:00", "Sâmbătă – Duminică: închis"],
      },
    ] satisfies DetailItem[],
  },

  team: {
    title: "Echipa eMIP",
    note: "Răspundem la toate mesajele în maxim 24 de ore lucrătoare.",
    members: [
      { name: "PISEC Maria Ioana", photo: pisecMariaIoana },
      { name: "RUSAN Nicolae Alexandru", photo: rusanNicolaeAlexandru },
      { name: "PISEC Iurai", photo: pisecIurai },
      { name: "PISEC Dan", photo: pisecDan },
      { name: "NEAG Lenuța", photo: neagLenuta },
      { name: "MERTA Paul", photo: mertaPaul },
      { name: "GLIGOR Paul", photo: gligorPaul },
    ],
  },

  form: {
    title: "Trimite-ne un mesaj",
    labels: {
      firstName: "Prenume",
      lastName: "Nume",
      email: "Email",
      phone: "Telefon",
      company: "Nume Companie",
      subject: "Subiect",
      message: "Mesaj",
    },
    placeholders: {
      email: "adresa@email.ro",
      message: "Scrie mesajul tău…",
    },
    // Options of the live form's "Subiect" dropdown; the first one is the default.
    // A different value passed as /contact?subiect=... is added to the list and preselected.
    subjects: ["Solicită Prezentare DEMO", "Întrebări despre Prețuri", "Suport Tehnic", "Parteneriate", "Altele"],
    consent: {
      before: "Sunt de acord cu prelucrarea datelor mele personale, conform ",
      link: { label: "Politicii de confidențialitate", href: "/politica-de-confidentialitate" } satisfies Link,
    },
    submit: "Trimite!",
    sending: "Se trimite…",
    // Same wording as the server-side validation (server/forms.ts).
    errors: {
      firstName: "Prenumele este obligatoriu.",
      lastName: "Numele este obligatoriu.",
      emailMissing: "Adresa de email este obligatorie.",
      email: "Adresa de email nu este validă.",
      message: "Mesajul este obligatoriu.",
      messageShort: "Mesajul este prea scurt.",
      consent: "Este necesar acordul pentru prelucrarea datelor.",
      summary: "Te rugăm să corectezi câmpurile marcate.",
      generic: "Nu am putut trimite mesajul. Te rugăm să încerci din nou sau să ne scrii la",
    },
    success: {
      title: "Mulțumim! Mesajul tău a fost trimis.",
      text: "Te contactăm în cel mai scurt timp.",
      again: "Trimite un alt mesaj",
    },
  },
};
