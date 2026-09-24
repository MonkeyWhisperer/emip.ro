import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import "@fontsource-variable/plus-jakarta-sans";
import "./index.css";
import { router } from "./router";

// The server puts the page's <title>, meta description, og:* tags and canonical link into the
// served HTML (marked data-server-meta) for link previews and crawlers that don't run scripts.
// From here on each page renders its own (PageMeta); drop the server's so nothing is duplicated.
document.head.querySelectorAll("[data-server-meta]").forEach((el) => el.remove());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
