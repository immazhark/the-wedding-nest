import { expect, test } from "@playwright/test";

const CATERING = "/services/hyderabadi-wedding-catering/";

test.describe("catering page art direction", () => {
  test("the menu jump bar links every menu card, each paired with a described photograph", async ({
    page,
  }) => {
    await page.goto(CATERING);
    const links = page.getByRole("navigation", { name: "Choose a menu" }).getByRole("link");
    await expect(links).toHaveCount(4);
    for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
      const card = page.locator(href ?? "#none");
      await expect(card, String(href)).toHaveCount(1);
      const img = card.locator(".menu-card-photo img").first();
      await expect(img, `${href} photo`).toHaveCount(1);
      expect(((await img.getAttribute("alt")) ?? "").length, `${href} alt`).toBeGreaterThan(12);
    }
  });

  test("approved catering answers are visible as static text without FAQ claims", async ({
    page,
  }) => {
    await page.goto(CATERING);
    const answers = page.getByRole("region", { name: "Before you choose" });
    await expect(answers.getByText("Can I customise the menu?")).toBeVisible();
    await expect(answers.getByText("Are set prices published?")).toBeVisible();
    await expect(answers).toContainText("Each menu is a starting point");
    await expect(answers).toContainText("We do not publish set prices");
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(structuredData.join(" ")).not.toContain("FAQPage");
  });

  test("the page ends in one invitation: no second footer 'Begin planning' band", async ({
    page,
  }) => {
    for (const path of [CATERING, "/plan-your-event/"]) {
      await page.goto(path);
      await expect(page.locator(".footer-invite"), path).toHaveCount(0);
    }
    await page.goto("/");
    await expect(page.locator(".footer-invite")).toHaveCount(1);
  });

  test("footer arches stay inside the invitation they decorate", async ({ page, isMobile }) => {
    test.skip(isMobile, "Arches are a tablet and desktop ornament");
    for (const size of [
      { width: 1440, height: 900 },
      { width: 820, height: 1100 },
    ]) {
      await page.setViewportSize(size);
      await page.goto("/");
      const invite = (await page.locator(".footer-invite").boundingBox())!;
      const arches = (await page.locator(".footer-arches").first().boundingBox())!;
      expect(arches.y, `top @${size.width}`).toBeGreaterThanOrEqual(invite.y - 0.5);
      expect(arches.y + arches.height, `bottom @${size.width}`).toBeLessThanOrEqual(
        invite.y + invite.height + 0.5,
      );
    }
  });

  test("the kitchen film is a poster under reduced motion and offers no controls to hide", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(CATERING);
    const frame = page.locator("[data-loop]");
    await frame.scrollIntoViewIfNeeded();
    await expect(frame.locator("[data-loop-toggle]")).toBeHidden();
    await expect(frame).not.toHaveAttribute("data-playing", "");
    await expect(frame.locator("video")).toHaveJSProperty("paused", true);
  });

  test("the kitchen film plays when visible and can be paused", async ({ page, isMobile }) => {
    test.skip(isMobile, "Autoplay of muted video is asserted on desktop Chromium");
    await page.goto(CATERING);
    const frame = page.locator("[data-loop]");
    await frame.scrollIntoViewIfNeeded();
    const toggle = frame.locator("[data-loop-toggle]");
    await expect(toggle).toBeVisible();
    await expect(frame).toHaveAttribute("data-playing", "");
    await toggle.click();
    await expect(frame).not.toHaveAttribute("data-playing", "");
    await expect(frame.locator("video")).toHaveJSProperty("paused", true);
  });

  test("declares Service structured data tied to the organization, with no invented offers", async ({
    page,
  }) => {
    await page.goto(CATERING);
    const docs = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
      (text) => JSON.parse(text),
    );
    const service = docs.find((doc) => doc["@type"] === "Service");
    expect(service, "Service JSON-LD present").toBeTruthy();
    expect(service.provider["@id"]).toMatch(/#organization$/);
    expect(service.url).toMatch(/\/services\/hyderabadi-wedding-catering\/$/);
    expect(service).not.toHaveProperty("offers");
    expect(service).not.toHaveProperty("aggregateRating");
  });

  test("no horizontal overflow from 320 to 1920 px", async ({ page, isMobile }) => {
    test.skip(isMobile, "Width matrix is set explicitly on desktop Chromium");
    for (const width of [320, 390, 768, 1024, 1366, 1920]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(CATERING);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow @${width}`).toBeLessThanOrEqual(0);
    }
  });
});
