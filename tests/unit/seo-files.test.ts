import { describe, expect, it } from "vitest";
import { headersFile, robotsTxt, sitemapXml } from "../../src/lib/site/seo-files";
import { robotsContent, SITE } from "../../src/lib/site/config";

describe("indexing switch keeps robots.txt, X-Robots-Tag and meta robots in step", () => {
  it("preview (default): everything says noindex", () => {
    expect(robotsTxt(false)).toMatch(/Disallow: \/\s*$/m);
    expect(headersFile(false)).toContain("X-Robots-Tag: noindex, nofollow");
    expect(robotsContent(false)).toBe("noindex, nofollow");
  });

  it("approved production: everything allows indexing", () => {
    expect(robotsTxt(true)).toMatch(/Allow: \//);
    expect(robotsTxt(true)).not.toMatch(/Disallow: \/\s*$/m);
    expect(headersFile(true)).not.toContain("X-Robots-Tag");
    expect(robotsContent(true)).toBe("index, follow");
  });

  it("mentions a sitemap only after indexing is explicitly enabled", () => {
    expect(robotsTxt(false)).not.toContain("Sitemap:");
    expect(robotsTxt(true, SITE.url)).toContain(`Sitemap: ${SITE.url}/sitemap.xml`);
  });

  it("generates canonical same-origin sitemap URLs and omits the 404 page", () => {
    const xml = sitemapXml(SITE.url, [
      "/",
      "/plan-your-event",
      "/plan-your-event/",
      "/404",
      "/404.html",
      "https://untrusted.example/",
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(`<loc>${SITE.url}/</loc>`);
    expect(xml).toContain(`<loc>${SITE.url}/plan-your-event/</loc>`);
    expect(xml).not.toContain("404");
    expect(xml).not.toContain("untrusted");
    expect(xml.match(/<loc>/g)).toHaveLength(2);
  });

  it("keeps security headers in both modes", () => {
    for (const mode of [false, true]) {
      const h = headersFile(mode);
      expect(h).toContain("frame-ancestors 'none'");
      expect(h).toContain("X-Content-Type-Options: nosniff");
      expect(h).toContain("/_astro/*");
    }
  });
});
