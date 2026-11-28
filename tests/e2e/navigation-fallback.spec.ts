import { expect, test } from "@playwright/test";

test("mobile navigation remains usable when external JavaScript fails", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 500 });
  await page.route(/\.js(?:\?.*)?$/, (route) => route.abort());
  await page.goto("/");

  // The inline layout marker still executes, but the header module never initializes.
  await expect(page.locator("html")).toHaveClass(/\bjs\b/);
  const header = page.locator("[data-site-header]");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(header).not.toHaveAttribute("data-menu-ready", "");
  await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
  await expect(nav.getByRole("link", { name: "Services" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Plan your event" })).toBeVisible();
  await expect(header).toHaveCSS("position", "static");

  await nav.getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/#services$/);
});
