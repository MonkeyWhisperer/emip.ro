import type { LucideIcon } from "lucide-react";
import { ChartGantt, ChartPie, FileSpreadsheet, SquareKanban, Target, TrendingUp, Users } from "lucide-react";
import { APP_URL } from "./site";
// Illustrations drawn for the site as SVG: the product's is 16:9, the personas' 4:3.
import productImage from "../assets/solutii/emip-proiecte.svg";
import managersImage from "../assets/solutii/manageri-proiect.svg";
import directorsImage from "../assets/solutii/directori-executivi.svg";
import consultancyImage from "../assets/solutii/echipe-consultanta.svg";
import companiesImage from "../assets/solutii/companii-proiecte-complexe.svg";

type Cta = { label: string; href: string };
type Image = { src: string; alt: string };

export type Persona = {
  /** Anchor id, also used by the jump links in the page header. */
  id: string;
  /** Short label for the jump links. */
  label: string;
  icon: LucideIcon;
  badge: string;
  title: string;
  text: string;
  challenges: string[];
  solutions: string[];
  image: Image;
};

export type Alternative = {
  icon: LucideIcon;
  title: string;
  problems: string[];
  solution: string;
};

// First sentence of the live page's meta description (the full text runs to ~470 characters).
export const meta = {
  title: "Soluții",
  description:
    "Descoperă soluțiile eMIP® adaptate nevoilor tale: de la managementul eficient pentru Manageri de Proiect și vizibilitate strategică pentru Directori Executivi, până la instrumente dedicate echipelor de consultanță și companiilor cu proiecte complexe.",
};

export const header = {
  eyebrow: "Soluții personalizate",
  title: "Soluția potrivită pentru tine",
  text: "Indiferent de rolul tău sau tipul organizației, eMIP® se adaptează nevoilor tale specifice.",
  navLabel: "Soluții pe roluri",
};

export const product = {
  brand: "eMIP®",
  name: "Gestionare Proiecte și Plan Afaceri",
  text: "Soluție de tip „work-force-management” pentru gestionarea activităților proiectelor finanțate prin PEO, PoIDS, dar și a managerilor care doresc performanță de la echipele lor de proiect.",
  /** Word set in bold inside `text`, as on the live page. */
  highlight: "performanță",
  image: {
    src: productImage,
    alt: "Ilustrație: planul de activități al unui proiect în platforma eMIP, cu membrii echipei, progresul, orele și bugetul",
  } satisfies Image,
};

export const personaLabels = {
  challenges: "Provocările tale",
  solutions: "Cum te ajută eMIP",
};

export const personas: Persona[] = [
  {
    id: "manageri-de-proiect",
    label: "Manageri de Proiect",
    icon: Target,
    badge: "Controlul total asupra fiecărei activități",
    title: "Pentru Manageri de Proiect",
    text: "Ai nevoie de vizibilitate completă asupra proiectului, de la activități până la buget. eMIP îți oferă toate uneltele pentru un management eficient.",
    challenges: [
      "Raportare manuală care consumă ore întregi",
      "Dificultatea de a ține evidența orelor lucrate",
      "Documentele răspândite în mai multe locații",
      "Lipsa vizibilității asupra progresului real",
    ],
    solutions: [
      "Dashboard cu toate KPI-urile într-un singur loc",
      "Rapoarte MIPE generate automat cu un click",
      "Pontaje validate automat cu calendar vizual",
      "Alerte pentru devieri de la plan sau buget",
    ],
    image: {
      src: managersImage,
      alt: "Ilustrație: tabloul de bord al proiectului cu indicatori, progres, pontaje validate și buget, o alertă de depășire și un raport MIPE generat cu un click",
    },
  },
  {
    id: "directori-executivi",
    label: "Directori Executivi",
    icon: ChartPie,
    badge: "Decizii strategice bazate pe date",
    title: "Pentru Directori Executivi",
    text: "Ca director, ai nevoie de o imagine de ansamblu rapidă și precisă. eMIP îți oferă vizibilitate la nivel de portofoliu.",
    challenges: [
      "Rapoarte care ajung târziu pe birou",
      "Date inconsistente din surse multiple",
      "Risc de non-conformitate cu finanțatorul",
      "Dificultatea de a evalua performanța echipelor",
    ],
    solutions: [
      "Rapoarte executive cu un singur click",
      "Vizualizare securizată portofoliu complet de proiecte",
      "Alertă timpurie pentru riscuri și devieri",
      "Pistă de audit completă pentru conformitate",
    ],
    image: {
      src: directorsImage,
      alt: "Ilustrație: portofoliul de proiecte cu starea fiecăruia, un grafic al portofoliului, un raport executiv securizat și o alertă de risc",
    },
  },
  {
    id: "echipe-de-consultanta",
    label: "Echipe de Consultanță",
    icon: Users,
    badge: "Gestionați mai mulți clienți simultan",
    title: "Pentru Echipe de Consultanță",
    text: "Gestionezi proiecte pentru clienți diferiți? eMIP te ajută să ții totul organizat și să oferi servicii profesioniste.",
    challenges: [
      "Proiecte multiple cu deadline-uri diferite",
      "Experți care lucrează pe mai multe proiecte",
      "Raportări diferite per client/finanțator",
      "Dificultatea de a scala echipa",
    ],
    solutions: [
      "Grupuri separate per client cu acces controlat",
      "Alocarea acelorași experți pe proiecte multiple",
      "Template-uri de raportare personalizate",
      "Facturare simplificată bazată pe ore",
    ],
    image: {
      src: consultancyImage,
      alt: "Ilustrație: spații separate și securizate pentru fiecare client, aceiași experți pe mai multe proiecte, un șablon de raport și o factură pe baza orelor lucrate",
    },
  },
  {
    id: "companii-cu-proiecte-complexe",
    label: "Companii cu Proiecte Complexe",
    icon: TrendingUp,
    badge: "Scalează afacerea fără a pierde controlul",
    title: "Pentru Companii cu Proiecte Complexe",
    text: "Proiecte mari, echipe distribuite, bugete complexe. eMIP este construit pentru a gestiona complexitatea.",
    challenges: [
      "Echipe mari cu roluri diferite",
      "Bugete complexe cu multiple categorii",
      "Nevoia de conformitate strictă",
      "Procese manuale generare arhive proiect cu fișiere stivă concatenate neopisate",
    ],
    solutions: [
      "Roluri granulare: Manager, Expert, Partener, Manager afacere",
      "Bugetare detaliată pe activități și categorii",
      "Rapoarte conform tuturor cerințelor MIPE",
      "Generare automată arhive, precum și fișiere stivă direct opisate și de dimensiuni <50 MB",
    ],
    image: {
      src: companiesImage,
      alt: "Ilustrație: echipa cu roluri diferite, bugetul pe categorii și fișierele proiectului arhivate automat, cu opis și conformitate MIPE",
    },
  },
];

export const comparison = {
  eyebrow: "De ce eMIP",
  title: "Comparație cu alternativele",
  text: "Platforma eMIP simplifică raportarea proiectelor finanțate, respectând structura definită în Manualul Beneficiarului și cerințele stricte ale finanțatorului.",
  problemsLabel: "Probleme",
  solutionLabel: "Soluția eMIP",
  items: [
    {
      icon: FileSpreadsheet,
      title: "vs. Excel & Email",
      problems: [
        "Erori manuale",
        "Versiuni multiple",
        "Fără procese automate",
        "Erori de comunicare",
        "Lipsa rapoartelor vizuale",
      ],
      solution: "eMIP® centralizează totul într-un singur loc, cu versionare automată și colaborare în timp real.",
    },
    {
      icon: SquareKanban,
      title: "vs. Monday / Asana",
      problems: [
        "Nu cunosc cerințele MIPE",
        "Fără raportare specifică",
        "Suport greoi, uneori greu accesibil și în engleză",
        "Prețuri în USD",
      ],
      solution:
        "eMIP® este construit special pentru proiecte cu finanțare din România, cu raportare MIPE nativă și asistență în limba română.",
    },
    {
      icon: ChartGantt,
      title: "vs. Microsoft Project",
      problems: [
        "Idem Monday / Asana +",
        "Greu de învățat",
        "Fără colaborare cloud",
        "Licență scumpă",
        "Prea complex",
      ],
      solution: "eMIP® este intuitiv, bazat pe cloud, cu preț accesibil și funcționalități focusate pe nevoile tale.",
    },
  ] satisfies Alternative[],
};

export const finalCta = {
  title: "Găsește soluția potrivită pentru tine",
  text: "Programează o prezentare personalizată și descoperă cum eMIP poate ajuta organizația ta.",
  primary: { label: "Accesează cont demo", href: APP_URL } satisfies Cta,
  // The live button points at the home page; a presentation is requested through the contact form.
  secondary: { label: "Solicită o Prezentare", href: "/contact" } satisfies Cta,
};
