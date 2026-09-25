import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The site font's two subsets that Romanian text needs (Latin, and Latin Extended for ă, ș, ț).
// index.html preloads them: otherwise the browser only asks for them once the app has rendered,
// and the first page shows in the fallback font until they arrive.
const FONT_FILES = ["plus-jakarta-sans-latin-wght-normal", "plus-jakarta-sans-latin-ext-wght-normal"];

function preloadFonts(): Plugin {
  return {
    name: "preload-fonts",
    transformIndexHtml(_html, { bundle }) {
      return FONT_FILES.map((name) => {
        let href = `/node_modules/@fontsource-variable/plus-jakarta-sans/files/${name}.woff2`;
        if (bundle) {
          const asset = Object.values(bundle).find((f) => path.basename(f.fileName).startsWith(`${name}-`) && f.fileName.endsWith(".woff2"));
          // Fail the build rather than ship without the preload if @fontsource renames its files.
          if (!asset) throw new Error(`preload-fonts: no ${name}-*.woff2 in the build`);
          href = `/${asset.fileName}`;
        }
        return { tag: "link", attrs: { rel: "preload", href, as: "font", type: "font/woff2", crossorigin: true }, injectTo: "head" };
      });
    },
  };
}

// In development the API runs separately (npm run dev starts both) and Vite proxies to it.
// API_URL lets a second dev setup point at an API on another port.
// changeOrigin must stay false: the API's same-origin check compares Origin with Host,
// and the string shorthand would rewrite Host to the API's address.
const api = { target: process.env.API_URL ?? "http://127.0.0.1:3001", changeOrigin: false };

export default defineConfig({
  plugins: [react(), tailwindcss(), preloadFonts()],
  server: {
    proxy: {
      "/api": api,
      "/media/uploads": api,
    },
  },
});
