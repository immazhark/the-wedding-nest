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

  test("sticky header stays pinned after scrolling; menu opens directly beneath it", async ({
    page,
  }) => {
    await page.goto("/");
    await page.mouse.wheel(0, 1800);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    const header = page.locator("[data-site-header]");
    const hb = (await header.boundingBox())!;
    expect(Math.abs(hb.y)).toBeLessThanOrEqual(1);

    await page.getByRole("button", { name: "Menu" }).click();
    // Wait for the slide-in transition to settle before measuring.
    await expect
      .poll(async () => {
        const nb = (await page.getByRole("navigation", { name: "Primary" }).boundingBox())!;
        return Math.abs(nb.y - (hb.y + hb.height));
      })
      .toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
  });

  test("anchor targets are not hidden behind the sticky header", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Occasions" })
      .click();
    await expect(page).toHaveURL(/#occasions$/);
    const header = (await page.locator("[data-site-header]").boundingBox())!;
    await expect
      .poll(async () => (await page.locator("#occasions-title").boundingBox())!.y)
      .toBeGreaterThanOrEqual(header.y + header.height);
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

test("robots.txt and X-Robots-Tag are in preview (noindex) mode", async ({ request, baseURL }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/\s*$/m);
  if (baseURL?.startsWith("http://localhost")) {
    // astro preview doesn't apply _headers; check the generated file instead.
    const { readFile } = await import("node:fs/promises");
    expect(await readFile("dist/_headers", "utf8")).toContain("X-Robots-Tag: noindex, nofollow");
  } else {
    const res = await request.get("/");
    expect(res.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  }
});

test("unknown routes return the 404 page", async ({ page }) => {
  const res = await page.goto("/does-not-exist/");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("wandered off");
});

test("sticky header background is fully opaque so content never shows through", async ({
  page,
}) => {
  await page.goto("/");
  const alpha = await page.evaluate(() => {
    const bg = getComputedStyle(document.querySelector("[data-site-header]")!).backgroundColor;
    const m = bg.match(/rgba?\(([^)]+)\)/)!;
    const parts = m[1]!.split(",").map((x) => x.trim());
    return parts.length === 4 ? Number(parts[3]) : 1;
  });
  expect(alpha).toBe(1);
});

test("enquiry API is switched off in the production configuration", async ({
  request,
  baseURL,
}) => {
  test.skip(!!baseURL?.startsWith("http://localhost"), "API only exists on the Workers runtime");
  const res = await request.post("/api/enquiry", {
    data: {},
    headers: { "content-type": "application/json" },
  });
  expect(res.status()).toBe(503);
  expect(await res.json()).toEqual({ error: "enquiries_disabled" });
  expect((await request.get("/api/anything")).status()).toBe(404);
});

test("with reduced motion the opening is fully composed and nothing animates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const animated = await page.evaluate(
    () =>
      [
        ...document.querySelectorAll<HTMLElement>(
          ".line-mask > span, .fade-in, .frame-reveal > div",
        ),
      ]
        .map((el) => getComputedStyle(el).animationName)
        .filter((n) => n !== "none").length,
  );
  expect(animated).toBe(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Nikah to Walima,\s*and every day\s*between\./,
  );
});

test("photo placeholders are labelled honestly and never use stock imagery", async ({ page }) => {
  await page.goto("/");
  const frames = page.locator("[data-frame]");
  expect(await frames.count()).toBeGreaterThanOrEqual(4);
  await expect(page.locator('[data-frame="image"]')).toHaveCount(0);
  await expect(page.locator("main img")).toHaveCount(0);
  for (const label of await page.locator('[data-frame="placeholder"]').allTextContents()) {
    expect(label).toContain("Photograph to come");
  }
});
