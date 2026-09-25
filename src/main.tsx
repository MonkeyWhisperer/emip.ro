import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import "@fontsource-variable/plus-jakarta-sans";
import "./index.css";
import { prefetchSitePages, router } from "./router";

// The server puts the page's <title>, meta description, og:* tags and canonical link into the
// served HTML (marked data-server-meta) for link previews and crawlers that don't run scripts.
// From here on each page renders its own (PageMeta); drop the server's so nothing is duplicated.
document.head.querySelectorAll("[data-server-meta]").forEach((el) => el.remove());

// Draw the first page in the site font instead of swapping it in a moment later: wait for its Latin
// and Latin Extended subsets ("a", "ș"), which index.html preloads so they are usually in by now,
// but never longer than 500 ms, and render anyway if they fail.
const fontsReady = Promise.race([
  document.fonts.load('1em "Plus Jakarta Sans Variable"', "aș"),
  new Promise((resolve) => setTimeout(resolve, 500)),
]).catch(() => {});

fontsReady.then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  prefetchSitePages();
});
