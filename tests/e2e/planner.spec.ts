import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const next = (page: Page) => page.getByRole("button", { name: /^(Continue|Review)/ }).click();
const heading = (page: Page) => page.locator("[data-stage]:not([hidden]) .stage-title");

async function completeToContact(page: Page) {
  await page.getByRole("checkbox", { name: "Mehndi" }).check();
  await next(page);
  await page.getByRole("radio", { name: /Specific services/ }).check();
  await page.getByRole("checkbox", { name: "Mehndi artist" }).check();
  await next(page);
  await page.getByRole("checkbox", { name: /Hyderabadi heritage/ }).check();
  await next(page);
  await page.getByRole("radio", { name: "I have a date" }).check();
  await page.getByLabel("Event date").fill("2027-02-14");
  await page.getByLabel(/Approximate guests/).fill("250");
  await page.getByLabel(/Venue or area/).fill("Sample Venue Road");
  await next(page);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/plan-your-event/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("walks through all five stages to a review, without sending anything", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") requests.push(`${r.method()} ${r.url()}`);
  });

  await expect(page.locator("[data-step-count]")).toHaveText("Step 1 of 5");
  await completeToContact(page);
  await expect(heading(page)).toHaveText("How should we reach you?");
  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Phone or WhatsApp number").fill("+91 98765 43210");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await next(page);

  await expect(heading(page)).toHaveText("Review your plan");
  await expect(heading(page)).toBeFocused();
  const summary = page.locator("[data-summary]");
  await expect(summary).toContainText("Mehndi");
  await expect(summary).toContainText("Specific services: Mehndi artist");
  await expect(summary).toContainText("14 February 2027");
  await expect(summary).toContainText("Not shared");
  await expect(page.getByText(/so nothing has been sent/)).toBeVisible();
  await expect(page.getByRole("button", { name: /send/i })).toHaveCount(0);
  expect(requests).toEqual([]);
});

test("discloses before the first step that sending is off and real details shouldn't be entered", async ({
  page,
}) => {
  const disclosure = page.locator("#planner-disclosure");
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText("enquiries can’t be sent yet");
  await expect(disclosure).toContainText("don’t enter real contact details");
  const disclosureBox = await disclosure.boundingBox();
  const firstQuestion = await heading(page).boundingBox();
  expect(disclosureBox!.y).toBeLessThan(firstQuestion!.y);
});

test("blocks progress with an announced message until required answers are given", async ({
  page,
}) => {
  await next(page);
  await expect(page.getByRole("alert")).toHaveText("Please choose at least one occasion.");
  await expect(heading(page)).toHaveText("What are you celebrating?");

  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /Specific services/ }).check();
  await next(page);
  await expect(page.getByRole("alert")).toHaveText("Please choose at least one service.");
});

test("tailors services to the chosen occasions", async ({ page }) => {
  await page.getByRole("checkbox", { name: "Corporate event" }).check();
  await next(page);
  await page.getByRole("radio", { name: /Specific services/ }).check();
  await expect(page.getByRole("checkbox", { name: "Sound, lighting & AV" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Mehndi artist" })).toBeHidden();
  await expect(page.getByRole("checkbox", { name: "Ceremony coordination" })).toBeHidden();

  await page.getByRole("button", { name: "← Back" }).click();
  await page.getByRole("checkbox", { name: "Mehndi" }).check();
  await next(page);
  await expect(page.getByRole("checkbox", { name: "Mehndi artist" })).toBeVisible();
});

test("requires explicit consent and a valid phone number", async ({ page }) => {
  await completeToContact(page);
  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Phone or WhatsApp number").fill("12");
  await next(page);
  await expect(page.getByRole("alert")).toContainText("phone or WhatsApp number");
  await expect(page.getByLabel("Phone or WhatsApp number")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Phone or WhatsApp number").fill("9876543210");
  await next(page);
  await expect(page.getByRole("alert")).toContainText("agree");
  await expect(page.getByRole("checkbox", { name: /future offers/ })).not.toBeChecked();
});

test("keeps choices after reload but never stores contact details", async ({ page }) => {
  await completeToContact(page);
  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Phone or WhatsApp number").fill("9876543210");
  const draft = await page.evaluate(() => localStorage.getItem("twn:enquiry-draft") ?? "");
  expect(draft).toContain("mehndi");
  expect(draft).not.toContain("Test Visitor");
  expect(draft).not.toContain("9876543210");
  expect(draft).not.toContain("location");
  expect(draft).not.toContain("Sample Venue");

  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Mehndi" })).toBeChecked();
  await expect(page.getByLabel("Your name")).toHaveValue("");

  await page.getByRole("button", { name: "Start again" }).click();
  await expect(page.getByRole("checkbox", { name: "Mehndi" })).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"))).toBeNull();
});

test("can be completed with the keyboard alone", async ({ page }) => {
  await page.getByRole("checkbox", { name: "Walima" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("checkbox", { name: "Walima" })).toBeChecked();
  await page.getByRole("button", { name: /^Continue/ }).focus();
  await page.keyboard.press("Enter");
  await expect(heading(page)).toHaveText("How can we help?");
  await expect(heading(page)).toBeFocused();
});

test("every stage has no serious accessibility violations", async ({ page }) => {
  const audit = async () => {
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    return r.violations
      .filter((v) => ["serious", "critical"].includes(v.impact ?? ""))
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  };
  expect(await audit()).toEqual([]);
  await completeToContact(page);
  expect(await audit()).toEqual([]);
  await page.getByLabel("Your name").fill("A");
  await page.getByLabel("Phone or WhatsApp number").fill("9876543210");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await next(page);
  expect(await audit()).toEqual([]);
});

test("stage transitions know their direction", async ({ page }) => {
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await expect(page.locator("[data-planner-form]")).toHaveAttribute("data-direction", "forward");
  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.locator("[data-planner-form]")).toHaveAttribute("data-direction", "back");
});

test("choices made before the planner script finishes loading are kept", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(/\/_astro\/.*\.js$/, async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/plan-your-event/?occasion=mehndi", { waitUntil: "domcontentloaded" });
  await page.getByRole("checkbox", { name: "Walima" }).check();
  release();
  await expect(page.locator("[data-planner-form]")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("checkbox", { name: "Walima" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Mehndi", exact: true })).toBeChecked();
});
