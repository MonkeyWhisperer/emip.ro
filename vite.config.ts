import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In development the API runs separately (npm run dev starts both) and Vite proxies to it.
// API_URL lets a second dev setup point at an API on another port.
// changeOrigin must stay false: the API's same-origin check compares Origin with Host,
// and the string shorthand would rewrite Host to the API's address.
const api = { target: process.env.API_URL ?? "http://127.0.0.1:3001", changeOrigin: false };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": api,
      "/media/uploads": api,
    },
  },
});
