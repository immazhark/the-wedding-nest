import { expect, test } from "@playwright/test";

test("catering rail preserves layout and respects live reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  const link = page.locator(".menu-rail-link").last();
  const name = link.locator(".menu-rail-name");
  const arrow = link.locator(".menu-rail-arrow");
  const dimensions = () =>
    link.evaluate((element) => ({
      padding: getComputedStyle(element).paddingLeft,
      width: element.querySelector<HTMLElement>(".menu-rail-name")!.offsetWidth,
      height: (element as HTMLElement).offsetHeight,
    }));
  const initial = await dimensions();
  await link.focus();
  await expect(arrow).not.toHaveCSS("transform", "none");
  await expect(name).not.toHaveCSS("transform", "none");
  await expect.poll(dimensions).toEqual(initial);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(name).toHaveCSS("transform", "none");
  await expect(arrow).toHaveCSS("transform", "none");
  await expect.poll(dimensions).toEqual(initial);
  await expect
    .poll(() => link.evaluate((element) => getComputedStyle(element, "::after").transform))
    .toBe("none");
  await expect(link).toBeFocused();
});
