import { expect, test } from "@playwright/test";

test("homepage does not link to unapproved services or fictional event stories", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('a[href^="/services/"]')).toHaveCount(0);
  await expect(page.locator('a[href^="/stories/"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Catering & menus" })).toHaveAttribute(
    "href",
    "/plan-your-event/?service=catering",
  );
});
