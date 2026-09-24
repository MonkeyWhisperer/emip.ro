import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BotMessageSquare,
  Calculator,
  CalendarDays,
  ChartLine,
  ClipboardCheck,
  Clock,
  FileChartColumn,
  FileClock,
  FileText,
  FolderKanban,
  Funnel,
  Handshake,
  Highlighter,
  KeyRound,
  LayoutDashboard,
  Library,
  ScanText,
  Search,
  Target,
  UserCheck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { APP_URL } from "./site";
// The live page illustrates this feature with the same picture as the home hero.
import proiecteImage from "../assets/hero.webp";
import raportareImage from "../assets/functionalitati/raportare-automata.webp";
import librarieImage from "../assets/functionalitati/librarie-documente.webp";
import rezultateImage from "../assets/functionalitati/rezultate-kpi.webp";

type Cta = { label: string; href: string };

export type Feature = {
  /** Anchor id, so the section can be linked to directly (/functionalitati#raportare-automata). */
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
  items: string[];
  /** Illustration from the live page. */
  image?: { src: string; alt: string };
  /**
   * Features whose live illustration is a Wix stock photo get a decorative icon panel instead:
   * the feature icon, circled by four small icons echoing its checklist.
   */
  orbit?: [LucideIcon, LucideIcon, LucideIcon, LucideIcon];
};

// SEO description from the live page.
export const meta = {
  title: "Funcționalități",
  description:
    "Descoperă funcționalitățile oferite de platforma eMIP® pentru proiectele cu finanțare din fonduri europene și guvernamentale: gestionare proiecte, raportare MIPE automată, bibliotecă de documente, plan de afaceri, asistent AI, pontaje/experți, rezultate & KPI și colaborare în echipă, în cloud.",
};

export const intro = {
  eyebrow: "Funcționalități complete",
  title: "Tot ce ai nevoie pentru proiecte de succes",
  text: "De la definirea proiectului până la raportul final, eMIP îți oferă toate uneltele necesare pentru un management eficient al proiectelor cu finanțare.",
  primary: { label: "Accesează cont demo", href: APP_URL } satisfies Cta,
  navLabel: "Cuprins funcționalități",
};

// Same order and icons as the feature grid on the home page (src/content/home.ts).
export const features: Feature[] = [
  {
    id: "gestionare-proiecte",
    icon: FolderKanban,
    title: "Gestionare Proiecte",
    text: "Definiți și gestionați proiecte complete cu toate detaliile necesare pentru finanțarea europeană.",
    items: [
      "Definire proiecte cu date generale, logo-uri, documente inițiale",
      "Activități cu milestone-uri, dependențe și timeline",
      "Alocare bugete pe activități și categorii de cheltuieli",
      "Vizualizări multiple: Listă, Gantt Chart, Kanban, Calendar",
      "Monitorizare progres în timp real cu procente și status-uri",
    ],
    image: {
      src: proiecteImage,
      alt: "Ilustrație: o echipă analizează grafice și stadiul proiectelor pe un perete de ecrane",
    },
  },
  {
    id: "raportare-automata",
    icon: FileChartColumn,
    title: "Raportare Automată",
    text: "Generați rapoarte conforme cerințelor MIPE instant, cu un singur click. Fără muncă manuală.",
    items: [
      "Rapoarte de progres, tehnice, financiare și finale",
      "Rapoarte activități, echipă, buget, livrabile, indicatori",
      "Export în PDF, Excel, Word",
      "Personalizare perioadă raportare, filtre și secțiuni",
      "Generare automată și trimitere email la finalizare generare arhivă (procese ample)",
    ],
    image: {
      src: raportareImage,
      alt: "Ilustrație: documente, rapoarte și notificări conectate la un nucleu de automatizare",
    },
  },
  {
    id: "librarie-documente",
    icon: Library,
    title: "Librărie de Documente",
    text: "Stocare centralizată și organizată pentru toate documentele proiectului. Acces controlat și versioning.",
    items: [
      "Structură de foldere ierarhică cu permisiuni",
      "Upload drag & drop, multiple formate suportate",
      "Versioning complet cu comparație și restaurare",
      "Căutare full-text în conținut documente",
      "Preview documente fără download",
    ],
    image: {
      src: librarieImage,
      alt: "Ilustrație: rețea de date conectată la cloud",
    },
  },
  {
    id: "plan-de-afaceri",
    icon: Calculator,
    title: "Plan de Afaceri",
    text: "Creați și monitorizați planuri de afaceri pentru beneficiari, cu indicatori calculați automat.",
    items: [
      "Virtualizare plan de afaceri folosind machete predefinite",
      "Configurare start-up, autorizări, resurse umane",
      "Obiective, construire – execuție – versionare buget",
      "Gestionare operațiuni funcție de versiuni buget",
      "Generare raport financiar implementare pe luni sau interval de raportare",
    ],
    orbit: [Target, Wallet, UserCog, ChartLine],
  },
  {
    id: "asistent-ai",
    icon: BotMessageSquare,
    title: "Asistent AI Inteligent",
    text: "Căutare inteligentă în toate documentele proiectului. Întrebați orice și primiți răspunsuri relevante.",
    items: [
      "Căutare în limbaj natural în toate documentele",
      "OCR pentru PDF-uri scanate",
      "Filtrare rezultate după tip, dată, autor",
      "Highlight termeni căutați în rezultate",
      "Recunoaștere avansată de text, inclusiv din scriere olografă, imagini sau tipărituri",
    ],
    orbit: [Search, ScanText, Funnel, Highlighter],
  },
  {
    id: "gestionare-experti",
    icon: Users,
    title: "Gestionare Experți",
    text: "Managementul complet al echipei: contracte, ore lucrate, pontaje și costuri calculate automat.",
    items: [
      // \u00a0 keeps each number on the same line as its unit.
      "Date expert: Funcție, CIM, Fișă post, Rată orară, categorie expert, monitorizare 12\u00a0ore/zi & 60\u00a0ore/săptămână",
      "Calendar lunar pentru raportare ore, monitorizare ore realizate / ore rămase etc.",
      "Validare ore de către manager",
      "Generare automată Raport lunar activitate, Fișă de pontaj funcție de datele din Calendar",
      "Generare rapoarte vizuale pe activități, ore realizate pe luni și pe proiectele grupului",
    ],
    orbit: [CalendarDays, Clock, UserCheck, FileText],
  },
  {
    id: "rezultate-kpi",
    icon: ClipboardCheck,
    title: "Gestionare Rezultate & KPI",
    text: "Monitorizarea implementării proiectelor prin rezultate, indicatori și asocierea acestora la membrii GT.",
    items: [
      "Gestionarea completă a rezultatelor asumate prin proiect, conform cererii de finanțare",
      "Gestionarea indicatorilor de proiect și de rezultat",
      "Livrabilele și documentele justificative asociate direct cu MGT, rezultate și indicatori",
      "Gestionare arhivă documente proiect cu descărcare structurată conform cerințelor MySMIS",
      "Generare stive concatenate și opisate automat, grupate pe experți, parteneri și luni calendaristice",
    ],
    image: {
      src: rezultateImage,
      alt: "Ilustrație abstractă: rețea de noduri și conexiuni luminoase",
    },
  },
  {
    id: "colaborare-echipa",
    icon: Handshake,
    title: "Colaborare în Echipă",
    text: "Lucrați împreună în timp real cu roluri diferite: Manager, Reprezentant Partener, Expert, Manager Afacere.",
    items: [
      "Roluri diferite cu permisiuni specifice",
      "Notificări și alerte pentru echipă",
      "Dashboard personalizat per rol",
      "Acces multi-utilizator simultan",
      "Audit trail complet pentru toate acțiunile din calendar expert",
    ],
    orbit: [KeyRound, Bell, LayoutDashboard, FileClock],
  },
];

export const closingCta = {
  title: "Gata să încerci eMIP?",
  text: "Accesează platforma DEMO și explorează toate funcționalitățile fără nicio obligație.",
  primary: { label: "Accesează cont demo", href: APP_URL } satisfies Cta,
  secondary: { label: "Solicită o Prezentare", href: "/contact" } satisfies Cta,
};
