import { expect, test } from "@playwright/test";

// Short laptop windows (about 1366x650 once browser chrome is subtracted) and landscape phones must
// never clip the opening headline under the sticky header.
const SIZES = [
  { width: 1366, height: 650 },
  { width: 1280, height: 600 },
  { width: 1024, height: 600 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
];

test.describe("opening hero fits short viewports", () => {
  test.skip(({ isMobile }) => isMobile, "Viewport matrix is set explicitly on desktop Chromium");
  for (const size of SIZES) {
    test(`headline and copy are not clipped at ${size.width}x${size.height}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(size);
      await page.goto("/");
      const box = async (selector: string) => (await page.locator(selector).first().boundingBox())!;
      const stage = await box(".grand-stage");
      const copy = await box(".grand-copy");
      const h1 = await box(".grand-copy h1");
      const header = await box("header");
      expect(copy.y, "copy starts inside the stage").toBeGreaterThanOrEqual(stage.y - 0.5);
      expect(h1.y, "headline clears the header").toBeGreaterThanOrEqual(
        header.y + header.height - 0.5,
      );
      expect(copy.y + copy.height, "copy ends inside the stage").toBeLessThanOrEqual(
        stage.y + stage.height + 0.5,
      );
    });
  }
});

test("desktop hero releases reserved space on live reduced-motion changes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const hero = page.locator(".grand");
  await expect(hero).toHaveCSS("padding-bottom", "420px");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(hero).toHaveCSS("padding-bottom", "0px");
  await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(hero).toHaveCSS("padding-bottom", "420px");
});
