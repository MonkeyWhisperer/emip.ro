export const APP_URL = "https://pro.emip.ro/";
/** Shown under every "Accesează cont demo" button (components/ui/DemoButton). */
export const DEMO_NOTE = "Cu proiecte demo virtualizate.";

export type NavItem = { label: string; href: string };

// Paths mirror the current Wix site so existing links and search rankings keep working.
export const mainNav: NavItem[] = [
  { label: "Funcționalități", href: "/functionalitati" },
  { label: "Soluții", href: "/solutii" },
  { label: "Prețuri", href: "/preturi" },
  { label: "Servicii", href: "/servicii" },
  { label: "Blog", href: "/blog" },
  { label: "Despre noi", href: "/despre-noi" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: NavItem[] = [
  { label: "Despre noi", href: "/despre-noi" },
  { label: "Funcționalități", href: "/functionalitati" },
  { label: "Soluții", href: "/solutii" },
  { label: "Prețuri și Tarife", href: "/preturi" },
  { label: "Servicii", href: "/servicii" },
  { label: "Librărie", href: "/librarie" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

/** Pages in no menu that the site search must still find (/certificari is linked from the home page and Contact). */
export const unlistedPages: NavItem[] = [{ label: "Certificări", href: "/certificari" }];

export const legalNav: NavItem[] = [
  { label: "Termeni și condiții", href: "/termeni-si-conditii-legale" },
  { label: "Politica de Confidențialitate", href: "/politica-de-confidentialitate" },
  { label: "Politica privind cookies", href: "/politica-cookies" },
];

export const contact = {
  street: "str. Tudor Arghezi nr 6",
  city: "Alba Iulia, 510219, Alba",
  phone: "0745 128 387",
  phoneHref: "tel:+40745128387",
  email: "office@emip.ro",
  hours: [
    { days: "Luni – Vineri", time: "10 – 18" },
    { days: "Sâmbătă", time: "10 – 14" },
    { days: "Duminică", time: "mesaje online" },
  ],
};

// Entries with an empty href or `hidden: true` are not rendered.
// TODO: Facebook and YouTube URLs (the old Wix site pointed them at Wix's own pages).
export const social: { network: "linkedin" | "facebook" | "youtube"; label: string; href: string; hidden?: boolean }[] = [
  { network: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/emip-ro/posts/?feedView=all", hidden: true },
  { network: "facebook", label: "Facebook", href: "" },
  { network: "youtube", label: "YouTube", href: "" },
];
