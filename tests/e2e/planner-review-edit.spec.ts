import { expect, test, type Page } from "@playwright/test";

const next = (page: Page) => page.getByRole("button", { name: /^(Continue|Review)$/ }).click();
const stageHeading = (page: Page) => page.locator("[data-stage]:not([hidden]) .stage-title");

async function reachReview(page: Page, specific = false) {
  await page.getByRole("checkbox", { name: "Mehndi" }).check();
  await next(page);
  if (specific) {
    await page.getByRole("radio", { name: /Specific services/ }).check();
    await page.getByRole("checkbox", { name: "Mehndi artist" }).check();
  } else {
    await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  }
  await next(page);
  await next(page);
  await next(page);
  await page.getByLabel("Your name").fill("Sample Visitor");
  await page.getByLabel("Phone or WhatsApp number").fill("9876543210");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await next(page);
  await expect(stageHeading(page)).toHaveText("Review your plan");
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/plan-your-event/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("review answers can be edited directly and returned without losing other choices", async ({
  page,
}) => {
  await reachReview(page);
  await page.getByRole("button", { name: "Edit date" }).click();
  await expect(stageHeading(page)).toHaveText("When, where and how many?");
  await expect(stageHeading(page)).toBeFocused();
  await page.getByRole("radio", { name: "I have a date" }).check();
  await page.getByLabel("Event date").fill("2027-04-12");
  await page.getByRole("button", { name: "Return to review" }).click();
  await expect(stageHeading(page)).toHaveText("Review your plan");
  await expect(stageHeading(page)).toBeFocused();
  await expect(page.locator("[data-summary]")).toContainText("12 April 2027");
  await expect(page.locator("[data-summary]")).toContainText("Sample Visitor");
  await expect(page.getByRole("button", { name: "Return to review" })).toBeHidden();
});

test("review shortcuts cannot skip a required service after an occasion changes", async ({
  page,
}) => {
  await reachReview(page, true);
  await page.getByRole("button", { name: "Edit occasion" }).click();
  await page.getByRole("checkbox", { name: "Mehndi" }).uncheck();
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await page.getByRole("button", { name: "Return to review" }).click();
  await expect(stageHeading(page)).toHaveText("How can we help?");
  await expect(page.getByRole("alert")).toHaveText("Please choose at least one service.");
});

test("clears stale error-message associations when leaving and returning to a step", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  await next(page);

  await next(page);
  const name = page.getByLabel("Your name");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAttribute("aria-describedby", "planner-error-msg");

  await page.getByRole("button", { name: "← Back" }).click();
  await expect(name).not.toHaveAttribute("aria-invalid");
  await expect(name).not.toHaveAttribute("aria-describedby");

  await next(page);
  await expect(name).not.toHaveAttribute("aria-describedby");
});
