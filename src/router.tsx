import type { ComponentType } from "react";
import { Navigate, createBrowserRouter, useParams, type RouteObject } from "react-router";
import { SiteLayout } from "./components/layout/SiteLayout";
import { RouteError } from "./components/layout/RouteError";
import { HomePage } from "./pages/home/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

/** Lazy route whose module exports the page component under `name`. */
function page<M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M, loader?: keyof M): RouteObject["lazy"] {
  return async () => {
    const mod = await load();
    return {
      Component: mod[name] as ComponentType,
      ...(loader && { loader: mod[loader] as never }),
    };
  };
}

const blogIndex = page(() => import("./pages/blog/BlogIndexPage"), "BlogIndexPage", "blogIndexLoader");

// The Wix site's English pages (/en/...), mirroring the server's 301s (legacyTarget in
// server/siteRoutes.ts, keep in sync): pages that exist in Romanian go there, English blog
// categories to their Romanian slugs, everything else to the home page.
const EN_PAGES = new Set(["noi", "contact", "servicii", "librarie", "blog", "search", "functionalitati", "solutii", "preturi"]);
const EN_CATEGORIES: Record<string, string> = {
  "social-economy": "economie-sociala",
  digitization: "digitalizare",
  partnerships: "parteneriate",
  "mip-tools": "instrumente-mip",
};

function englishTarget(rest: string) {
  const path = rest.replace(/\/$/, "").toLowerCase();
  if (EN_PAGES.has(path)) return `/${path}`;
  const category = path.match(/^blog\/categories\/([\w-]+)$/)?.[1];
  if (category && Object.hasOwn(EN_CATEGORIES, category)) return `/blog/categories/${EN_CATEGORIES[category]}`;
  return "/";
}

function EnglishRedirect() {
  return <Navigate to={englishTarget(useParams()["*"] ?? "")} replace />;
}

// Paths mirror the Wix site so existing links and search rankings keep working.
const siteRoutes: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: "functionalitati", lazy: page(() => import("./pages/functionalitati/FunctionalitatiPage"), "FunctionalitatiPage") },
  { path: "solutii", lazy: page(() => import("./pages/solutii/SolutiiPage"), "SolutiiPage") },
  { path: "preturi", lazy: page(() => import("./pages/preturi/PreturiPage"), "PreturiPage") },
  { path: "servicii", lazy: page(() => import("./pages/servicii/ServiciiPage"), "ServiciiPage") },
  { path: "service-page/:slug", lazy: page(() => import("./pages/servicii/ServicePage"), "ServicePage") },
  { path: "workshop-09-sept-2026", lazy: page(() => import("./pages/workshop/WorkshopPage"), "WorkshopPage") },
  { path: "noi", lazy: page(() => import("./pages/despre/DesprePage"), "DesprePage") },
  { path: "contact", lazy: page(() => import("./pages/contact/ContactPage"), "ContactPage") },
  { path: "librarie", lazy: page(() => import("./pages/librarie/LibrariePage"), "LibrariePage") },
  { path: "termeni-si-conditii-legale", lazy: page(() => import("./pages/legal/TermeniPage"), "TermeniPage") },
  { path: "politica-de-confidentialitate", lazy: page(() => import("./pages/legal/ConfidentialitatePage"), "ConfidentialitatePage") },
  { path: "politica-cookies", lazy: page(() => import("./pages/legal/CookiesPage"), "CookiesPage") },
  { path: "search", lazy: page(() => import("./pages/search/SearchPage"), "SearchPage") },

  { path: "blog", lazy: blogIndex },
  { path: "blog/page/:page", lazy: blogIndex },
  { path: "blog/categories/:slug", lazy: blogIndex },
  { path: "blog/categories/:slug/page/:page", lazy: blogIndex },
  { path: "post/:slug", lazy: page(() => import("./pages/blog/PostPage"), "PostPage", "postLoader") },

  // Legacy Wix URLs
  { path: "copy-of-politica-de-confidențialitate", element: <Navigate to="/politica-cookies" replace /> },
  { path: "cookies", element: <Navigate to="/politica-cookies" replace /> },
  { path: "politica-confidentialitate", element: <Navigate to="/politica-de-confidentialitate" replace /> },
  { path: "blog/tags/*", element: <Navigate to="/blog" replace /> },
  { path: "profil/*", element: <Navigate to="/blog" replace /> },
  { path: "product-page/*", element: <Navigate to="/" replace /> },
  { path: "en/*", element: <EnglishRedirect /> },

  { path: "*", element: <PlaceholderPage notFound /> },
];

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [{ errorElement: <RouteError />, children: siteRoutes }],
  },
  {
    path: "admin",
    lazy: page(() => import("./pages/admin/AdminLayout"), "AdminLayout"),
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: page(() => import("./pages/admin/AdminPostsPage"), "AdminPostsPage") },
      { path: "login", lazy: page(() => import("./pages/admin/AdminLoginPage"), "AdminLoginPage") },
      { path: "posts/new", lazy: page(() => import("./pages/admin/AdminPostEditorPage"), "AdminPostEditorPage") },
      { path: "posts/:id", lazy: page(() => import("./pages/admin/AdminPostEditorPage"), "AdminPostEditorPage") },
      { path: "categories", lazy: page(() => import("./pages/admin/AdminCategoriesPage"), "AdminCategoriesPage") },
      { path: "messages", lazy: page(() => import("./pages/admin/AdminMessagesPage"), "AdminMessagesPage") },
      { path: "ai", lazy: page(() => import("./pages/admin/AdminAiPage"), "AdminAiPage") },
      { path: "*", lazy: page(() => import("./pages/admin/AdminNotFoundPage"), "AdminNotFoundPage") },
    ],
  },
]);
