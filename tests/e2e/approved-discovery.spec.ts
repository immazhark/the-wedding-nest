import { expect, test } from "@playwright/test";

test("homepage links only to the approved catering page, never unapproved services or stories", async ({
  page,
}) => {
  await page.goto("/");
  // Every service link on the homepage (the list and the catering menu rail) is the approved page.
  const serviceLinks = await page
    .locator('a[href^="/services/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(serviceLinks.length).toBeGreaterThan(0);
  expect(new Set(serviceLinks)).toEqual(new Set(["/services/hyderabadi-wedding-catering/"]));
  await expect(page.locator('a[href^="/stories/"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Catering & menus" })).toHaveAttribute(
    "href",
    "/services/hyderabadi-wedding-catering/",
  );
  // Services without an approved page still start in the planner.
  await expect(page.getByRole("link", { name: "Guest hospitality" })).toHaveAttribute(
    "href",
    "/plan-your-event/?service=hospitality",
  );
});

test("catering menus are set as menu cards with every course and dish, and add-ons stay prose", async ({
  page,
}) => {
  await page.goto("/services/hyderabadi-wedding-catering/");
  const cards = page.locator(".menu");
  await expect(cards).toHaveCount(4);
  const first = cards.first();
  await expect(page.locator(".menu-head .menu-tagline").first()).toContainText(
    "Simple flavors, true Hyderabadi soul.",
  );
  await expect(first.locator(".menu-course dt").first()).toHaveText("Platter");
  await expect(
    first.locator(".menu-course").nth(1).locator("li", { hasText: "Dum Ka Chicken" }),
  ).toHaveCount(1);
  // The add-ons section is not a menu and keeps its paragraph, including the no-prices statement.
  await expect(page.locator(".svc-panel-body")).toContainText("We do not publish set prices");
});
