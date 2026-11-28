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

test("conditional service link waits for a compatible occasion without guessing one", async ({
  page,
}) => {
  await page.goto("/plan-your-event/?service=mehndi-artist");
  await expect(page.getByRole("checkbox", { name: "Mehndi" })).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await expect(page.getByRole("radio", { name: /Specific services/ })).not.toBeChecked();
  await page.getByRole("button", { name: "← Back" }).click();
  await page.getByRole("checkbox", { name: "Mehndi" }).check();
  await next(page);
  await expect(page.getByRole("radio", { name: /Specific services/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Mehndi artist" })).toBeChecked();
});

test("start again discards a pending service link before any occasion is chosen", async ({
  page,
}) => {
  await page.goto("/plan-your-event/?service=mehndi-artist");
  await page.getByRole("button", { name: "Start again" }).click();
  await expect(page).not.toHaveURL(/service=/);
  await page.getByRole("checkbox", { name: "Mehndi" }).check();
  await next(page);
  await expect(page.getByRole("radio", { name: /Specific services/ })).not.toBeChecked();
});

test("explicit full-planning choice overrides an earlier conditional service link", async ({
  page,
}) => {
  await page.goto("/plan-your-event/?service=mehndi-artist");
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await page.getByRole("button", { name: "← Back" }).click();
  await page.getByRole("checkbox", { name: "Mehndi" }).check();
  await next(page);
  await expect(page.getByRole("radio", { name: /End-to-end planning/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Mehndi artist" })).toBeHidden();
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
  await expect(summary).toContainText("Test Visitor");
  await expect(summary).toContainText("+91 98765 43210");
  await expect(page.getByText(/so nothing has been sent/)).toBeVisible();
  await expect(page.getByRole("button", { name: /send/i })).toHaveCount(0);
  expect(requests).toEqual([]);
});

test("preview reviews a plan without contact details", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  await next(page);
  await expect(heading(page)).toHaveText("How should we reach you?");
  await page.getByRole("button", { name: "Skip contact — preview only" }).click();
  await expect(heading(page)).toHaveText("Review your plan");
  await expect(page.locator("[data-summary]")).toContainText("Nikah");
  const contactRows = page.locator("[data-summary] dt").filter({ hasText: /^(Name|Contact)$/ });
  await expect(contactRows).toHaveCount(0);
  await expect(page.getByText(/nothing has been sent/)).toBeVisible();
  // While sending is off, the review offers a direct way to reach the team.
  await expect(page.locator('.notice a[href="tel:+919966973113"]')).toBeVisible();
  await expect(
    page.locator('.notice a[href="mailto:theweddingnest.events@gmail.com"]'),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Send enquiry" })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit occasion" }).click();
  await expect(heading(page)).toHaveText("What are you celebrating?");
  await page.getByRole("button", { name: "Return to review" }).click();
  await expect(heading(page)).toHaveText("Review your plan");
  expect(posts).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem("twn:enquiry-draft") ?? "")).not.toContain(
    "phone",
  );
});

test("preview copies planning choices without contact, venue or private notes", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  await page.getByLabel(/Venue or area/).fill("PRIVATE ADDRESS");
  await page.getByLabel(/Anything else we should know/).fill("PRIVATE FAMILY NOTES");
  await next(page);
  await page.getByLabel("Your name").fill("PRIVATE PERSON");
  await page.getByLabel("Phone or WhatsApp number").fill("9876543210");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await next(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          sessionStorage.setItem("copied-plan-test", text);
        },
      },
    });
  });
  await page.getByRole("button", { name: "Copy planning choices" }).click();
  await expect(page.getByRole("status")).toContainText("Planning choices copied");
  const copied = await page.evaluate(() => sessionStorage.getItem("copied-plan-test"));
  expect(copied).toContain("Occasion: Nikah");
  for (const forbidden of ["PRIVATE", "9876543210", "Location:", "Notes:", "Contact:"]) {
    expect(copied).not.toContain(forbidden);
  }
});

test("editing a copied plan clears the previous clipboard-success message", async ({ page }) => {
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  await next(page);
  await page.getByRole("button", { name: "Skip contact — preview only" }).click();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => {} },
    });
  });

  await page.getByRole("button", { name: "Copy planning choices" }).click();
  await expect(page.locator("[data-copy-status]")).toContainText("Planning choices copied");
  await page.getByRole("button", { name: "Edit occasion" }).click();
  await page.getByRole("checkbox", { name: "Walima" }).check();
  await page.getByRole("button", { name: "Return to review" }).click();
  await expect(page.locator("[data-summary]")).toContainText("Walima");
  await expect(page.locator("[data-copy-status]")).toBeEmpty();
});

test("clipboard denial exposes a selectable privacy-safe manual copy fallback", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  await page.getByLabel(/Venue or area/).fill("PRIVATE VENUE");
  await page.getByLabel(/Anything else we should know/).fill("PRIVATE NOTES");
  await next(page);
  await page.getByRole("button", { name: "Skip contact — preview only" }).click();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    });
  });
  const fallback = page.getByRole("textbox", { name: "Planning choices to copy manually" });
  await expect(fallback).toBeHidden();
  await page.getByRole("button", { name: "Copy planning choices" }).click();
  await expect(page.locator("[data-copy-status]")).toContainText("Select and copy");
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveAttribute("readonly", "");
  const text = await fallback.inputValue();
  expect(text).toContain("Occasion: Nikah");
  expect(text).not.toContain("PRIVATE");
  expect(text).not.toContain("Location:");
  expect(text).not.toContain("Contact:");
  await page.getByRole("button", { name: "Edit occasion" }).click();
  await page.getByRole("checkbox", { name: "Walima" }).check();
  await page.getByRole("button", { name: "Return to review" }).click();
  await expect(fallback).toBeHidden();
  await expect(page.locator("[data-copy-fallback-text]")).toHaveValue("");
});

for (const outcome of ["resolve", "reject"] as const) {
  test(`late clipboard ${outcome} cannot overwrite feedback for an edited plan`, async ({
    page,
  }) => {
    await page.getByRole("checkbox", { name: "Nikah" }).check();
    await next(page);
    await page.getByRole("radio", { name: /End-to-end planning/ }).check();
    await next(page);
    await next(page);
    await next(page);
    await page.getByRole("button", { name: "Skip contact — preview only" }).click();
    await page.evaluate(() => {
      const gate = window as Window & { settleCopy?: (reject: boolean) => void };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: () =>
            new Promise<void>((resolve, reject) => {
              gate.settleCopy = (denied: boolean) =>
                denied ? reject(new Error("denied")) : resolve();
            }),
        },
      });
    });
    await page.getByRole("button", { name: "Copy planning choices" }).click();
    await page.waitForFunction(
      () => typeof (window as Window & { settleCopy?: unknown }).settleCopy === "function",
    );
    await page.getByRole("button", { name: "Edit occasion" }).click();
    await page.getByRole("checkbox", { name: "Walima" }).check();
    await page.getByRole("button", { name: "Return to review" }).click();
    await expect(page.locator("[data-summary]")).toContainText("Walima");
    await page.evaluate((deny) => {
      const gate = window as Window & { settleCopy?: (reject: boolean) => void };
      gate.settleCopy?.(deny);
    }, outcome === "reject");
    await expect(page.locator("[data-copy-status]")).toBeEmpty();
    await expect(page.locator("[data-copy-fallback]")).toBeHidden();
    await expect(page.locator("[data-copy-fallback-text]")).toHaveValue("");
  });
}

test("skipping preview contact clears previously typed private answers", async ({ page }) => {
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  await next(page);
  await page.getByLabel("Your name").fill("Private Visitor");
  await page.getByLabel("Phone or WhatsApp number").fill("9876543210");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.getByRole("checkbox", { name: /future offers/ }).check();

  await page.getByRole("button", { name: "Skip contact — preview only" }).click();
  await expect(heading(page)).toHaveText("Review your plan");
  await expect(page.locator("[data-summary]")).not.toContainText("Private Visitor");
  await expect(page.locator("[data-summary]")).not.toContainText("9876543210");
  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.getByLabel("Your name")).toHaveValue("");
  await expect(page.getByLabel("Phone or WhatsApp number")).toHaveValue("");
  await expect(page.getByRole("checkbox", { name: /I agree/ })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: /future offers/ })).not.toBeChecked();
});

test("homepage occasion links open the planner with only the chosen occasion selected", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Nikah" }).click();
  await expect(page).toHaveURL(/\/plan-your-event\/\?occasion=nikah$/);
  await expect(page.getByRole("checkbox", { name: "Nikah" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Walima" })).not.toBeChecked();
  await expect(page.getByLabel("Your name")).toHaveValue("");
  expect(await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"))).not.toContain(
    "phone",
  );
});

test("homepage service links begin a specific-service enquiry without skipping occasion", async ({
  page,
}) => {
  // Catering has an approved detail page, so the homepage links there; its planner link is the entry.
  await page.goto("/services/hyderabadi-wedding-catering/");
  await page.getByRole("link", { name: "Begin planning" }).click();
  await expect(page).toHaveURL(/\/plan-your-event\/\?service=catering$/);
  await expect(page.getByRole("checkbox", { name: "Nikah" })).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Walima" }).check();
  await next(page);
  await expect(page.getByRole("radio", { name: /Specific services/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Catering & menus" })).toBeChecked();
});

test("unknown planner intent never selects an occasion or a service", async ({ page }) => {
  await page.goto("/plan-your-event/?occasion=%3Cscript%3E&service=unknown");
  await expect(page.getByRole("checkbox", { name: "Nikah" })).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"))).toBeNull();
});

test("mobile progressbar announces step changes to assistive technology", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/plan-your-event/");
  const progress = page.getByRole("progressbar", { name: "Planner completion" });
  await expect(progress).toHaveAttribute("aria-valuemin", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "5");
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await expect(progress).toHaveAttribute("aria-valuetext", "Step 1 of 5");

  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await expect(progress).toHaveAttribute("aria-valuenow", "2");
  await expect(progress).toHaveAttribute("aria-valuetext", "Step 2 of 5");
  await page.getByRole("button", { name: "← Back" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await expect(progress).toHaveAttribute("aria-valuetext", "Step 1 of 5");
});

test("mobile planner shows the first question in the initial viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/plan-your-event/");
  const disclosure = page.locator("#planner-disclosure");
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText("don’t enter real contact details");
  const question = page.getByRole("heading", { name: "What are you celebrating?" });
  const bounds = await question.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeLessThan(844);
});

test("discloses before the first step that sending is off and real details shouldn't be entered", async ({
  page,
}) => {
  const disclosure = page.locator("#planner-disclosure");
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText("enquiries can’t be sent yet");
  await expect(disclosure).toContainText("don’t enter real contact details");
  await expect(disclosure).toContainText(
    /message\s+@twn\.events\s+on Instagram, or call\s+\+91 99669 73113\./,
  );
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

test("focuses the missing occasion or service choice after a blocked step", async ({ page }) => {
  const nikah = page.getByRole("checkbox", { name: "Nikah" });
  await next(page);
  await expect(nikah).toBeFocused();
  await expect(nikah).toHaveAttribute("aria-invalid", "true");
  await expect(nikah).toHaveAttribute("aria-describedby", "planner-error-msg");

  await nikah.check();
  await expect(nikah).not.toHaveAttribute("aria-invalid");
  await next(page);
  const full = page.getByRole("radio", { name: /End-to-end planning/ });
  await next(page);
  await expect(full).toBeFocused();
  await expect(full).toHaveAttribute("aria-describedby", "planner-error-msg");

  await page.getByRole("radio", { name: /Specific services/ }).check();
  await next(page);
  const catering = page.getByRole("checkbox", { name: "Catering & menus" });
  await expect(catering).toBeFocused();
  await expect(catering).toHaveAttribute("aria-invalid", "true");
  await expect(catering).toHaveAttribute("aria-describedby", "planner-error-msg");

  await catering.check();
  await expect(catering).not.toHaveAttribute("aria-invalid");
  await expect(catering).not.toHaveAttribute("aria-describedby");
});

test("switching to full planning clears specific services from the browser draft", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /Specific services/ }).check();
  await page.getByRole("checkbox", { name: "Catering & menus" }).check();
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await expect(page.locator('input[name="services"][value="catering"]')).not.toBeChecked();
  const saved = await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"));
  expect(JSON.parse(saved!).data.services).toEqual([]);
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

test("correcting guest count clears validation feedback before the field loses focus", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  const guests = page.getByLabel(/Approximate guests/);
  await guests.fill("abc");
  await next(page);
  await expect(page.getByRole("alert")).toContainText("whole number");
  await expect(guests).toHaveAttribute("aria-invalid", "true");
  await expect(guests).toBeFocused();

  await guests.fill("250");
  await expect(guests).toBeFocused();
  await expect(page.getByRole("alert")).toBeEmpty();
  await expect(guests).not.toHaveAttribute("aria-invalid");
  await expect(guests).not.toHaveAttribute("aria-describedby");
});

test("guest feedback appears beside the field after blur without stealing focus", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  const guests = page.getByLabel(/Approximate guests/);
  const venue = page.getByLabel(/Venue or area/);
  await guests.fill("3.5");
  await expect(page.getByRole("alert")).toBeEmpty();
  await venue.focus();
  await expect(venue).toBeFocused();
  await expect(guests).toHaveAttribute("aria-describedby", "planner-error-msg");
  await expect(page.locator(".field").filter({ has: guests })).toContainText("whole number");
  await guests.fill("150");
  await expect(page.getByRole("alert")).toBeEmpty();
  await next(page);
  await expect(heading(page)).toHaveText("How should we reach you?");
  await expect(page.getByRole("alert")).toBeEmpty();
});

test("blocked guest correction and focused input fit in the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  const guests = page.getByLabel(/Approximate guests/);
  await guests.fill("3.5");
  await next(page);
  await expect(guests).toBeFocused();
  await expect(page.getByRole("alert")).toContainText("whole number");
  const field = page.locator(".field").filter({ has: guests });
  const box = await field.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(640);
});

test("correcting phone feedback preserves help and ignores an untouched missing name", async ({
  page,
}) => {
  await completeToContact(page);
  const phone = page.getByLabel("Phone or WhatsApp number");
  await phone.evaluate((input) => {
    const hint = document.createElement("p");
    hint.id = "phone-help-fixture";
    hint.textContent = "Include the country code when needed.";
    input.parentElement!.append(hint);
    input.setAttribute("aria-describedby", hint.id);
  });
  await phone.fill("12");
  await page.getByRole("button", { name: "Skip contact — preview only" }).focus();
  await expect(phone).toHaveAttribute("aria-describedby", "phone-help-fixture planner-error-msg");
  await phone.fill("9876543210");
  await expect(phone).toBeFocused();
  await expect(phone).not.toHaveAttribute("aria-invalid");
  await expect(phone).toHaveAttribute("aria-describedby", "phone-help-fixture");
  await expect(page.getByRole("alert")).toBeEmpty();
  await next(page);
  await expect(page.getByLabel("Your name")).toBeFocused();
  await expect(page.getByRole("alert")).toHaveText("Please enter your name.");
});

test("Enter focuses and describes the first contact error without blur replacing it", async ({
  page,
}) => {
  await completeToContact(page);
  const name = page.getByLabel("Your name");
  const phone = page.getByLabel("Phone or WhatsApp number");
  await phone.fill("12");
  await phone.press("Enter");
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAttribute("aria-describedby", "planner-error-msg");
  await expect(phone).not.toHaveAttribute("aria-invalid");
  await expect(page.getByRole("alert")).toHaveText("Please enter your name.");
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
  const consent = page.getByRole("checkbox", { name: /I agree/ });
  await expect(consent).toBeFocused();
  await expect(consent).toHaveAttribute("aria-invalid", "true");
  await expect(consent).toHaveAttribute("aria-describedby", "planner-error-msg");
  await consent.check();
  await expect(consent).not.toHaveAttribute("aria-invalid");
  await expect(page.getByRole("alert")).toBeEmpty();
  await expect(page.getByRole("checkbox", { name: /future offers/ })).not.toBeChecked();
});

test("both contact consent labels expose at least 44px touch targets", async ({ page }) => {
  await completeToContact(page);
  const labels = page.locator('[data-stage="contact"] label.check');
  await expect(labels).toHaveCount(2);
  for (const label of await labels.all()) {
    const box = await label.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
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

test("start again clears URL preselection so reload stays reset", async ({ page }) => {
  await page.goto("/plan-your-event/?occasion=nikah&service=catering&utm_source=instagram");
  await expect(page.getByRole("checkbox", { name: "Nikah" })).toBeChecked();
  await page.getByRole("button", { name: "Start again" }).click();
  await expect(page.getByRole("checkbox", { name: "Nikah" })).not.toBeChecked();
  await expect(page).toHaveURL(/[?]utm_source=instagram$/);
  expect(await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"))).toBeNull();

  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Nikah" })).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Walima" }).check();
  await page.getByRole("button", { name: /^Continue/ }).click();
  await expect(page.getByRole("radio", { name: /Specific services/ })).not.toBeChecked();
});

test("purges expired or corrupt local drafts on page load", async ({ page }) => {
  const draft = await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"));
  expect(draft).toBeNull();
  const expired = JSON.stringify({
    v: 1,
    savedAt: Date.now() - 8 * 24 * 60 * 60 * 1_000,
    data: { occasions: ["nikah"] },
  });
  for (const raw of [expired, "{bad json"]) {
    await page.evaluate((value) => localStorage.setItem("twn:enquiry-draft", value), raw);
    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"))).toBeNull();
  }
});

test("scrubs unapproved fields from valid legacy drafts without resetting expiry", async ({
  page,
}) => {
  const savedAt = Date.now() - 60_000;
  await page.evaluate(
    (timestamp) =>
      localStorage.setItem(
        "twn:enquiry-draft",
        JSON.stringify({
          v: 1,
          savedAt: timestamp,
          data: {
            occasions: ["nikah"],
            scope: null,
            services: [],
            styles: [],
            date: {
              kind: "date",
              value: "2027-02-14",
              phone: "PRIVATE NESTED PHONE",
              location: "PRIVATE NESTED HOME ADDRESS",
            },
            guestCount: "",
            budget: null,
            location: "PRIVATE HOME ADDRESS",
          },
          phone: "PRIVATE PHONE",
        }),
      ),
    savedAt,
  );
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Nikah" })).toBeChecked();
  const cleaned = await page.evaluate(() => localStorage.getItem("twn:enquiry-draft") ?? "");
  expect(cleaned).toContain('"nikah"');
  expect(cleaned).not.toContain("PRIVATE HOME ADDRESS");
  expect(cleaned).not.toContain("PRIVATE PHONE");
  expect(cleaned).not.toContain("PRIVATE NESTED");
  expect(JSON.parse(cleaned).data.date).toEqual({ kind: "date", value: "2027-02-14" });
  expect(JSON.parse(cleaned).savedAt).toBe(savedAt);
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
