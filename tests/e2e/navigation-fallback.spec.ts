import { expect, test } from "@playwright/test";

test("mobile navigation remains usable when page modules fail", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 500 });
  let removedModules = 0;
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "document") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const html = await response.text();
    // Astro can inline small modules at build time. Disable both forms of module execution,
    // without disabling the separate inline layout marker or the rest of the document.
    const body = html.replace(/<script\b[^>]*\btype=["']module["'][^>]*>[\s\S]*?<\/script>/gi, () => {
      removedModules++;
      return "";
    });
    await route.fulfill({ response, body });
  });
  await page.goto("/");
  expect(removedModules).toBeGreaterThan(0);

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
