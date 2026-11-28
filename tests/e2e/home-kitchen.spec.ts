import { expect, test } from "@playwright/test";

test("home kitchen keeps its poster when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const frame = page.locator("[data-kitchen]");
  await frame.scrollIntoViewIfNeeded();
  await expect(frame.locator("[data-loop-toggle]")).toBeHidden();
  await expect(frame).not.toHaveAttribute("data-playing", "");
  await expect(frame.locator("video")).toHaveJSProperty("paused", true);
});

test("home kitchen has a pause control and preserves the visitor's pause", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Muted autoplay acceptance is asserted on desktop Chromium");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const frame = page.locator("[data-kitchen]");
  await frame.scrollIntoViewIfNeeded();
  const toggle = frame.getByRole("button", { name: "Pause the kitchen film" });
  await expect(toggle).toBeVisible();
  await expect(frame).toHaveAttribute("data-playing", "");
  await toggle.click();
  await expect(frame.locator("video")).toHaveJSProperty("paused", true);
  await expect(frame).not.toHaveAttribute("data-playing", "");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await frame.scrollIntoViewIfNeeded();
  await expect(frame.locator("video")).toHaveJSProperty("paused", true);
  await expect(frame.getByRole("button", { name: "Play the kitchen film" })).toBeVisible();
});
