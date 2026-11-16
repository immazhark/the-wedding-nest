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
