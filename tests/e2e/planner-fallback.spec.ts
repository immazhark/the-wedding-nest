import { expect, test } from "@playwright/test";

test("planner contact fallback stays usable when modules fail", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  let removedModules = 0;
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "document") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const html = await response.text();
    const body = html.replace(
      /<script\b[^>]*\btype=["']module["'][^>]*>[\s\S]*?<\/script>/gi,
      () => {
        removedModules++;
        return "";
      },
    );
    await route.fulfill({ response, body });
  });
  await page.goto("/plan-your-event/");
  expect(removedModules).toBeGreaterThan(0);
  await expect(page.locator("html")).toHaveClass(/\bjs\b/);
  const fallback = page.locator("[data-planner-fallback]");
  await expect(fallback).toBeVisible();
  await expect(fallback.getByRole("link", { name: "Instagram" })).toHaveAttribute(
    "href",
    "https://www.instagram.com/twn.events/",
  );
  await expect(fallback.getByRole("link", { name: "+91 99669 73113" })).toHaveAttribute(
    "href",
    "tel:+919966973113",
  );
  await expect(page.locator("[data-planner-form]")).toBeHidden();
  await expect(page.locator("[data-planner-interactive]")).toHaveAttribute("inert", "");
});

test("planner reveals its form only after initialization", async ({ page }) => {
  await page.goto("/plan-your-event/");
  await expect(page.locator("[data-planner-form]")).toBeVisible();
  await expect(page.locator("[data-planner-interactive]")).not.toHaveAttribute("inert", "");
  await expect(page.locator("[data-planner-fallback]")).toBeHidden();
});
