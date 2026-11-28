import { expect, test } from "@playwright/test";

test("open mobile menu tracks the header when a narrow viewport reflows", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 700, height: 650 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  const header = page.locator("[data-site-header]");
  const menu = page.locator("[data-menu]");
  const gap = () =>
    page.evaluate(() => {
      const header = document.querySelector("[data-site-header]")!;
      const menu = document.querySelector("[data-menu]")!;
      return Math.abs(menu.getBoundingClientRect().top - header.getBoundingClientRect().bottom);
    });
  await expect.poll(gap).toBeLessThanOrEqual(2);
  const before = (await header.boundingBox())!;
  await page.setViewportSize({ width: 320, height: 650 });
  await expect(menu).toHaveAttribute("data-open", "");
  await expect.poll(gap).toBeLessThanOrEqual(2);
  const after = (await header.boundingBox())!;
  expect(Math.abs(after.y + after.height - before.y - before.height)).toBeGreaterThan(1);
  await page.setViewportSize({ width: 700, height: 650 });
  await expect.poll(gap).toBeLessThanOrEqual(2);
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("data-open", "");
  await expect(page.locator("main")).not.toHaveAttribute("inert");
});
