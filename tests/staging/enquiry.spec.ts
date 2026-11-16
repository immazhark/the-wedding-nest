import { expect, test } from "@playwright/test";

// Real deployed Worker, D1 and Cloudflare's official dummy Turnstile keys. No mocks.
// Only fictional data; the 202-555-01xx range is reserved for fictional use.
test("fictional enquiry completes the deployed browser-to-D1 path", async ({ page }) => {
  await page.goto("/plan-your-event/");
  await expect(page.getByRole("note")).toContainText("Use fictional details only");
  const next = () => page.getByRole("button", { name: /^(Continue|Review)$/i }).click();
  await page.getByRole("checkbox", { name: "Nikah", exact: true }).check();
  await next();
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next();
  await next();
  await next();
  await page.getByLabel("Your name").fill("Synthetic Browser QA");
  await page.getByLabel("Phone or WhatsApp number").fill("+12025550101");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await next();
  await expect(page.getByRole("heading", { name: "Review your plan" })).toBeVisible();
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
    timeout: 45_000,
  });
  const accepted = page.waitForResponse(
    (response) => response.url().endsWith("/api/enquiry") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  const response = await accepted;
  // Record the browser-generated Origin without mocking or changing the request.
  // Staging only permits its own exact origin; synthetic proxy browsers may differ.
  const requestHeaders = await response.request().allHeaders();
  expect(requestHeaders["origin"]).toBe(new URL(page.url()).origin);
  expect(response.status()).toBe(201);
  const body = (await response.json()) as { id: string };
  expect(body.id).toMatch(/^[a-f0-9-]{36}$/);
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toBeVisible();
  await expect(page.locator("[data-reference]")).toHaveText(body.id.slice(0, 8).toUpperCase());
});
