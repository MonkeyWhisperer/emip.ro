import type { LucideIcon } from "lucide-react";
import { Heart, ShieldCheck, Target, Telescope, Users, Zap } from "lucide-react";
import { APP_URL } from "./site";

type IconCard = { icon: LucideIcon; title: string; text: string };
type Cta = { label: string; href: string };

// Copy from www.emip.ro/noi. The live page has no team, partner or certification
// sections; certifications live on the home page (content/home.ts -> trust).

export const meta = {
  title: "Despre noi",
  description:
    "Află povestea eMIP® precum și misiunea, viziunea, respectiv valorile noastre (conformitate, eficiență, colaborare). Descoperă evoluția platformei și inițiativele Asociației eMIP pentru educație digitală și sprijinirea grupurilor vulnerabile.",
};

export const intro = {
  eyebrow: "Despre noi",
  title: "Construim viitorul managementului de proiecte",
  text: "eMIP s-a născut din nevoia reală a organizațiilor românești de a gestiona eficient proiecte cu finanțare europeană. Am creat platforma pe care noi înșine ne-am fi dorit să o avem încă din 2010.",
};

export const purpose = {
  imageAlt: "Ilustrație: doi specialiști analizează grafice și indicatori de proiect afișați pe ecrane digitale",
  items: [
    {
      icon: Target,
      title: "Misiunea Noastră",
      text: "Să simplificăm managementul proiectelor oferind organizațiilor de toate dimensiunile o platformă completă, intuitivă și conformă cu toate cerințele legale. Credem că timpul petrecut în birocrație ar trebui investit în rezultate concrete.",
    },
    {
      icon: Telescope,
      title: "Viziunea Noastră",
      text: "Să devenim platforma de referință pentru managementul proiectelor cu finanțări europene din România și Europa de Est. Ne propunem ca fiecare organizație care implementează proiecte europene să aibă acces la unelte profesioniste și suport de calitate.",
    },
  ] satisfies IconCard[],
};

export const values = {
  eyebrow: "Valori",
  title: "Principiile care ne ghidează",
  items: [
    {
      icon: ShieldCheck,
      title: "Conformitate",
      text: "Asigurăm conformitatea 100% cu cerințele MIPE și standardele europene.",
    },
    {
      icon: Zap,
      title: "Eficiență",
      text: "Automatizăm procesele repetitive pentru a economisi timp prețios.",
    },
    {
      icon: Users,
      title: "Colaborare",
      text: "Facilităm lucrul în echipă și comunicarea eficientă.",
    },
    {
      icon: Heart,
      title: "Responsabilitate Socială",
      text: "Prin Asociația eMIP, susținem educația digitală pentru grupuri vulnerabile.",
    },
  ] satisfies IconCard[],
};

export const timeline = {
  eyebrow: "Evoluție eMIP.ro",
  title: "Călătoria noastră",
  // Chronological, alternating sides on desktop, as on the live page (whose DOM
  // lists the left column 2018/2022/2024/2026 before the right one).
  items: [
    { year: "2018", milestones: ["Lansarea primei versiuni eMIP"] },
    { year: "2020", milestones: ["Primele 100 de proiecte gestionate", "Parteneriat Microsoft, accesarea MCFH*"] },
    { year: "2022", milestones: ["Înființarea Asociației eMIP", "Lansare eMIP Plan Afaceri"] },
    { year: "2023", milestones: ["Lansarea Asistentului AI", "Lansare soluție eMIP Arch v.1"] },
    { year: "2024", milestones: ["Lansare Asistent AI în platformă", "Accesare program ISV Success – Microsoft"] },
    { year: "2025", milestones: ["Construire Data Center propriu", "Lansare soluție eMIP Arch v.2"] },
    {
      year: "2026",
      milestones: ["Autorizare Centru de Date de ADR", "Lansare eMIP Arch v.3 și autorizare soluție de ADR"],
    },
  ],
  footnote: {
    label: "*MCFH – Programul Microsoft for Cloud Founders Hub",
    href: "https://www.microsoft.com/ro-ro/startups",
  },
};

export const association = {
  eyebrow: "Responsabilitate socială",
  title: "Asociația eMIP",
  paragraphs: [
    "Suntem bucuroși să fim implicați în sprijinirea inițiativelor educaționale privind dezvoltarea competențelor digitale în rândul persoanelor aparținând grupurilor vulnerabile.",
    "Din 2022, oferim acces gratuit la programe de instruire și soluții software pentru categorii sociale care nu au avut șansa unei instruiri în domeniul digital.",
  ],
  stats: [
    { value: 120, suffix: "+", label: "Licențe gratuite" },
    { value: 150, suffix: "+", label: "Persoane instruite" },
  ],
  imageAlt: "Ilustrație: patru persoane privesc o rețea digitală de profiluri conectate între ele",
};

export const cta = {
  eyebrow: "Ia inițiativa",
  title: "Hai să lucrăm împreună",
  text: "Fie că ai un proiect de gestionat sau vrei să afli mai multe despre eMIP, suntem aici să te ajutăm.",
  primary: { label: "Accesează cont demo", href: APP_URL } satisfies Cta,
  secondary: { label: "Contactează-ne", href: "/contact" } satisfies Cta,
};
