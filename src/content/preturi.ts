import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BotMessageSquare,
  Briefcase,
  Calculator,
  CalendarCheck,
  Eye,
  FolderKanban,
  HardDrive,
  KeyRound,
  ScanText,
  Settings2,
  Smartphone,
  UserCog,
} from "lucide-react";
import { APP_URL } from "./site";
import { servicePath } from "./servicii";
import appStoreBadge from "../assets/preturi/app-store.webp";
import googlePlayBadge from "../assets/preturi/google-play.webp";

/*
 * Copy for /preturi, migrated from the Wix page. Numbers are kept exactly as published.
 * NOTE: the live page contradicts itself in two places (kept verbatim, flagged for the owner):
 *  - Funcție Management is 20 €/funcție/lună on the cards and in the summary table,
 *    but 15 EUR/lună in FAQ 1.1, 1.3 and 3.1 (including the 120 EUR worked example).
 *  - Virtualizare Proiect is 0 € (GRATUIT) on the eMIP Proiecte card,
 *    but 400 euro (o dată) in the summary table and in FAQ 1.3 / 3.2.
 */

type Cta = { label: string; href: string };

export type Price = {
  amount: string;
  unit: string;
};

export type PriceItem = {
  icon: LucideIcon;
  title: string;
  price: Price;
  text: string;
  note?: string;
  /** Mobile app store links shown under the card (eMIP Arch client). */
  stores?: { title: string; links: { label: string; href: string; image: string; width: number; height: number }[] };
};

export type PriceGroup = { letter: string; title: string; items: PriceItem[] };

export type Product = {
  /** Also the URL hash that opens this tab, e.g. /preturi#arch. */
  id: "proiecte" | "plan-afaceri" | "arch";
  /** Full name, e.g. "eMIP® Proiecte". */
  name: string;
  /** The name without the brand, used by the tabs on phones. */
  short: string;
  icon: LucideIcon;
  text: string;
  groups: PriceGroup[];
  advantages: string[];
};

export const intro = {
  eyebrow: "Sistem de tarifare transparent",
  title: "Plătești doar pentru ce folosești",
  text: "Facturare pe funcții active, nu pe număr de utilizatori sau proiecte. Alegeți soluția potrivită nevoilor dumneavoastră.",
  // Taken from FAQ 1.3; repeated next to the price cards so it is not missed.
  vatNote: "Toate prețurile sunt exprimate în EUR, fără TVA.",
  tabsLabel: "Produse eMIP",
  brand: "eMIP®",
  advantagesLabel: "Avantaje",
};

export const meta = {
  title: "Prețuri și Tarife",
  description:
    "Sistem de tarifare transparent: plătești doar pentru ce folosești. Facturare pe funcții active, nu pe număr de utilizatori sau proiecte, pentru eMIP® Proiecte, eMIP® Plan Afaceri și eMIP® Arch.",
};

export const products: Product[] = [
  {
    id: "proiecte",
    name: "eMIP® Proiecte",
    short: "Proiecte",
    icon: FolderKanban,
    text: "Soluție pentru gestionarea proiectelor finanțate din fonduri europene (MIPE / PEO, POIDS, etc.)",
    groups: [
      {
        letter: "A",
        title: "Tarife pe Funcții Utilizatori",
        items: [
          {
            icon: UserCog,
            title: "Funcție Management",
            price: { amount: "20", unit: "€/funcție/lună" },
            text: "Manager proiect, Responsabil financiar, Responsabil achiziții, Asistent manager, Coordonator partener",
            note: "Nu încarcă documente în calendar, nu generează rapoarte de activitate",
          },
          {
            icon: CalendarCheck,
            title: "Funcție Expert",
            price: { amount: "30", unit: "€/funcție/lună" },
            text: "Experți implementare: selecție GT, consiliere, formare, ocupare, tehnic FEDR, informare & publicitate",
            note: "Completează calendar expert, generează rapoarte activitate, arhivă proprie",
          },
          {
            icon: Eye,
            title: "Supraveghere / sprijin Echipă",
            price: { amount: "0", unit: "€" },
            text: "User cu rol Manager în afara funcțiilor echipei de proiect. Se acordă gratuit un utilizator pentru fiecare proiect.",
            note: "Gestionează activitatea echipei fără a-și completa calendar propriu",
          },
        ],
      },
      {
        letter: "B",
        title: "Tarife pe Servicii Adiționale",
        items: [
          {
            icon: Settings2,
            title: "Virtualizare Proiect",
            price: { amount: "0", unit: "€" },
            text: "Setup inițial: introducerea datelor din cererea de finanțare și configurarea platformei.",
            note: "Activități, parteneri, funcții, ore bugetate, rezultate, indicatori - realizat de echipa eMIP",
          },
          {
            icon: Archive,
            title: "Arhivare post implementare",
            price: { amount: "0,5", unit: "€/GB/lună" },
            text: "Pe o perioadă de 1 an calendaristic, după finalizarea proiectului, oferim servicii de stocare pentru arhivă. La cerere se poate prelungi.",
            note: "Nu se percep costuri de operare, puteți genera rapoarte, exporturi de arhivă, etc (clarificări, etc)",
          },
        ],
      },
    ],
    advantages: [
      "Facturare doar pentru lunile cu calendar completat",
      "Nu depinde de numărul de proiecte sau utilizatori",
      "Stocare gratuită: 30 GB/proiect",
      "Stocare pe perioada proiectului + 12 luni post-finalizare",
    ],
  },
  {
    id: "plan-afaceri",
    name: "eMIP® Plan Afaceri",
    short: "Plan Afaceri",
    icon: Calculator,
    text: "Pentru Planuri de Afaceri ce trebuie monitorizate și sunt finanțate din proiect umbrelă (startup-uri, microîntreprinderi)",
    groups: [
      {
        letter: "A",
        title: "Tarif Principal",
        items: [
          {
            icon: Briefcase,
            title: "Manager Afacere",
            price: { amount: "20", unit: "€/lună" },
            text: "Gestionar startup pe toată perioada de implementare",
            note: "Tarif fix lunar pe întreaga perioadă de implementare a Planului de Afaceri",
          },
        ],
      },
      {
        letter: "B",
        title: "Perioada Post-Implementare (1 an)",
        items: [
          {
            icon: Archive,
            title: "Arhivare post implementare",
            price: { amount: "0,5", unit: "€/GB/lună" },
            text: "Menținerea operațională și stocarea arhivei PA în perioada de sustenabilitate",
            note: "Se aplică în perioada de 1 an post-implementare și poate fi prelungit la cerere.",
          },
        ],
      },
    ],
    advantages: [
      "Tarif fix predictibil pe întreaga implementare",
      "Stocare inclusă în perioada de implementare",
      "Fără costuri ascunse în perioada de implementare",
      "Suport pentru raportare și monitorizare",
    ],
  },
  {
    id: "arch",
    name: "eMIP® Arch",
    short: "Arch",
    icon: Archive,
    text: "Sistem complet de arhivare, OCR și management documente, dotat cu agent AI",
    groups: [
      {
        letter: "A",
        title: "Componente Tarifare",
        items: [
          {
            icon: KeyRound,
            title: "Licență Administrator Arhivă",
            price: { amount: "20", unit: "€/lună" },
            text: "Acces complet la funcționalitățile de administrare",
            note: "Gestionare structură arhivă, permisiuni, utilizatori. Poate genera până la 1000 de clienți.",
          },
          {
            icon: HardDrive,
            title: "Stocare Arhivă",
            price: { amount: "0,5", unit: "€/GB/lună" },
            text: "Stocare securizată pe SSD Ultra",
            note: "Include Backup automat și Disaster Recovery",
          },
          {
            icon: ScanText,
            title: "OCR + Augmentare Documente",
            price: { amount: "7", unit: "€/1000 pagini" },
            text: "Recunoaștere optică și indexare fișiere scanate",
            note: "Se achită o singură dată la procesarea documentelor",
          },
          {
            icon: BotMessageSquare,
            title: "Token AI Assistant",
            price: { amount: "5", unit: "€/lună" },
            text: "Asistent AI pentru căutare și analiză documente",
            note: "Căutare semantică (conversational GPT), sumarizare, extragere informații",
          },
          {
            icon: Smartphone,
            title: "Client Mobil",
            price: { amount: "0", unit: "€" },
            text: "Clientul eMIP Arch este publicat în App Store și Google Play și este oferit gratuit utilizatorilor.",
            note: "Aplicațiile sunt verificate și auditate de Apple și Google",
            stores: {
              title: "Descarcă noii clienți eMIP® Arch",
              links: [
                {
                  label: "Descarcă eMIP Arch din App Store",
                  href: "https://apps.apple.com/us/app/emip/id1614192771",
                  image: appStoreBadge,
                  width: 176,
                  height: 55,
                },
                {
                  label: "Descarcă eMIP Arch din Google Play",
                  href: "https://play.google.com/store/apps/details?id=org.eMIP.Pro",
                  image: googlePlayBadge,
                  width: 179,
                  height: 55,
                },
              ],
            },
          },
        ],
      },
    ],
    advantages: [
      "Conformitate ISO 27001 pentru securitate",
      "AI Assistant pentru productivitate maximă",
      "OCR se plătește o singură dată per document",
      "Căutare avansată în documente scanate",
    ],
  },
];

/** One value per product, in the order of `products`; null = not applicable ("-" on the live page). */
export type ComparisonRow = { component: string; values: [string | null, string | null, string | null]; description: string };

export const comparison = {
  eyebrow: "Comparație",
  title: "Rezumat Tarife",
  componentLabel: "Componentă",
  descriptionLabel: "Descriere",
  notApplicable: "Nu se aplică",
  rows: [
    {
      component: "Funcție Management",
      values: ["20 euro/lună", null, null],
      description: "Manager proiect / Responsabil financiar / Responsabil achiziții",
    },
    {
      component: "Funcție Expert",
      values: ["30 euro/lună", null, null],
      description: "Experți implementare cu calendar și rapoarte activitate",
    },
    {
      component: "Manager Afacere",
      values: [null, "20 euro/lună", null],
      description: "Gestionar startup pe perioada de implementare",
    },
    {
      component: "Licență Administrator",
      values: [null, null, "20 euro/lună"],
      description: "Acces complet administrare arhivă electronică",
    },
    {
      component: "Stocare (extra)",
      values: ["0,50 euro/GB/lună", "0,50 euro/GB/lună", "0,50 euro/GB/lună"],
      description: "Peste limita gratuită - SSD Ultra + Backup inclus",
    },
    {
      component: "OCR + Augmentare",
      values: [null, null, "7 euro/1.000 pag."],
      description: "Recunoaștere optică și indexare documente scanate",
    },
    {
      component: "Token AI",
      values: [null, null, "5 euro/lună"],
      description: "Asistent AI pentru căutare și analiză documente",
    },
    {
      component: "Virtualizare Proiect",
      values: ["400 euro (o dată)", null, null],
      description: "Setup inițial realizat de echipa eMIP",
    },
    {
      component: "Stocare Gratuită",
      values: ["30 GB/proiect", "În implementare", null],
      description: "Stocare inclusă fără costuri suplimentare",
    },
  ] satisfies ComparisonRow[],
};

export type FaqItem = {
  /** Number shown on the live page ("Întrebare 1.1"). */
  number: string;
  /** Wix FAQ question id, so old /preturi?questionId=… links still open the right answer. */
  wixId: string;
  question: string;
  /** Markdown (rendered with the shared Markdown component). */
  answer: string;
};

export type FaqCategory = { id: string; title: string; items: FaqItem[] };

export const faq = {
  eyebrow: "FAQ",
  title: "Întrebări frecvente",
  navLabel: "Categorii de întrebări",
  categories: [
    {
      id: "facturare-si-costuri",
      title: "Facturare și Costuri",
      items: [
        {
          number: "1.1",
          wixId: "9fc2e5f4-3888-4f90-881e-a74228a59435",
          question: "Cum se calculează factura lunară pentru eMIP Proiecte?",
          answer: `Facturarea în eMIP Proiecte se bazează pe **numărul de funcții active** într-o lună, nu pe numărul de utilizatori sau proiecte. Concret:

- **Funcție Management (15 EUR/lună):** Se facturează pentru fiecare rol de coordonare activ (Manager proiect, Responsabil financiar, Responsabil achiziții, Asistent manager, Coordonator partener). Aceste funcții NU încarcă documente / livrabile în calendar propriu și NU generează rapoarte de activitate.
- **Funcție Expert (30 EUR/lună):** Se facturează pentru fiecare expert care completează calendar de activitate în luna respectivă. Include: experți selecție GT, consiliere, formare, ocupare, tehnic FEDR, informare și publicitate.
- **Supraveghere Echipă (GRATUIT):** Managerul care doar supervizează echipa fără a completa calendar propriu nu este facturat.

**Exemplu concret:** Un proiect cu 1 Manager, 1 Responsabil financiar și 3 Experți activi în luna ianuarie va fi facturat: (2 x 15 EUR) + (3 x 30 EUR) = **120 EUR/lună**. Primește de asemenea un cont gratuit (rol manager) pe proiect, pentru supraveghere / sprijin membrilor echipei în gestionarea platformei.`,
        },
        {
          number: "1.2",
          wixId: "5a514dcf-3627-4a7f-8000-8ae945036977",
          question: "Ce se întâmplă dacă un expert nu completează calendar într-o lună?",
          answer: `Dacă un expert **nu are activitate raportată** într-o lună calendaristică, funcția respectivă **nu va fi facturată** pentru acea lună.

Sistemul eMIP monitorizează automat activitatea fiecărei funcții:

- Lună cu activitate = funcția este facturată
- Lună fără activitate = funcția NU este facturată

Acest model pay-per-use asigură că plătiți doar pentru resursele efectiv utilizate. De exemplu, în perioada de vacanță sau în lunile cu activitate redusă, costurile se ajustează automat.`,
        },
        {
          number: "1.3",
          wixId: "e356392e-11d8-4422-b13b-67fa2d298e4b",
          question: "Există costuri ascunse sau taxe suplimentare?",
          answer: `NU există costuri ascunse în eMIP. Structura de preț este complet transparentă:

**Costuri recurente (lunare):**

- Funcție Management: 15 EUR/funcție activă
- Funcție Expert: 30 EUR/funcție activă
- Extra-stocare: 0,50 EUR/GB (doar peste 30GB gratuit)

**Costuri unice (o singură dată):**

- Virtualizare proiect: 400 EUR (opțional, realizat de echipa eMIP)

**Inclus gratuit:**

- 30 GB stocare per proiect
- Funcție Supraveghere Echipă
- Backup automat și Disaster Recovery
- Suport tehnic standard
- Update-uri platformă

Toate prețurile sunt exprimate în EUR, fără TVA.`,
        },
      ],
    },
    {
      id: "stocare-si-date",
      title: "Stocare și Date",
      items: [
        {
          number: "2.1",
          wixId: "01c18c77-74e9-4824-8af0-2cb20f695b34",
          question: "Câtă stocare gratuită primesc și ce se întâmplă când o depășesc?",
          answer: `Fiecare proiect în eMIP Proiecte beneficiază de **30 GB stocare gratuită**.

**Ce include stocarea:**

- Documente încărcate de experți
- Rapoarte generate automat
- Backup-uri automate
- Fișiere de arhivă

**Când depășiți limita:**

- Veți fi notificat automat când vă apropiați de 30GB
- Pentru fiecare GB suplimentar se aplică tariful de **0,50 EUR/GB/lună**
- Nu există limită maximă de stocare
- Stocarea suplimentară include aceleași beneficii: SSD Ultra, Backup, Disaster Recovery

**Exemplu:** Dacă proiectul dvs. utilizează 45GB, veți plăti: (45-30) x 0,50 EUR = **7,50 EUR/lună** pentru extra-stocare.`,
        },
        {
          number: "2.2",
          wixId: "13b82d94-efce-41cb-a608-974b4f9e2dff",
          question: "Cât timp sunt păstrate datele după finalizarea proiectului?",
          answer: `Datele proiectului sunt păstrate conform următorului calendar:

**Perioada de implementare:**

- Stocare completă, 30GB gratuit
- Acces complet la toate funcționalitățile

**Post-finalizare (12 luni):**

- Datele rămân disponibile automat
- Accesul este read-only (consultare)
- Stocarea continuă în aceleași condiții
- Puteți descărca arhive complete

**După 12 luni post-finalizare:**

- Primiți notificare cu 30 de zile înainte
- Opțiuni: prelungire stocare, descărcare arhivă, ștergere
- Prelungirea se face la cerere, la tariful standard de stocare

Acest model asigură conformitatea cu cerințele MIPE și ale altor autorități de management pentru păstrarea documentelor proiectelor finanțate.`,
        },
        {
          number: "2.3",
          wixId: "da4551a6-9356-419f-a5fd-044234e06213",
          question: "Datele mele sunt securizate? Ce backup și disaster recovery oferiți?",
          answer: `Securitatea datelor în eMIP respectă cele mai înalte standarde:

**Infrastructură:**

- Stocare pe SSD Ultra (viteze de citire/scriere rapide)
- Centre de date certificate ISO 27001
- Criptare în tranzit (TLS 1.3) și la repaus (AES-256)

**Backup automat:**

- Backup zilnic incremental
- Backup săptămânal complet
- Retenție backup: 90 de zile
- Testare periodică a restaurării

**Disaster Recovery:**

- Replicare geografică în timp real
- RTO (Recovery Time Objective): sub 12 ore
- RPO (Recovery Point Objective): sub 6 ore
- Plan de continuitate testat anual

Toate aceste servicii sunt incluse în tariful standard, fără costuri suplimentare.`,
        },
      ],
    },
    {
      id: "functionalitati-si-produse",
      title: "Funcționalități și Produse",
      items: [
        {
          number: "3.1",
          wixId: "3ebd0dd1-d959-4917-a901-4431acf9fb32",
          question: "Care este diferența între eMIP Proiecte, eMIP Plan Afaceri și eMIP Arch?",
          answer: `**eMIP Proiecte** (Management Fonduri Nerambursabile)

- Pentru proiecte finanțate: MIPE, PEO, POIDS, POCU, etc.
- Funcții: calendar expert, rapoarte activitate, monitorizare indicatori
- Tarif: pe funcții active (15 EUR/30 EUR per funcție/lună)
- Ideal pentru: ONG-uri, autorități publice, companii cu proiecte UE

**eMIP Plan Afaceri** (Management Startup-uri)

- Pentru startup-uri și microîntreprinderi finanțate
- Funcții: gestiune Plan de Afaceri, monitorizare implementare
- Tarif: fix 20 EUR/lună pe toată perioada de implementare
- Ideal pentru: antreprenori, beneficiari Start-Up Nation, etc.

**eMIP Arch** (Arhivare Electronică)

- Sistem complet de arhivare digitală și OCR
- Funcții: scanare, indexare, căutare semantică, AI Assistant
- Tarif: licență 20 EUR/lună + stocare 0,50 EUR/GB + OCR 7 EUR/1000 pag.
- Ideal pentru: companii, instituții cu volume mari de documente`,
        },
        {
          number: "3.2",
          wixId: "b8f6397c-b089-4316-be0f-c3e15d3dba14",
          question: "Ce include serviciul de Virtualizare Proiect (400 EUR)?",
          answer: `Virtualizarea Proiectului este un serviciu **one-time** realizat o singură dată (la începutul colaborării, ORICÂND ÎN PERIOADA IMPLEMENTĂRII PROIECTULUI), de către echipa eMIP, fapt care accelerează demararea utilizării platformei. Acțiunea nu se poate realiza decât dacă este semnat în prealabil un Acord de Confidențialitate (NDA), care permite oferirea de gratuitate în utilizare de maxim 30 de zile calendaristice, până la semnarea Contractului de Licențiere (care conține acoperitor clauzele NDA).

**Ce face echipa eMIP:**

1. **Analiză cerere de finanțare** - studiem documentația aprobată
2. **Configurare structură proiect** - creăm proiectul în platformă
3. **Import activități** - toate activitățile din cerere cu datele planificate
4. **Configurare parteneri** - parteneri, roluri, responsabilități
5. **Definire funcții** - fiecare funcție cu orele bugetate
6. **Setare activități** - sunt setate activitățile, predefinire acțiuni, alocare ore, alocare experți, etc
7. **Asociere Experți pe funcții** - sunt încărcate toate datele relevante: Configurare Useri, CIM, AA, Tip Expert, Rata orară, etc.
8. **Setare rezultate și indicatori** - ținte, parteneri, valori de bază
9. **Training inițial** - instruire echipă (4 ore online via ZOOM / Teams)

**Timp de livrare:** 4-7 zile lucrătoare după primirea documentației complete, funcție de dimensiune echipă de proiect, număr parteneri, fragmentare activități, structură indicatori de proiect și rezultate asumate prin proiect

**Beneficii:** Evitați erorile de configurare, economisiți timp, începeți imediat raportarea.`,
        },
        {
          number: "3.3",
          wixId: "9a0f0c26-20bd-4bd1-baaf-dbc3e68fc9cf",
          question: "Cum funcționează AI Assistant din eMIP Arch și ce poate face?",
          answer: `**AI Assistant eMIP** este un modul opțional (5 EUR/lună) care adaugă capabilități avansate de analiză documente:

**Funcționalități principale:**

**(a) Căutare semantică:**

- Găsește documente după sens, nu doar cuvinte cheie
- Exemplu: „contracte expirate în Q1” găsește toate contractele relevante

**(b) Sumarizare automată**

- Rezumate instant pentru documente lungi
- Extragere puncte cheie din rapoarte

**(c) Extragere informații**

- Date structurate din facturi, contracte
- Identificare entități: nume, date, sume

**(d) Răspunsuri la întrebări**

- Întrebați în limbaj natural despre conținutul arhivei
- Exemplu: „Care este valoarea totală a contractelor din 2025?”

**Limitări:** Procesează documente text și OCR. Nu generează documente noi, doar analizează cele existente și emite structuri de informații / sumarizări ale documentelor existente.`,
        },
      ],
    },
    {
      id: "testare-si-onboarding",
      title: "Testare și Onboarding",
      items: [
        {
          number: "4.1",
          wixId: "0b6f1b9b-6aeb-43e7-a40f-76611b8250a0",
          question: "Pot testa platforma înainte de a cumpăra?",
          answer: `DA! Oferim **acces DEMO complet și gratuit** pentru evaluarea platformei.

**Ce include DEMO-ul:**

- Acces (prin autentificare forțată) la toate soluțiile (Proiecte, Plan Afaceri, Arch), prin roluri diferite setate în cadrul unor proiecte DEMO.
- Proiect de test pre-configurat cu date fictive
- 7 zile de acces nelimitat
- Suport dedicat pentru ghidare
- Sesiune de prezentare online (30 min - 1,5h, opțional)

**Cum obțineți accesul:**

1. Completați [formularul de contact](/contact) pe emip.ro
2. Primiți credențiale în maxim 24 ore
3. Accesați [https://pro.emip.ro](${APP_URL}) cu datele primite
4. Explorați liber sau programați o sesiune ghidată din secțiunea [SERVICII >> Workshop prezentare eMIP](${servicePath("workshop-demo-prezentare")}).

**După DEMO:** Fără obligații. Decideți în cunoștință de cauză.`,
        },
        {
          number: "4.2",
          wixId: "d2a2c0a4-1953-495e-abc9-9678c2584850",
          question: "Cât durează configurarea și ce suport primesc?",
          answer: `**Timeline standard de implementare:**

| Etapă | Durată | Activități |
| --- | --- | --- |
| Analiză | 1-2 zile | Discuție cerințe, acces documente |
| Configurare | 3-5 zile | Virtualizare proiect (dacă se comandă) |
| Training | 1-2 zile | Sesiuni online pentru echipă |
| Go-Live | 1 zi | Activare conturi, start utilizare |

**Total:** 5-10 zile lucrătoare pentru implementare completă.

**Suport inclus:**

- Email support: răspuns în sub 24 ore (zile lucrătoare)
- Knowledge base online cu tutoriale video
- Documentație completă în română
- Update-uri automate fără downtime

**Suport premium (opțional):**

- Telefon dedicat
- Răspuns în sub 4 ore
- Account manager dedicat`,
        },
        {
          number: "4.3",
          wixId: "4696a806-7dee-4625-853d-7270fe9da91b",
          question: "Ce se întâmplă dacă vreau să renunț la serviciu?",
          answer: `Puteți renunța oricând, fără penalități:

**Proces de dezactivare:**

1. Notificați echipa eMIP cu 30 zile înainte
2. Primiți link pentru descărcarea arhivei complete
3. Descărcați toate documentele în format original
4. Primiți export structurat (CSV/JSON) al metadatelor
5. După 30 zile, contul este dezactivat

**Ce primiți la plecare:**

- Toate documentele originale (PDF, DOC, etc.)
- Rapoartele generate în format PDF
- Export date structurate
- Certificat de ștergere date (la cerere, GDPR)

**Obligații contractuale:**

- Plata facturilor restante
- Fără alte penalități sau taxe de reziliere

Transparența și dreptul asupra propriilor date sunt garantate.`,
        },
      ],
    },
  ] satisfies FaqCategory[],
};

export const cta = {
  title: "Găsește soluția potrivită pentru tine",
  text: "Programează o prezentare personalizată și descoperă cum eMIP poate ajuta organizația ta.",
  primary: { label: "Accesează cont demo", href: APP_URL } satisfies Cta,
  secondary: { label: "Solicită o Prezentare", href: "/contact" } satisfies Cta,
};
