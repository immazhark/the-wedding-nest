import { expect, test } from "@playwright/test";

test("homepage links only to the approved catering page, never unapproved services or stories", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('a[href^="/services/"]')).toHaveCount(1);
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
