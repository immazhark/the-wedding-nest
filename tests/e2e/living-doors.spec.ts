import { expect, test } from "@playwright/test";

// Service doors carry a short silent film that belongs to that service. It must never cost
// bandwidth until a visitor asks for it (hover or keyboard focus), and never play with reduced motion.
test.describe("living service doors", () => {
  test.skip(({ isMobile }) => isMobile, "Door films are a fine-pointer desktop enhancement");

  test("no door film downloads until a door is hovered, then only that one", async ({ page }) => {
    const films: string[] = [];
    page.on("request", (request) => {
      if (/\/media\/door-.*\.mp4/.test(request.url())) films.push(request.url());
    });
    await page.goto("/");
    await page.locator(".service-doors").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    expect(films, "nothing before interaction").toHaveLength(0);

    const door = page.locator(".door:has([data-door-film])").first();
    await door.hover();
    await expect(door).toHaveAttribute("data-film-on", "");
    expect(films.length).toBe(1);
    await page.mouse.move(2, 2);
    await expect(door).not.toHaveAttribute("data-film-on", "");
  });

  test("keyboard focus wakes a door film too", async ({ page }) => {
    await page.goto("/");
    const door = page.locator(".door:has([data-door-film])").first();
    await door.locator("a.door-link").focus();
    await expect(door).toHaveAttribute("data-film-on", "");
  });

  test("reduced motion never starts a door film", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const door = page.locator(".door:has([data-door-film])").first();
    await door.hover();
    await page.waitForTimeout(500);
    await expect(door).not.toHaveAttribute("data-film-on", "");
    expect(await door.locator("video").getAttribute("src")).toBeNull();
  });

  test("door films are decorative: hidden from assistive technology and the tab order", async ({
    page,
  }) => {
    await page.goto("/");
    const films = page.locator("[data-door-film]");
    expect(await films.count()).toBeGreaterThanOrEqual(3);
    for (const film of await films.all()) {
      await expect(film).toHaveAttribute("aria-hidden", "true");
      await expect(film).toHaveAttribute("tabindex", "-1");
    }
  });
});
