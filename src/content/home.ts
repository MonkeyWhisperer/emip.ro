import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BellRing,
  BotMessageSquare,
  Briefcase,
  Building,
  Calculator,
  ClipboardCheck,
  DatabaseBackup,
  Eye,
  FileChartColumn,
  FolderKanban,
  Gauge,
  Handshake,
  Headphones,
  HeartHandshake,
  Landmark,
  Layers,
  Library,
  Lock,
  PiggyBank,
  Presentation,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Signature,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { APP_URL } from "./site";
// Line icons from the live site (white on transparent); drawn as masks, so any colour works.
import isoIcon from "../assets/certificari/iso.webp";
import transethIcon from "../assets/certificari/transeth.webp";
import anisIcon from "../assets/certificari/anis.webp";
import adrIcon from "../assets/certificari/adr.webp";

type IconCard = { icon: LucideIcon; title: string; text: string };
type Cta = { label: string; href: string };
export type HeroStat = { value: number; prefix?: string; suffix?: string; label: string; countUp?: false };

export const hero = {
  eyebrow: "Actualizat pentru ghidurile PEO & PIDS 2021–2027",
  // Read as one sentence. From md the hero sets it on three lines: `lead` / `accent` (highlighted)
  // + `tail[0]` / `tail[1]`.
  title: { lead: "Proiecte cu finanțare,", accent: "livrate la timp", tail: ["și în", "limitele bugetului"] },
  subtitle: "Zero corecții financiare pe proiectele PEO & PIDS",
  text: "Asigurați conformitatea MIPE și automatizați 90% din munca de raportare. Gestionați proiecte, echipe și bugete dintr-o singură platformă.",
  primary: { label: "Accesează cont demo", href: APP_URL } satisfies Cta,
  secondary: { label: "Planifică un workshop", href: "/servicii" } satisfies Cta,
  // The numbers count up from 0 when the bar scrolls into view; a year (`countUp: false`) doesn't.
  stats: [
    { value: 500, suffix: "+", label: "Proiecte gestionate" },
    { value: 2018, prefix: "Din ", label: "Alături de beneficiari", countUp: false },
    { value: 90, suffix: "%", label: "Reducere timp raportare" },
    { value: 10, suffix: "x", label: "Mai multe proiecte în paralel" },
    { value: 100, suffix: "%", label: "Conformitate MIPE" },
  ] satisfies HeroStat[],
};

export const benefits = {
  eyebrow: "De ce eMIP?",
  title: "Beneficii pentru afacerea ta",
  text: "Transformă modul în care gestionezi proiectele cu finanțare. Mai puțin timp pe birocrație, mai mult timp pentru rezultate.",
  items: [
    {
      icon: Zap,
      title: "Eficiență și Automatizare",
      text: "Reduceți cu 90% timpul alocat raportării. Automatizați pontajele, cheltuielile și generați documente instant.",
    },
    {
      icon: ShieldCheck,
      title: "Conformitate și Control",
      text: "Raportare automată conform cerințelor MIPE. Pistă de audit completă și semnare electronică validă legal.",
    },
    {
      icon: Gauge,
      title: "Vizibilitate Completă",
      text: "Dashboard-uri în timp real pentru progres, buget, rezultate și KPI-uri. Decizii bazate pe date, nu pe intuiție.",
    },
    {
      icon: Sparkles,
      title: "Colaborare Inteligentă",
      text: "Gestionați experți, contracte și ore lucrate. Asistent AI pentru căutare inteligentă în conținutul documentelor.",
    },
  ] satisfies IconCard[],
};

// A piece of card text that may link to its proof. `hint` is read out after the label by
// screen readers, since the label alone ("Membru") doesn't say where the link goes.
export type TrustText = { label: string; href?: string; hint?: string };

export const trust = {
  eyebrow: "Încredere și conformitate",
  title: "Certificări și Acreditări",
  text: "Alegem excelența și conformitatea. Certificările noastre garantează siguranța și calitatea serviciilor.",
  // Same structure and links as the live site's cards: badge, title lines, subtitle, text.
  items: [
    {
      icon: isoIcon,
      badge: { label: "Certificate", href: "/docs/certificate.pdf", hint: "PDF" },
      title: [
        { label: "ISO 9001 : 2015", href: "/docs/iso-9001-2015.pdf", hint: "PDF" },
        { label: "ISO 27001 : 2022", href: "/docs/iso-27001-2022.pdf", hint: "PDF" },
      ],
      subtitle: "Certificare Securitate și Calitate",
      text: "Certificați ISO 27001 pentru securitatea informației, garantând protecția datelor și a proceselor dumneavoastră.",
    },
    {
      icon: transethIcon,
      badge: { label: "Partener", href: "https://devpost.com/software/transeth", hint: "TRANSETH pe Devpost" },
      title: [{ label: "TRANSETH" }, { label: "Cluster" }],
      subtitle: "Partener Strategic",
      text: "Parte din ecosistemul TRANSETH Cluster pentru inovație și transformare digitală în România.",
    },
    {
      icon: anisIcon,
      badge: { label: "Membru", href: "https://anis.ro/membri/", hint: "lista membrilor ANIS" },
      title: [{ label: "ANIS" }],
      subtitle: "Membru Oficial",
      text: "Membru al Asociației Patronale a Industriei de Software din România (ANIS), recunoscut la nivel național.",
    },
    {
      icon: adrIcon,
      badge: { label: "Autorizat 2023", href: "/docs/autorizatie-adr-2023.pdf", hint: "autorizația ADR, PDF" },
      title: [{ label: "ADR" }, { label: "Autorizare" }],
      subtitle: "Administrator Arhivă Electronică",
      text: "Autorizați de ADR ca Administratori de Arhive Electronice din 2023, conform legislației în vigoare.",
    },
  ] satisfies { icon: string; badge: TrustText; title: TrustText[]; subtitle: string; text: string }[],
  guarantees: [
    { icon: Lock, label: "Securitate de nivel enterprise" },
    { icon: Headphones, label: "Suport dedicat 24/7" },
    { icon: DatabaseBackup, label: "Backup automat zilnic" },
    { icon: ShieldCheck, label: "Conformitate GDPR" },
  ],
};

export const features = {
  eyebrow: "Funcționalități",
  title: "Tot ce ai nevoie, într-o singură platformă",
  text: "De la definirea proiectului până la raportul final, eMIP te însoțește în fiecare etapă.",
  more: { label: "Vezi toate funcționalitățile", href: "/functionalitati" } satisfies Cta,
  items: [
    {
      icon: FolderKanban,
      title: "Gestionare Proiecte",
      text: "Definiți proiecte, activități, milestone-uri și bugete. Monitorizare progres în timp real.",
    },
    {
      icon: FileChartColumn,
      title: "Raportare Automată",
      text: "Generați rapoarte MIPE instant. Export PDF, Excel, Word cu un singur click.",
    },
    {
      icon: Library,
      title: "Librărie de Documente",
      text: "Stocare centralizată cu versionare, permisiuni și căutare full-text.",
    },
    {
      icon: Calculator,
      title: "Plan de Afaceri",
      text: "Creați și monitorizați planuri de afaceri cu indicatori financiari calculați automat.",
    },
    {
      icon: BotMessageSquare,
      title: "Asistent AI Inteligent",
      text: "Căutare inteligentă în toate documentele arhivei. Întrebați orice despre arhivă.",
    },
    {
      icon: Users,
      title: "Gestionare Experți",
      text: "Contracte, ore lucrate, pontaje și costuri. Tot ce ai nevoie pentru echipă.",
    },
    {
      icon: ClipboardCheck,
      title: "Monitorizare Implementare",
      text: "Ore, rezultate, indicatori, arhivă MySMIS, documente MGT, stive opisate grupate automat pe experți și luni.",
    },
    {
      icon: Handshake,
      title: "Colaborare în Echipă",
      text: "Lucrați împreună în timp real, cu roluri diferite: Manager, Expert, Reprezentant Partener.",
    },
  ] satisfies IconCard[],
};

export const arch = {
  badge: "Soluție nouă",
  title: "eMIP®Arch",
  subtitle: "Inovație și conformitate în arhivarea electronică",
  text: "Echipa eMIP marchează un moment semnificativ în industria arhivării electronice, fiind autorizată de Autoritatea pentru Digitalizarea României (ADR) ca administrator de arhivă electronică, prin EMIP SRL (fosta ALBADEV NET SRL).",
  highlights: [
    "Experiență integrată web și mobile",
    "Conformitate cu toate cerințele legale",
    "Certificat propriu pentru semnătură electronică",
    "Disponibil pe App Store și Google Play",
  ],
  // Demo first, as in the hero; the app's login page lists the eMIP Arch demo accounts (Admin
  // Arhivă, Client). The second button goes to the product tab on /preturi.
  primary: { label: "Accesează cont demo", href: APP_URL } satisfies Cta,
  primaryNote: "Cu arhive demo virtualizate.",
  secondary: { label: "Descoperă eMIP Arch", href: "/preturi#arch" } satisfies Cta,
  items: [
    {
      icon: Archive,
      title: "Arhivare Electronică Acreditată",
      text: "Autorizați de ADR ca arhivar electronic din 2023. Soluție SaaS conformă cu toate cerințele legale.",
    },
    {
      icon: ScanSearch,
      title: "Căutare Avansată",
      text: "Căutare în scriere olografă, imagini și tipărituri. Găsiți instantaneu documentele necesare.",
    },
    {
      icon: BellRing,
      title: "Notificări în Timp Real",
      text: "Primiți notificări pe mobil la încărcarea documentelor noi în arhivă.",
    },
    {
      icon: Smartphone,
      title: "Aplicații Mobile",
      text: "Disponibil pe App Store și Google Play. Acces facil la conținutul arhivelor de pe orice dispozitiv.",
    },
    {
      icon: Signature,
      title: "Semnătură Electronică",
      text: "Fiecare document descărcat beneficiază de semnătură electronică cu certificat propriu.",
    },
    {
      icon: ShieldCheck,
      title: "Securitate Maximă",
      text: "Integritate și securitate garantate pentru toate datele și documentele arhivate.",
    },
  ] satisfies IconCard[],
};

export const fundedProjects = {
  eyebrow: "Proiecte cu finanțare",
  title: "Avantaje pentru proiecte PEO, PoIDS și alte programe",
  text: "Platforma eMIP simplifică raportarea proiectelor finanțate, respectând structura definită în Manualul Beneficiarului și cerințele stricte ale finanțatorului.",
  metrics: [
    {
      metric: "90%",
      metricLabel: "timp economisit",
      title: "Raportare Automată PEO/PoIDS",
      text: "Formate predefinite: Anexa 8 (Fișa de Pontaj) și Anexa 10 (Raport Lunar de Activitate), generate automat.",
    },
    {
      metric: "100%",
      metricLabel: "conformitate MIPE",
      title: "Calendar Expert Integrat",
      text: "Gestionarea livrabilelor, rezultatelor și indicatorilor direct din Calendarul Expertului, cu vizualizare în timp real.",
    },
    {
      metric: "10x",
      metricLabel: "mai multe proiecte",
      title: "Proiecte Multiple în Paralel",
      text: "Gestionați simultan mai multe proiecte finanțate, cu dashboard centralizat și raportare consolidată.",
    },
    {
      metric: "<1%",
      metricLabel: "erori de raportare",
      title: "Calcul Indicatori în Timp Real",
      text: "Valorile realizate și cele asumate sunt urmărite automat, eliminând riscul erorilor de operare.",
    },
    {
      metric: "AI",
      metricLabel: "powered",
      title: "Asistent AI Inteligent",
      text: "Funcționalitate GPT pentru interogare prin NLP (limbaj natural) și căutare inteligentă în conținutul documentelor.",
    },
    {
      metric: ">50%",
      metricLabel: "costuri reduse",
      title: "Economii Semnificative",
      text: "Reduceți costurile administrative și timpul alocat pregătirii documentațiilor pentru finanțator.",
    },
  ],
  reasonsTitle: "De ce organizațiile aleg eMIP pentru proiecte finanțate?",
  reasons: [
    {
      icon: RefreshCw,
      title: "Adaptare Continuă",
      text: "Echipa eMIP lucrează constant la adaptarea platformei la noile instrucțiuni ale MIPE și ale Autorităților de Management (AM), fără costuri suplimentare pentru utilizatori.",
    },
    {
      icon: Presentation,
      title: "Workshop-uri Periodice",
      text: "Acces la workshop-uri organizate periodic, cu proiecte demonstrative care detaliază pașii pentru întocmirea rapoartelor complete.",
    },
    {
      icon: Eye,
      title: "Transparență în Gestionare",
      text: "Vizualizarea stadiului de realizare și a experților implicați pentru fiecare livrabil, rezultat și indicator al proiectului.",
    },
  ] satisfies IconCard[],
  testimonial:
    "Platforma eMIP se remarcă nu doar prin tehnologie, ci și printr-o înțelegere a nevoilor utilizatorilor, contribuind la succesul implementării proiectelor și la respectarea cerințelor stricte ale finanțatorului.",
};

export const howItWorks = {
  eyebrow: "Cum funcționează",
  title: "Începe în 4 pași simpli",
  text: "De la înregistrarea ta la workshop până la primul raport generat automat, procesul este simplu și intuitiv.",
  steps: [
    {
      title: "Vino în workshop",
      text: "Participă cu echipa ta de proiect la un workshop de prezentare a modului de operare al platformei eMIP. Invită și partenerii tăi din proiect și veți beneficia de discount-uri generoase pentru întregul grup.",
    },
    {
      title: "Virtualizăm proiectul tău",
      text: "După semnarea acordului de confidențialitate (NDA), eMIP îți virtualizează proiectul, iar în 3–7 zile vei avea acces la el. Configurarea primului proiect adus în platformă este realizată gratuit de echipa noastră.",
    },
    {
      title: "Începe lucrul",
      text: "După configurarea proiectului în platformă și semnarea contractului de licențiere, poți începe lucrul: încarci date, generezi rapoarte și arhive.",
    },
    {
      title: "Testează 30 de zile gratis",
      text: "Ai la dispoziție 30 de zile gratuite ca să vezi dacă platforma eMIP ți se potrivește. La final poți renunța fără costuri: întreaga arhivă îți va fi predată, proiectul va fi șters, iar datele vor fi uitate.",
    },
  ],
  // Wix Bookings (date picker + SMS reminder) is gone; workshop requests now go through the contact form.
  cta: { label: "Înscrie-te la Workshop", href: "/service-page/workshop-demo-prezentare" } satisfies Cta,
  note: "Trimite cererea de înscriere, iar echipa eMIP te contactează pentru a stabili data și ora workshop-ului.",
};

export const useCases = {
  eyebrow: "Cazuri de utilizare",
  title: "Soluții pentru orice tip de organizație",
  text: "Indiferent de industrie sau dimensiune, eMIP se adaptează nevoilor tale specifice.",
  items: [
    {
      icon: Briefcase,
      title: "Firme de Consultanță",
      text: "Gestionați simultan mai multe proiecte pentru clienți diferiți. Rapoarte personalizate per client.",
    },
    {
      icon: Building, // the same building as in the hero illustration
      title: "Companii",
      text: "Proiecte și planuri de afaceri finanțate din fonduri europene. Urmărirea progresului tehnic și monitorizarea încadrării în buget.",
    },
    {
      icon: HeartHandshake,
      title: "ONG-uri",
      text: "Proiecte sociale și educaționale. Raportare simplificată pentru finanțatori multipli.",
    },
    {
      icon: Landmark,
      title: "Instituții Publice",
      text: "Conformitate garantată cu legislația. Pistă de audit completă și transparență.",
    },
  ] satisfies IconCard[],
};

export const finalCta = {
  title: "Gata să transformi modul în care gestionezi proiectele?",
  text: "Alătură-te sutelor de organizații care au simplificat managementul proiectelor finanțate din fonduri europene.",
  perks: [
    { icon: PiggyBank, label: "Fără card de credit necesar" },
    { icon: Layers, label: "Acces complet la toate funcționalitățile" },
    { icon: Headphones, label: "Suport tehnic inclus" },
    { icon: Target, label: "Rapoarte MIPE gratuite" },
  ],
  primary: { label: "Accesează cont demo", href: APP_URL } satisfies Cta,
  secondary: { label: "Contactează-ne", href: "/contact" } satisfies Cta,
};

// The posts themselves are the latest published ones, fetched from the blog API.
export const blog = {
  eyebrow: "Ai aflat asta?",
  title: "Ultimele știri din comunitatea eMIP",
  text: "Articole, știri și analize despre comunicare, dezvoltare personală, antreprenoriat și formare profesională. Fii la curent cu cele mai noi tendințe și sfaturi practice.",
  all: { label: "Vezi toate articolele", href: "/blog" } satisfies Cta,
};

export const newsletter = {
  title: "Rămâi conectat cu eMIP",
  text: "Abonează-te la newsletter-ul nostru și nu rata noutățile.",
  consent: "Vreau să mă abonez la lista de corespondență eMIP.",
  button: "Abonare",
  errors: {
    emailMissing: "Introdu adresa de email.",
    email: "Adresa de email nu este validă.",
    consent: "Bifează căsuța să te poți abona.",
  },
};
