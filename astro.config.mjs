// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { rm, writeFile } from "node:fs/promises";
import { headersFile, robotsTxt, sitemapXml } from "./src/lib/site/seo-files.ts";

// One switch for robots.txt, X-Robots-Tag and <meta name="robots"> (set as a real build
// environment variable, e.g. in Workers Builds settings, only for the approved production build).
const indexable = process.env.PUBLIC_ALLOW_INDEXING === "true";
const siteUrl = "https://theweddingnest.in";
// Live enquiry submission (owner-gated). Off unless explicitly enabled for a build.
const enquiries = process.env.PUBLIC_ENQUIRIES_ENABLED === "true";
const TURNSTILE = "https://challenges.cloudflare.com";

/** @type {import("astro").AstroIntegration} */
const seoFiles = {
  name: "twn-seo-files",
  hooks: {
    "astro:build:done": async ({ dir, pages }) => {
      await writeFile(new URL("_headers", dir), headersFile(indexable));
      await writeFile(new URL("robots.txt", dir), robotsTxt(indexable, siteUrl));
      const sitemap = new URL("sitemap.xml", dir);
      if (indexable) {
        await writeFile(sitemap, sitemapXml(siteUrl, pages.map((page) => page.pathname)));
      } else {
        // A reused build directory must not retain a previous indexable sitemap.
        await rm(sitemap, { force: true });
      }
    },
  },
};

// Static-first build served by Cloudflare Workers Static Assets (see wrangler.jsonc).
export default defineConfig({
  site: siteUrl,
  output: "static",
  // Lets CI build a second, submission-enabled variant side by side (dist-submit).
  outDir: process.env.ASTRO_OUT_DIR ?? "./dist",
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
    csp: enquiries
      ? {
          scriptDirective: { resources: ["'self'", TURNSTILE] },
          directives: [`frame-src ${TURNSTILE}`],
        }
      : true,
  },
  integrations: [seoFiles],
  vite: {
    plugins: [tailwindcss()],
  },
});
