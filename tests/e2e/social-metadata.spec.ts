import { expect, test } from "@playwright/test";

for (const path of ["/", "/plan-your-event/", "/services/hyderabadi-wedding-catering/"]) {
  test(`social sharing image is complete and available on ${path}`, async ({ request }) => {
    const page = await request.get(path);
    expect(page.status()).toBe(200);
    // Sharing crawlers consume initial HTML; this test does not depend on client-side JS.
    const html = await page.text();
    const metadata = Object.fromEntries(
      Array.from(
        html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)"/g),
        ([, key, value]) => [key, value],
      ),
    );
    const image = "https://theweddingnest.in/social/twn-brand.png";
    expect(metadata["og:image"]).toBe(image);
    expect(metadata["og:image:width"]).toBe("1200");
    expect(metadata["og:image:height"]).toBe("630");
    expect(metadata["og:image:alt"]).toMatch(/Wedding Nest/);
    expect(metadata["twitter:card"]).toBe("summary_large_image");
    expect(metadata["twitter:image"]).toBe(image);
    // Fetch from this test environment, never from the future public domain.
    const response = await request.get(new URL(image).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    const body = await response.body();
    expect(body.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(body.readUInt32BE(16)).toBe(1200);
    expect(body.readUInt32BE(20)).toBe(630);
  });
}
