import { APP_URL } from "./site";
import { howItWorks } from "./home";
import { contactHref, serviceLabels } from "./servicii";

type Cta = { label: string; href: string };

// Wix Bookings cannot be migrated: requests for the next session go through the contact form.
const nextWorkshop: Cta = {
  label: "Solicită următorul workshop",
  href: contactHref("Workshop eMIP - următoarea sesiune"),
};

// The live page (www.emip.ro/workshop-09-sept-2026) is password protected, so its own
// content could not be migrated. This page keeps the event URL, states that the event has
// ended and reuses the published copy about eMIP workshops (Workshop DEMO service, home page).
export const workshopPage = {
  meta: {
    title: "Workshop 10.09.2026",
    description:
      "Workshop-ul eMIP din 10.09.2026 s-a încheiat. Solicită următorul workshop demonstrativ de prezentare a platformei eMIP pentru echipa ta de proiect.",
  },
  header: {
    eyebrow: "Workshop eMIP",
    title: "Workshop 10.09.2026",
  },
  event: {
    date: "2026-09-10",
    dateLabel: "10.09.2026",
  },
  ended: {
    title: "Evenimentul s-a încheiat",
    /** Followed by the event date. */
    dateText: "Workshop-ul a avut loc pe",
    text: "Trimite-ne o solicitare și revenim cu detalii despre următoarea sesiune.",
    cta: nextWorkshop,
  },
  about: {
    // The content of the 10.09 event is unknown (password protected), so this section presents
    // the bookable Workshop DEMO service (content/servicii.ts) rather than describing the event.
    eyebrow: "Workshop la cerere",
    serviceSlug: "workshop-demo-prezentare",
    more: serviceLabels.details,
  },
  // Same steps as on the home page: the workshop is the first one.
  steps: {
    eyebrow: howItWorks.eyebrow,
    title: howItWorks.title,
    text: howItWorks.text,
    items: howItWorks.steps,
  },
  finalCta: {
    title: "Vrei să participi la următorul workshop?",
    // Wording of the "Workshop-uri Periodice" point on the home page.
    text: "Acces la workshop-uri organizate periodic, cu proiecte demonstrative care detaliază pașii pentru întocmirea rapoartelor complete.",
    primary: nextWorkshop,
    secondary: { label: "Accesează cont demo", href: APP_URL } satisfies Cta,
  },
};
