import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// This file runs only in the isolated synthetic-fixture build. The files and
// their source records are never committed or deployed to TWN public Workers.
const SERVICE = "/services/hyderabadi-wedding-catering/";
const STORY = "/stories/ci-test-only-walima/";

test("approved service template renders a useful, accessible and linked page", async ({ page }) => {
  const response = await page.goto(SERVICE);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "CI-only service page — never publish",
  );
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Explore in the planner" })).toHaveAttribute(
    "href",
    "/plan-your-event/?service=catering",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://theweddingnest.in" + SERVICE,
  );
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
    "/plan-your-event/",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("approved content is discoverable; unrelated unapproved routes remain absent", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Catering & menus" })).toHaveAttribute(
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
