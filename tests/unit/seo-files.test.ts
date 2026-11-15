import { describe, expect, it } from "vitest";
import { headersFile, robotsTxt } from "../../src/lib/site/seo-files";
import { robotsContent } from "../../src/lib/site/config";

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

  it("keeps security headers in both modes", () => {
    for (const mode of [false, true]) {
      const h = headersFile(mode);
      expect(h).toContain("frame-ancestors 'none'");
      expect(h).toContain("X-Content-Type-Options: nosniff");
      expect(h).toContain("/_astro/*");
    }
  });
});
