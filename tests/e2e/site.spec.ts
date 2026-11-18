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

test("occasion-specific service enquiries are discoverable without publishing unapproved pages", async ({
  page,
}) => {
  await page.goto("/");
  const specialists = page.getByRole("list", { name: "Occasion-specific services" });
  for (const label of ["Ceremony coordination", "Mehndi artist", "Sound, lighting & AV"]) {
    await expect(specialists.getByRole("link", { name: label })).toBeVisible();
  }
  await specialists.getByRole("link", { name: "Mehndi artist" }).click();
  await expect(page).toHaveURL(/\/plan-your-event\/\?service=mehndi-artist$/);
  await expect(page.getByRole("checkbox", { name: "Mehndi" })).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Mehndi" }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("radio", { name: /Specific services/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Mehndi artist" })).toBeChecked();
});

test("other celebrations are linked directly to their exact planner occasions", async ({
  page,
}) => {
  await page.goto("/");
  const occasions = page.getByRole("list", { name: "Other celebrations" });
  for (const name of [
    "Birthday",
    "Anniversary",
    "Corporate event",
    "Private gathering",
    "Something else",
  ]) {
    await expect(occasions.getByRole("link", { name })).toBeVisible();
  }
  await occasions.getByRole("link", { name: "Corporate event" }).click();
  await expect(page).toHaveURL(/\/plan-your-event\/\?occasion=corporate$/);
  await expect(page.getByRole("checkbox", { name: "Corporate event" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Nikah" })).not.toBeChecked();
});

test("structured data contains only the verified Organization identity", async ({ page }) => {
  await page.goto("/");
  const schema = page.locator('script[type="application/ld+json"]');
  await expect(schema).toHaveCount(1);
  const organization = JSON.parse((await schema.textContent()) ?? "");
  expect(organization["@type"]).toBe("Organization");
  expect(organization.name).toBe("The Wedding Nest");
  expect(organization.url).toBe("https://theweddingnest.in");
  expect(organization.sameAs).toEqual([
    "https://www.instagram.com/twn.events/",
    "https://www.facebook.com/twn.events",
  ]);
  expect(organization.telephone).toBe("+919966973113");
  expect(organization.email).toBe("theweddingnest.events@gmail.com");
  expect(organization).not.toHaveProperty("aggregateRating");
  expect(organization.address.postalCode).toBe("500028");
  expect(organization.openingHoursSpecification.dayOfWeek).toHaveLength(7);
  expect(organization.founder.name).toBe("Mohammed Ather Khan");
});

test("footer offers the owner-supplied phone, email and social links", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.locator('a[href="tel:+919966973113"]')).toHaveText("+91 99669 73113");
  await expect(footer.locator('a[href="mailto:theweddingnest.events@gmail.com"]')).toBeVisible();
  await expect(footer.locator('a[href="https://www.facebook.com/twn.events"]')).toBeVisible();
  await expect(footer.locator('a[href="https://wa.me/919966973113"]')).toBeVisible();
  await expect(footer).toContainText("12-2-1/D/68, Zeba Bagh, Asif Nagar");
  await expect(footer).toContainText("Hyderabad, Telangana 500028");
  await expect(footer).toContainText("Open every day, 9:00 am to 12:00 midnight");
  await expect(footer.locator('a[href="tel:+918686773095"]')).toBeVisible();
  await expect(footer).toContainText("Mohammed Ather Khan");
  await expect(footer.locator('a[href="https://www.instagram.com/twn.events/"]')).toBeVisible();
});

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

test("planner provides a readable Instagram fallback without JavaScript", async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) throw new Error("Playwright base URL is required for this test");
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/plan-your-event/");
    const fallback = page.locator(".planner .planner-panel");
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText(
      /Instagram\s+or call\s+\+91 99669 73113\s+in the meantime\./,
    );
    await expect(fallback.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/twn.events/",
    );
    await expect(page.locator("[data-planner-form]")).toBeHidden();
  } finally {
    await context.close();
  }
});

test("mobile primary links remain visible and do not overlap the page without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    ...(baseURL ? { baseURL } : {}),
    javaScriptEnabled: false,
    viewport: { width: 360, height: 740 },
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const header = page.locator("[data-site-header]");
    const menu = page.getByRole("navigation", { name: "Primary" });
    await expect(menu.getByRole("link", { name: "Services" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Plan your event" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();

    const headerBounds = await header.boundingBox();
    const menuBounds = await menu.boundingBox();
    expect(headerBounds).not.toBeNull();
    expect(menuBounds).not.toBeNull();
    // A tall no-JS nav cannot spill over the hero below a fixed-height header.
    expect(menuBounds!.y + menuBounds!.height).toBeLessThanOrEqual(
      headerBounds!.y + headerBounds!.height + 2,
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    await menu.getByRole("link", { name: "Services" }).click();
    await expect(page).toHaveURL(/#services$/);
  } finally {
    await context.close();
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

  test("opens, focuses navigation, closes with Escape and restores focus", async ({ page }) => {
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

  test("keeps focus inside an open mobile menu", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Menu" });
    const homeLink = page.locator("[data-site-header] a[href='/']").first();
    const nav = page.getByRole("navigation", { name: "Primary" });
    const lastLink = nav.getByRole("link", { name: "Plan your event" });

    await toggle.click();
    await expect(page.locator("main")).toHaveAttribute("inert", "");
    await expect(page.locator("footer")).toHaveAttribute("inert", "");
    await lastLink.focus();
    await page.keyboard.press("Tab");
    await expect(homeLink).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(lastLink).toBeFocused();

    await page.getByRole("button", { name: "Close" }).click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    await expect(page.locator("footer")).not.toHaveAttribute("inert");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("mobile navigation works on the homepage and event planner", async ({ page }) => {
    for (const path of ["/", "/plan-your-event/"]) {
      await page.goto(path);
      const toggle = page.getByRole("button", { name: "Menu" });
      await expect(toggle).toBeVisible();
      await toggle.click();
      const nav = page.getByRole("navigation", { name: "Primary" });
      await expect(nav.getByRole("link", { name: "Services" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    }
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

  test("focus moves to the section after following a same-page menu link", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    const nav = page.getByRole("navigation", { name: "Primary" });
    const link = nav.getByRole("link", { name: "Occasions" });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#occasions$/);
    await expect(page.locator("#occasions")).toBeFocused();
    await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.locator("main")).not.toHaveAttribute("inert");
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

test("homepage and planner reflow without horizontal scrolling at 320 CSS pixels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/plan-your-event/"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
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

test("unapproved preview builds do not publish a sitemap", async ({ request }) => {
  expect((await request.get("/sitemap.xml")).status()).toBe(404);
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

test("photography is only reviewed local originals; remaining placeholders are honest", async ({
  page,
}) => {
  await page.goto("/");
  const frames = page.locator("[data-frame]");
  expect(await frames.count()).toBeGreaterThanOrEqual(4);
  // Every real photograph is a build-optimised local asset with descriptive alt text.
  const images = page.locator('main [data-frame="image"] img');
  expect(await images.count()).toBeGreaterThanOrEqual(4);
  for (const img of await images.all()) {
    expect(await img.getAttribute("src")).toMatch(/^\/_astro\//);
    expect((await img.getAttribute("alt")) ?? "").not.toHaveLength(0);
  }
  await expect(page.locator('main img[src^="http"]')).toHaveCount(0);
  for (const label of await page.locator('[data-frame="placeholder"]').allTextContents()) {
    expect(label).toContain("Photograph to come");
  }
});

test("unapproved photo placeholders do not run image parallax or scroll-reveal transforms", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-frame="placeholder"] .parallax-media')).toHaveCount(0);
  await expect(page.locator('[data-frame="placeholder"].scroll-frame')).toHaveCount(0);
});

test("official logo is used in the header and footer with accessible names", async ({ page }) => {
  await page.goto("/");
  const homeLink = page.locator("[data-site-header] a[href='/']").first();
  await expect(homeLink.locator("svg title")).toHaveText("The Wedding Nest");
  await expect(homeLink).toHaveAccessibleName(/The Wedding Nest/);
  // WebKit does not derive a link name from an inline SVG <title>, so name it explicitly.
  await expect(homeLink).toHaveAttribute("aria-label", "The Wedding Nest — home");
  await expect(page.locator("footer img[alt^='The Wedding Nest']")).toHaveCount(1);
  expect((await page.request.get("/favicon.svg")).status()).toBe(200);
  expect((await page.request.get("/apple-touch-icon.png")).status()).toBe(200);
});

test("preview private fields do not invite browser autofill", async ({ page }) => {
  await page.goto("/plan-your-event/");
  const form = page.locator("[data-planner-form]");
  await expect(form).toHaveAttribute("data-submit", "off");
  for (const name of ["name", "phone", "location"]) {
    await expect(form.locator(`input[name="${name}"]`)).toHaveAttribute("autocomplete", "off");
  }
  await expect(form.locator('textarea[name="notes"]')).toHaveAttribute("autocomplete", "off");
});

test("non-sending preview clearly discloses that enquiries are disabled", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Preview: the planner can’t send enquiries yet.")).toBeVisible();
});

test("films download nothing until play is pressed, then hand over to native controls", async ({
  page,
}) => {
  const filmRequests: string[] = [];
  page.on("request", (r) => {
    if (/film-(landscape|portrait)\.mp4/.test(r.url())) filmRequests.push(r.url());
  });
  await page.goto("/");
  const wide = page.locator(".film-wide");
  await wide.scrollIntoViewIfNeeded();
  const button = wide.getByRole("button", { name: /Play the short film/ });
  await expect(button).toBeVisible();
  await expect(wide.locator("video")).toHaveAttribute("preload", "none");
  await expect(wide.locator("video")).toHaveAccessibleDescription(/wedding film of details/);
  expect(filmRequests).toHaveLength(0);
  await button.click();
  await expect(button).toBeHidden();
  await expect(wide.locator("video")).toHaveJSProperty("controls", true);
  // Some engines do not surface media fetches as page requests, so also accept the media state.
  await expect
    .poll(async () => {
      const loading = await wide
        .locator("video")
        .evaluate(
          (v: HTMLVideoElement) => v.currentSrc.includes("film-landscape") && v.networkState > 0,
        );
      return filmRequests.length > 0 || loading;
    })
    .toBe(true);
  expect(filmRequests.every((u) => u.includes("film-landscape"))).toBe(true);
});

test("hero film starts only on large screens, after load, and never competes with first paint", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("hero-loop.mp4")) requests.push(r.url());
  });
  await page.goto("/", { waitUntil: "load" });
  const film = page.locator("[data-grand-film]");
  await expect(film).toHaveAttribute("aria-hidden", "true");
  await expect(film).toHaveAttribute("preload", "none");
  const large = (page.viewportSize()?.width ?? 0) >= 1024;
  if (large) {
    // The loader assigns the source only after load; some engines hide media fetches from requests.
    await expect(film).toHaveAttribute("src", /hero-loop\.mp4/, { timeout: 8000 });
  } else {
    await page.waitForTimeout(2500);
    expect(requests).toHaveLength(0);
    await expect(film).not.toHaveAttribute("src", /.+/);
  }
});
