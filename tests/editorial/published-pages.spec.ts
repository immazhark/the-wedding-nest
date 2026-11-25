import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// This file runs only in the isolated synthetic-fixture build. The files and
// their source records are never committed or deployed to TWN public Workers.
const SERVICE = "/services/guest-hospitality-hyderabad/";
const STORY = "/stories/ci-test-only-walima/";

test("approved service template renders a useful, accessible and linked page", async ({ page }) => {
  const response = await page.goto(SERVICE);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "CI-only service page — never publish",
  );
  // Gallery, details and closing invitation: three sections, each with one level-2 heading.
  await expect(page.locator("main article").getByRole("heading", { level: 2 })).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Begin planning" })).toHaveAttribute(
    "href",
    "/plan-your-event/?service=hospitality",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://theweddingnest.in" + SERVICE,
  );
});

test("service page (gallery included) loads with no console errors or CSP violations", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(SERVICE, { waitUntil: "networkidle" });
  expect(errors).toEqual([]);
});

test("service gallery opens a keyboard-operable lightbox with described photographs", async ({
  page,
}) => {
  await page.goto(SERVICE);
  const tiles = page.locator("[data-gallery-open]");
  const total = await tiles.count();
  expect(total).toBeGreaterThanOrEqual(5);
  await tiles.first().click();
  const dialog = page.locator("dialog[data-lightbox]");
  await expect(dialog).toBeVisible();
  expect(((await dialog.locator("img").getAttribute("alt")) ?? "").length).toBeGreaterThan(12);
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator("[data-lightbox-caption]")).toContainText(`2 of ${total}`);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(tiles.first()).toBeFocused();
});

test.describe("service gallery without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("photographs remain explorable through genuine image links", async ({ page, request }) => {
    await page.goto(SERVICE);
    const tile = page.locator("a[data-gallery-open]").first();
    await expect(tile).toHaveAccessibleName(/View larger: .+/);
    const href = await tile.getAttribute("href");
    expect(href).toMatch(/^\/_astro\/.+\.(?:avif|webp|jpe?g|png)$/);
    const destination = new URL(href!, page.url()).href;
    await tile.click();
    await expect(page).toHaveURL(destination);
    const response = await request.get(destination);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
  });
});

test("approved story template renders only its released fixture photographs", async ({ page }) => {
  const response = await page.goto(STORY);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "CI-only synthetic Walima story — never publish",
  );
  const images = page.locator("article picture img");
  await expect(images).toHaveCount(2);
  await expect(images.nth(0)).toHaveAttribute("alt", /synthetic/i);
  await expect(images.nth(1)).toHaveAttribute("alt", /synthetic/i);
  await expect(page.getByRole("link", { name: "Start planning" })).toHaveAttribute(
    "href",
    "/plan-your-event/?occasion=walima",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("approved content is discoverable; unrelated unapproved routes remain absent", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Guest hospitality" })).toHaveAttribute(
    "href",
    SERVICE,
  );
  await expect(page.getByRole("link", { name: "Read an event story" })).toHaveAttribute(
    "href",
    STORY,
  );
  expect((await request.get("/services/bridal-makeup-hyderabad/")).status()).toBe(404);
  expect((await request.get("/stories/unapproved-event/")).status()).toBe(404);
});

for (const path of [SERVICE, STORY]) {
  test(`${path} respects mobile viewport and has no serious accessibility errors`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    expect(serious.map((v) => v.id)).toEqual([]);
  });
}

// Tablet and in-between widths: no horizontal overflow and every released photograph stays inside the viewport.
for (const path of [SERVICE, STORY]) {
  for (const width of [320, 768, 820, 1024, 1280]) {
    test(`${path} fits a ${width}px-wide viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0);
      const overflowing = await page.evaluate(
        () =>
          [...document.querySelectorAll("article img")].filter(
            (img) => img.getBoundingClientRect().right > document.documentElement.clientWidth + 1,
          ).length,
      );
      expect(overflowing).toBe(0);
    });
  }
}

// All category compositions must stay usable before their copy is approved for publication.
const SERVICE_LOOKS = [
  { slug: "nikah-decoration-hyderabad", layout: "editorial", hero: "full" },
  { slug: "mehndi-artist-hyderabad", layout: "duo", hero: "split" },
  { slug: "trousseau-packing-hyderabad", layout: "mosaic", hero: "split" },
  { slug: "guest-hospitality-hyderabad", layout: "rows", hero: "split" },
] as const;

for (const { slug, layout, hero } of SERVICE_LOOKS) {
  test(`${slug} preserves its composition, accessibility and lightbox`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(`/services/${slug}/`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator(`.svc-hero-${hero}`)).toBeVisible();
    await expect(page.locator(`[data-gallery].gallery-${layout}`)).toBeVisible();
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual(
      [],
    );
    await page.screenshot({ path: testInfo.outputPath("service-composition.png"), fullPage: true });
    const tiles = page.locator("[data-gallery-open]");
    await tiles.last().click();
    const dialog = page.locator("[data-lightbox]");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-lightbox-caption]")).toHaveAttribute("aria-live", "polite");
    await page.keyboard.press("ArrowRight");
    await expect(dialog.locator("[data-lightbox-caption]")).toContainText(
      `1 of ${await tiles.count()}`,
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(tiles.last()).toBeFocused();
    expect(errors).toEqual([]);
  });

  for (const width of [320, 390, 768, 1024, 1440]) {
    test(`${slug} clears the header and contains photographs at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 600 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/services/${slug}/`);
      await page.evaluate(() => document.fonts.ready);
      const bounds = await page.evaluate(() => {
        const header = document.querySelector("body > header")!;
        const heading = document.querySelector("h1")!;
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          headerBottom: header.getBoundingClientRect().bottom,
          headingTop: heading.getBoundingClientRect().top,
          clippedPhotos: [...document.querySelectorAll("article img")].filter((image) => {
            const rect = image.getBoundingClientRect();
            return (
              rect.width <= 0 || rect.height <= 0 || rect.left < -1 || rect.right > innerWidth + 1
            );
          }).length,
        };
      });
      expect(bounds.overflow).toBeLessThanOrEqual(0);
      expect(bounds.headingTop).toBeGreaterThanOrEqual(bounds.headerBottom);
      expect(bounds.clippedPhotos).toBe(0);
    });
  }
}
