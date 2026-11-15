// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Static-first build served by Cloudflare Workers Static Assets (see wrangler.jsonc).
export default defineConfig({
  site: "https://theweddingnest.in",
  output: "static",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  // Hash-based CSP <meta> for scripts/styles; frame-ancestors etc. live in public/_headers.
  // No code blocks on this site; Shiki's inline styles would conflict with the CSP.
  markdown: {
    syntaxHighlight: false,
  },
  security: {
    csp: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
