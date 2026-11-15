import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/plan-your-event/"];

for (const path of PAGES) {
  test.describe(`page ${path}`, () => {
    test("has one h1, metadata, canonical and preview noindex", async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/The Wedding Nest/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{50,}/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`^https://theweddingnest\\.in${path.replace(/\//g, "\\/")}$`),
      );
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, nofollow",
      );
      await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
    });

    test("has no serious or critical axe violations (WCAG 2.2 AA)", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const serious = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      );
      expect(
        serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
      ).toEqual([]);
    });

    test("loads without console errors or CSP violations", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(path, { waitUntil: "networkidle" });
      expect(errors).toEqual([]);
    });

    test("has no horizontal overflow", async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test("all internal links resolve", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page.$$eval("a[href^='/']", (as) => [
    ...new Set(as.map((a) => a.getAttribute("href")!)),
  ]);
  for (const href of hrefs) {
    const [pathname, hash] = href.split("#");
    const res = await request.get(pathname || "/");
    expect(res.status(), href).toBe(200);
    if (hash) {
      await page.goto(href);
      await expect(page.locator(`#${hash}`), href).toHaveCount(1);
    }
  }
});

test("skip link moves focus to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test.describe("mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("opens with the menu button, traps nothing, closes with Escape and restores focus", async ({
    page,
  }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Menu" });
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(nav.getByRole("link", { name: "Services" })).toBeHidden();

    await toggle.click();
    await expect(page.locator("[data-menu-toggle]")).toHaveAttribute("aria-expanded", "true");
    await expect(nav.getByRole("link", { name: "Services" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Services" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.locator("[data-menu-toggle]")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("[data-menu-toggle]")).toBeFocused();
  });

  test("open menu panel covers the viewport below the header and shows every link", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toHaveAttribute("data-open", "");
    const box = await nav.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.height).toBeGreaterThan(viewport.height * 0.6);
    for (const name of ["Services", "Occasions", "Approach", "Plan your event"]) {
      await expect(nav.getByRole("link", { name })).toBeInViewport();
    }
  });

  test("closes after choosing a link", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Occasions" })
      .click();
    await expect(page).toHaveURL(/#occasions$/);
    await expect(page.locator("[data-menu-toggle]")).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("desktop navigation", () => {
  test.skip(({ isMobile }) => !!isMobile, "desktop only");

  test("shows primary links inline without a menu button", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-menu-toggle]")).toBeHidden();
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const name of ["Services", "Occasions", "Approach", "Plan your event"]) {
      await expect(nav.getByRole("link", { name })).toBeVisible();
    }
  });
});

test("unknown routes return the 404 page", async ({ page }) => {
  const res = await page.goto("/does-not-exist/");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("wandered off");
});
