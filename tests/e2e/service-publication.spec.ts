import { expect, test } from "@playwright/test";

test("unapproved service landing pages cannot be reached", async ({ request }) => {
  for (const slug of [
    "bridal-makeup-hyderabad",
    "wedding-cars-hyderabad",
    "mehndi-artist-hyderabad",
  ]) {
    const response = await request.get(`/services/${slug}/`);
    expect(response.status(), slug).toBe(404);
  }
});

test("the owner-approved catering page is published", async ({ request }) => {
  const response = await request.get("/services/hyderabadi-wedding-catering/");
  expect(response.status()).toBe(200);
});

test("catering menu jump bar links every menu card", async ({ page }) => {
  await page.goto("/services/hyderabadi-wedding-catering/");
  const links = page.getByRole("navigation", { name: "Choose a menu" }).getByRole("link");
  await expect(links).toHaveCount(4);
  for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
    await expect(page.locator(href ?? "#none"), String(href)).toHaveCount(1);
  }
  await links.nth(2).click();
  await expect(page).toHaveURL(/#menu-\d+$/);
});
