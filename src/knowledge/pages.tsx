import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { Footer } from "../components/layout/Footer";
import { ContactPage } from "../pages/contact/ContactPage";
import { DesprePage } from "../pages/despre/DesprePage";
import { FunctionalitatiPage } from "../pages/functionalitati/FunctionalitatiPage";
import { HomePage } from "../pages/home/HomePage";
import { ConfidentialitatePage } from "../pages/legal/ConfidentialitatePage";
import { CookiesPage } from "../pages/legal/CookiesPage";
import { TermeniPage } from "../pages/legal/TermeniPage";
import { LibrariePage } from "../pages/librarie/LibrariePage";
import { PreturiPage } from "../pages/preturi/PreturiPage";
import { ServicePage } from "../pages/servicii/ServicePage";
import { ServiciiPage } from "../pages/servicii/ServiciiPage";
import { SolutiiPage } from "../pages/solutii/SolutiiPage";

// Server-side render of the static pages, used by scripts/export-site-text.ts to feed the AI
// assistant's knowledge base (blog posts come from the database instead); the server also uses
// the exported titles and descriptions for link-preview meta tags.
// When a page is added to src/router.tsx, add it here too. Pages about past events are left
// out (e.g. /workshop-09-sept-2026, held on 10.09.2026): the assistant would present them as current.

type Entry = { path: string; pattern?: string; Component: ComponentType; title?: string };

const PAGES: Entry[] = [
  { path: "/", Component: HomePage },
  { path: "/functionalitati", Component: FunctionalitatiPage },
  { path: "/solutii", Component: SolutiiPage },
  { path: "/preturi", Component: PreturiPage },
  { path: "/servicii", Component: ServiciiPage },
  { path: "/service-page/mentorat-prin-emip-plan-afaceri", pattern: "/service-page/:slug", Component: ServicePage },
  { path: "/service-page/workshop-demo-prezentare", pattern: "/service-page/:slug", Component: ServicePage },
  { path: "/noi", Component: DesprePage },
  { path: "/contact", Component: ContactPage },
  { path: "/librarie", Component: LibrariePage },
  { path: "/termeni-si-conditii-legale", Component: TermeniPage },
  { path: "/politica-de-confidentialitate", Component: ConfidentialitatePage },
  { path: "/politica-cookies", Component: CookiesPage },
  // The footer (shown on every page), under its own name: presented as "/contact#program" the
  // assistant took its phone and hours for the Contact page's and left out the page's own values.
  // Distinct path (it doubles as the knowledge-source key); the hash links to the home page.
  { path: "/#subsol", pattern: "*", Component: Footer, title: "Subsolul site-ului: date de contact și program" },
];

export type RenderedPage = { path: string; title: string; html: string; error?: string };

export function renderPages(): RenderedPage[] {
  return PAGES.map(({ path, pattern, Component, title }) => {
    try {
      const html = renderToString(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={pattern ?? path} element={<Component />} />
          </Routes>
        </MemoryRouter>,
      );
      const pageTitle = title ?? html.match(/<title>(.*?)<\/title>/)?.[1]?.replace(/\s*\|\s*Platforma eMIP$/, "") ?? path;
      return { path, title: pageTitle, html };
    } catch (err) {
      return { path, title: title ?? path, html: "", error: err instanceof Error ? err.message : String(err) };
    }
  });
}
