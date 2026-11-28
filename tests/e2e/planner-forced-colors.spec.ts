import { expect, test } from "@playwright/test";

test("planner selections remain distinguishable in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/plan-your-event/");
  const checkbox = page.getByRole("checkbox", { name: "Mehndi" });
  await expect(checkbox).toHaveCSS("opacity", "1");
  await expect(checkbox).toHaveCSS("appearance", "auto");
  await expect(checkbox.locator("..").locator(".choice-mark")).toBeHidden();
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  await page.getByRole("button", { name: "Continue" }).click();
  const radio = page.getByRole("radio", { name: /End-to-end planning/ });
  const alternative = page.getByRole("radio", { name: /Specific services/ });
  await expect(radio).toHaveCSS("opacity", "1");
  await expect(radio).toHaveCSS("appearance", "auto");
  await expect(radio.locator("..").locator(".choice-mark")).toBeHidden();
  await radio.focus();
  await page.keyboard.press("Space");
  await expect(radio).toBeChecked();
  await alternative.focus();
  await page.keyboard.press("Space");
  await expect(alternative).toBeChecked();
  await expect(radio).not.toBeChecked();

  await page.emulateMedia({ forcedColors: "none" });
  await expect(alternative).toHaveCSS("opacity", "0");
  await expect(alternative.locator("..").locator(".choice-mark")).toBeVisible();
  await expect(alternative).toBeChecked();
});
