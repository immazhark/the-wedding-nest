// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { writeFile } from "node:fs/promises";
import { headersFile, robotsTxt } from "./src/lib/site/seo-files.ts";

// One switch for robots.txt, X-Robots-Tag and <meta name="robots"> (set as a real build
// environment variable, e.g. in Workers Builds settings, only for the approved production build).
const indexable = process.env.PUBLIC_ALLOW_INDEXING === "true";

/** @type {import("astro").AstroIntegration} */
const seoFiles = {
  name: "twn-seo-files",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      await writeFile(new URL("_headers", dir), headersFile(indexable));
      await writeFile(new URL("robots.txt", dir), robotsTxt(indexable));
    },
  },
};

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
  integrations: [seoFiles],
  vite: {
    plugins: [tailwindcss()],
  },
});
