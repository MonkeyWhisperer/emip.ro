import { Outlet, ScrollRestoration, useNavigation } from "react-router";
import { ChatLauncher } from "../chat/ChatLauncher";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function SiteLayout() {
  const navigating = useNavigation().state === "loading";

  return (
    <div id="top" className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-navy-950"
      >
        Sari la conținut
      </a>
      {/* Lazy pages and API loaders can take a moment; show progress instead of a frozen page. */}
      <div
        aria-hidden
        className={`fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-brand-400 transition-transform duration-700 ease-out ${
          navigating ? "scale-x-75" : "scale-x-0"
        }`}
      />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatLauncher />
      {/* Full page loads all get location.key "default"; key those by URL instead so a fresh
          load (or a #hash link) doesn't inherit another page's saved scroll position. */}
      <ScrollRestoration
        getKey={(location) => (location.key === "default" ? location.pathname + location.search + location.hash : location.key)}
      />
    </div>
  );
}
