/**
 * Runs only against the submission-enabled build (npm run build:submit; projects submit-*).
 * Turnstile and the API are mocked: these tests cover the browser contract, not the Worker
 * (which has its own unit + SQLite tests).
 */
import { expect, test, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const FAKE_TURNSTILE = `window.turnstile = {
  render(el, opts) { window.__ts = opts; setTimeout(() => opts.callback("test-token"), 30); return "w1"; },
  reset() { setTimeout(() => window.__ts.callback("test-token-2"), 30); }
};`;

type Call = { key: string | null; body: Record<string, unknown> };

async function setup(page: Page, responder: (n: number) => { status: number; body: unknown }) {
  const calls: Call[] = [];
  await page.route("https://challenges.cloudflare.com/**", (r) =>
    r.fulfill({ contentType: "text/javascript", body: FAKE_TURNSTILE }),
  );
  await page.route("**/api/enquiry", async (route: Route) => {
    const req = route.request();
    calls.push({ key: req.headers()["idempotency-key"] ?? null, body: req.postDataJSON() });
    const { status, body } = responder(calls.length);
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/plan-your-event/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return calls;
}

const next = (page: Page) => page.getByRole("button", { name: /^(Continue|Review)/ }).click();

async function toReview(page: Page) {
  await page.getByRole("checkbox", { name: "Walima" }).check();
  await next(page);
  await page.getByRole("radio", { name: /End-to-end planning/ }).check();
  await next(page);
  await next(page);
  await next(page);
  await page.getByLabel("Your name").fill("Sample Person");
  await page.getByLabel("Phone or WhatsApp number").fill("9876543210");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await next(page);
  await expect(page.getByRole("heading", { name: "Review your plan" })).toBeVisible();
}

test("with sending on, the 'can't send yet' preview disclosure is gone", async ({ page }) => {
  await setup(page, () => ({ status: 201, body: { id: "x" } }));
  await expect(page.locator("#planner-disclosure")).toHaveCount(0);
  await expect(page.locator("[data-contact-preview-note]")).toHaveCount(0);
});

test("sends once the check passes and confirms only after the server accepts", async ({ page }) => {
  const calls = await setup(page, () => ({
    status: 201,
    body: { id: "3f2b8c1e-9d4a-4f6b-8e2a-1c5d7e9f0a1b" },
  }));
  await toReview(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toBeFocused();
  await expect(page.locator("[data-reference]")).toHaveText("3F2B8C1E");
  expect(calls).toHaveLength(1);
  expect(calls[0]!.key).toMatch(/^[0-9a-f-]{36}$/);
  expect(calls[0]!.body["turnstileToken"]).toBe("test-token");
  expect((calls[0]!.body["enquiry"] as Record<string, unknown>)["name"]).toBe("Sample Person");
  expect(await page.evaluate(() => localStorage.getItem("twn:enquiry-draft"))).toBeNull();
  await expect(page.getByRole("button", { name: "← Back" })).toBeHidden();
});

test("an outage keeps the answers, and the retry reuses the same idempotency key", async ({
  page,
}) => {
  const calls = await setup(page, (n) =>
    n === 1
      ? { status: 503, body: { error: "storage_unavailable" } }
      : { status: 201, body: { id: "abcdef12" } },
  );
  await toReview(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("couldn’t send");
  await expect(page.locator("[data-summary]")).toContainText("Sample Person");
  await page.waitForTimeout(100); // fresh check token after reset
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toBeVisible();
  expect(calls).toHaveLength(2);
  expect(calls[1]!.key).toBe(calls[0]!.key);
});

test("server validation errors take the visitor to the right step with a clear message", async ({
  page,
}) => {
  await setup(page, () => ({
    status: 422,
    body: { error: "invalid_enquiry", errors: { phone: "invalid" } },
  }));
  await toReview(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: "How should we reach you?" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("phone or WhatsApp number");
});

test("nothing is sent before the human check completes", async ({ page }) => {
  const calls: unknown[] = [];
  await page.route("https://challenges.cloudflare.com/**", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: "window.turnstile={render(){return 'w1'},reset(){}};", // never calls back
    }),
  );
  await page.route("**/api/enquiry", (r) => {
    calls.push(1);
    return r.fulfill({ status: 201, body: "{}" });
  });
  await page.goto("/plan-your-event/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await toReview(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("quick check");
  expect(calls).toHaveLength(0);
});

test("review and confirmation steps have no serious accessibility violations", async ({ page }) => {
  await setup(page, () => ({ status: 201, body: { id: "abcdef1234" } }));
  await toReview(page);
  const audit = async () =>
    (
      await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()
    ).violations
      .filter((v) => ["serious", "critical"].includes(v.impact ?? ""))
      .map((v) => v.id);
  expect(await audit()).toEqual([]);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toBeVisible();
  expect(await audit()).toEqual([]);
});
