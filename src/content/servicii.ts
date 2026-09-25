import type { LucideIcon } from "lucide-react";
import { Clock, GraduationCap, Presentation, Video, Wallet } from "lucide-react";
import workshopImage from "../assets/servicii/workshop-demo.svg";
import mentoringImage from "../assets/servicii/mentorat-plan-afaceri.svg";

export type ServiceFact = { icon: LucideIcon; label: string; value: string };

/** One block of the service description: an optional heading, then paragraphs and/or a bullet list. */
export type ServiceSection = { title?: string; paragraphs?: string[]; items?: string[] };

export type Service = {
  slug: string;
  icon: LucideIcon;
  title: string;
  /** Subtitle on the service's own page (the cards show the image instead). */
  tagline: string;
  /** Illustration on the service card: a 16:9 SVG drawn for the site (src/assets/servicii). */
  image: { src: string; alt: string };
  /** Small label shown next to the title, e.g. "Disponibil online". */
  badge?: string;
  facts: ServiceFact[];
  /**
   * Wix Bookings cannot be migrated: "Rezervă acum" opens the contact form with this
   * subject preselected (/contact?subiect=...).
   */
  bookingSubject: string;
  metaDescription: string;
  description: ServiceSection[];
};

/** Link to the contact form with the subject field prefilled. */
export const contactHref = (subject: string) => `/contact?subiect=${encodeURIComponent(subject)}`;

export const servicePath = (slug: string) => `/service-page/${slug}`;

// In the order of the live /servicii page.
export const services: Service[] = [
  {
    slug: "workshop-demo-prezentare",
    icon: Presentation,
    title: "Workshop DEMO prezentare",
    tagline: "Derularea unui workshop demonstrativ privind operarea platformei eMIP",
    image: {
      src: workshopImage,
      alt: "Ilustrație: platforma eMIP prezentată într-o întâlnire online, cu participanții în apel video",
    },
    facts: [
      { icon: Clock, label: "Durată", value: "1 oră" },
      { icon: Wallet, label: "Preț", value: "Gratuit" },
      { icon: Video, label: "Desfășurare", value: "Online via ZOOM" },
    ],
    bookingSubject: "Workshop demo - prezentare platformă",
    metaDescription:
      "Workshop demonstrativ gratuit, de 1 oră, despre operarea platformei eMIP: cum eficientizați implementarea proiectelor finanțate prin programele PEO, PCIDIF și PoIDS.",
    description: [
      {
        paragraphs: [
          "Descoperiți Platforma eMIP, platforma dumneavoastră esențială pentru automatizarea documentelor și gestionarea proceselor în cadrul organizațiilor. Alăturați-vă atelierului nostru demonstrativ pentru a explora modul în care eMIP poate eficientiza implementarea proiectelor finanțate prin granturi europene, în special prin programele PEO, PCIDIF și PoIDS. Creșteți eficiența managementului de proiect cu ajutorul ecosistemului nostru digital de ultimă generație, conceput pentru a satisface nevoile organizației dumneavoastră.",
        ],
      },
    ],
  },
  {
    slug: "mentorat-prin-emip-plan-afaceri",
    icon: GraduationCap,
    title: "Mentorat prin eMIP Plan Afaceri",
    tagline: "Program de Tutorat Online – Antreprenoriat cu Experiență",
    image: {
      src: mentoringImage,
      alt: "Ilustrație: sesiune de mentorat online lângă un plan de afaceri cu secțiuni bifate și un grafic de creștere",
    },
    // The live page shows no price for this service.
    facts: [
      { icon: Clock, label: "Durată", value: "1 oră" },
      { icon: Video, label: "Desfășurare", value: "Online via ZOOM" },
    ],
    bookingSubject: "Mentorat prin eMIP Plan Afaceri",
    metaDescription:
      "Program de tutorat online pentru antreprenori: îndrumare practică de la un tutore cu experiență pentru ideea de afaceri, planificare, strategie, marketing, vânzări și management financiar.",
    description: [
      {
        title: "Descriere",
        paragraphs: [
          "Acest program de tutorat online este dedicat persoanelor interesate să își dezvolte abilitățile antreprenoriale, să lanseze sau să crească o afacere, beneficiind de îndrumarea directă a unui tutore cu experiență practică în domeniu. Tutorele pune la dispoziție cunoștințele acumulate în ani de activitate antreprenorială, oferind sprijin personalizat, studii de caz reale și soluții concrete la provocările întâmpinate de participanți.",
        ],
      },
      {
        title: "Ce oferă programul",
        items: [
          "Sesiuni individuale sau de grup, desfășurate online, adaptate nevoilor fiecărui participant.",
          "Îndrumare practică privind dezvoltarea ideii de afaceri, planificare, strategie, marketing, vânzări, management financiar și leadership.",
          "Acces la resurse, instrumente și exemple din experiența reală a tutorelui.",
          "Feedback constructiv și suport continuu pe parcursul programului.",
          "O comunitate de învățare, unde participanții pot face schimb de idei și pot colabora.",
        ],
      },
      {
        title: "Cui se adresează",
        paragraphs: [
          "Programul este potrivit atât pentru cei care sunt la început de drum în antreprenoriat, cât și pentru antreprenorii care doresc să își ducă afacerea la următorul nivel, să evite greșelile comune și să beneficieze de know-how-ul unui profesionist.",
        ],
      },
      {
        title: "Obiectiv",
        paragraphs: [
          "Scopul programului este să accelereze procesul de învățare și dezvoltare antreprenorială, să ofere claritate și încredere participanților, astfel încât aceștia să poată lua decizii informate și să își atingă obiectivele de business.",
        ],
      },
    ],
  },
];

/**
 * Old service URLs that no longer exist on the live site but are still linked (e.g. from
 * blog posts), redirected to the closest current service.
 */
export const serviceAliases: Record<string, string> = {
  // "Workshop MyStart - Plan Afaceri" (free workshop presenting the business-plan tools),
  // linked from the post "Antreprenorii INNOTECH STUDENTS - folosesc eMIP"; 404 on the live site.
  "workshop-mystart-plan-afaceri": "workshop-demo-prezentare",
};

export const findService = (slug: string) => services.find((s) => s.slug === slug);

export const serviciiPage = {
  meta: {
    title: "Servicii",
    description:
      "Serviciile eMIP: Workshop DEMO de prezentare a platformei (1 oră, gratuit) și Mentorat prin eMIP Plan Afaceri, program de tutorat online pentru antreprenori.",
  },
  header: {
    eyebrow: "Servicii",
    title: "Serviciile noastre",
    text: "Workshop-uri demonstrative pentru echipele de proiect și mentorat pentru antreprenori. Alege serviciul potrivit și trimite-ne o cerere de programare.",
  },
  bookingNote:
    "Programările se fac prin formularul de contact: după ce apeși „Rezervă acum”, subiectul mesajului este completat automat.",
};

/** Labels shared by the service list and the service detail page. */
export const serviceLabels = {
  eyebrow: "Servicii",
  /** Accessible name of the fact chips in the service page header. */
  summary: "Pe scurt",
  book: "Rezervă acum",
  details: "Detalii serviciu",
  allServices: "Listă de servicii",
  descriptionTitle: "Descrierea serviciului",
  bookingTitle: "Rezervare",
  contactTitle: "Detalii de contact",
  otherServices: "Alte servicii",
};
