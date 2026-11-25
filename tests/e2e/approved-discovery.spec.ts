import { expect, test } from "@playwright/test";
import { publishedServiceSlugs, publishedStorySlugs } from "../support/publication-records";

test("homepage links only to reviewed service and story records", async ({ page }) => {
  await page.goto("/");
  // The expected set comes from reviewed source records, not a fixed launch snapshot.
  const serviceLinks = await page
    .locator('a[href^="/services/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(serviceLinks.length).toBeGreaterThan(0);
  const approved = publishedServiceSlugs();
  expect(new Set(serviceLinks)).toEqual(new Set(approved.map((slug) => `/services/${slug}/`)));
  const stories = publishedStorySlugs();
  const storyLinks = page.locator('a[href^="/stories/"]');
  if (stories.length > 0) {
    await expect(storyLinks).toHaveCount(1);
    await expect(storyLinks).toHaveAttribute("href", `/stories/${stories[0]}/`);
  } else {
    await expect(storyLinks).toHaveCount(0);
  }
  await expect(page.getByRole("link", { name: "Catering & menus" })).toHaveAttribute(
    "href",
    "/services/hyderabadi-wedding-catering/",
  );
  // Services without an approved page still start in the planner.
  await expect(page.getByRole("link", { name: "Guest hospitality" })).toHaveAttribute(
    "href",
    approved.includes("guest-hospitality-hyderabad")
      ? "/services/guest-hospitality-hyderabad/"
      : "/plan-your-event/?service=hospitality",
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
