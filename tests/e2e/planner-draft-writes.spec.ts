import { expect, test } from "@playwright/test";

test("private form fields never rewrite drafts while planning selections still autosave", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/plan-your-event/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const next = () => page.getByRole("button", { name: /^Continue/ }).click();
  await page.getByRole("checkbox", { name: "Nikah" }).check();
  await next();
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next();
  await next();
  await page.getByLabel(/Approximate guests/).fill("200");
  await next();

  // A stable marker makes any unwanted write observable without relying on timers.
  const stored = await page.evaluate(() => {
    const key = "twn:enquiry-draft";
    const draft = JSON.parse(localStorage.getItem(key)!);
    draft.savedAt = 1_700_000_000_000;
    localStorage.setItem(key, JSON.stringify(draft));
    return localStorage.getItem(key)!;
  });

  await page.getByLabel("Your name").fill("Fictional Person");
  await page.getByLabel("Phone or WhatsApp number").fill("9876543210");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await expect(page.getByRole("checkbox", { name: /I agree/ })).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"))).toBe(stored);

  await page.getByRole("button", { name: "← Back" }).click();
  await page.getByLabel(/Anything else we should know/).fill("A private fictional note");
  expect(await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"))).toBe(stored);

  await page.getByLabel(/Approximate guests/).fill("250");
  const updated = await page.evaluate(() => JSON.parse(localStorage.getItem("twn:enquiry-draft")!));
  expect(updated.data.guestCount).toBe("250");
  expect(JSON.stringify(updated)).not.toContain("Fictional Person");
  expect(JSON.stringify(updated)).not.toContain("9876543210");
  expect(JSON.stringify(updated)).not.toContain("private fictional note");
});
