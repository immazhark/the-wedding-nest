import { expect, test } from "@playwright/test";
import { accountedResourceBytes } from "../../src/lib/site/resource-budget";

for (const path of ["/", "/plan-your-event/"]) {
  test(`preview ${path} uses only first-party resources and stays within a lightweight JS budget`, async ({
    page,
    baseURL,
  }) => {
    const expectedOrigin = new URL(baseURL!).origin;
    const thirdParty: string[] = [];
    const failed: string[] = [];

    page.on("request", (request) => {
      const url = request.url();
      if (/^https?:\/\//.test(url) && new URL(url).origin !== expectedOrigin) {
        thirdParty.push(url);
      }
    });
    page.on("requestfailed", (request) => failed.push(request.url()));

    await page.goto(path, { waitUntil: "networkidle" });

    const entries = await page.evaluate(() =>
      (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).map((entry) => ({
        pathname: new URL(entry.name).pathname,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
      })),
    );
    const bytes = (suffix: RegExp) =>
      entries
        .filter((entry) => suffix.test(entry.pathname))
        .reduce((total, entry) => total + accountedResourceBytes(entry), 0);
    const resources = {
      javascriptBytes: bytes(/\.js$/i),
      cssBytes: bytes(/\.css$/i),
      fontBytes: bytes(/\.(?:woff2?|ttf|otf)$/i),
      resourceCount: entries.length,
    };

    test.info().annotations.push({
      type: "performance",
      description: `${path}: ${JSON.stringify(resources)}`,
    });
    expect(thirdParty, "No trackers, external fonts or remote assets in the preview").toEqual([]);
    expect(failed, "No failed startup resource requests").toEqual([]);
    // Generous synthetic ceiling, not a claim about production LCP/INP/CLS at p75.
    expect(resources.javascriptBytes).toBeLessThan(180 * 1024);
    expect(resources.cssBytes).toBeLessThan(350 * 1024);
  });
}

test("critical latin fonts are preloaded and fetched only once", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const preloaded = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="font"]')].map((link) => ({
      path: new URL(link.href).pathname,
      type: link.type,
      crossOrigin: link.crossOrigin,
    })),
  );
  const paths = preloaded.map((link) => link.path);
  expect(paths.some((p) => /instrument-sans-latin-wght-normal\..+\.woff2$/.test(p))).toBe(true);
  expect(paths.some((p) => /fraunces-latin-opsz-normal\..+\.woff2$/.test(p))).toBe(true);
  for (const link of preloaded) {
    expect(link.type).toBe("font/woff2");
    // Fonts are fetched in anonymous CORS mode; a mismatch would download each file twice.
    expect(link.crossOrigin).toBe("anonymous");
  }
  const fetches = await page.evaluate(() =>
    (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).map((e) =>
      new URL(e.name).pathname,
    ),
  );
  for (const path of paths) expect(fetches.filter((p) => p === path)).toHaveLength(1);
});
