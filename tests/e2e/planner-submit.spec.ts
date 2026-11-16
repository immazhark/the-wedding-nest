/**
 * Runs only against the submission-enabled build (npm run build:submit; projects submit-*).
 * Turnstile and the API are mocked: these tests cover the browser contract, not the Worker
 * (which has its own unit + SQLite tests).
 */
import { expect, test, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORED_ID = "f11e8989-1a22-4e2f-bc91-609acc25ef0e";

const FAKE_TURNSTILE = `window.turnstile = {
  render(el, opts) {
    window.__ts = opts;
    document.documentElement.dataset.testCheckReady = "false";
    setTimeout(() => {
      opts.callback("test-token");
      document.documentElement.dataset.testCheckReady = "true";
    }, 30);
    return "w1";
  },
  reset() {
    document.documentElement.dataset.testCheckReady = "false";
    setTimeout(() => {
      window.__ts.callback("test-token-2");
      document.documentElement.dataset.testCheckReady = "true";
    }, 30);
  }
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

/** Wait for the mocked verification callback, not an arbitrary wall-clock delay. */
async function waitForFakeCheck(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-test-check-ready", "true");
}

test("navigation and reset stay locked until a pending send finishes", async ({ page }) => {
  await setup(page, () => ({ status: 201, body: { id: STORED_ID } }));
  let finish: (() => void) | undefined;
  await page.route("**/api/enquiry", async (route) => {
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "storage_unavailable" }),
    });
  });
  await toReview(page);
  await waitForFakeCheck(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.locator("[data-back]")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Edit occasion" })).toBeDisabled();
  await expect(page.locator("[data-reset]")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sending…" })).toBeDisabled();
  await expect.poll(() => Boolean(finish)).toBe(true);
  finish!();
  await expect(page.getByRole("status")).toContainText("couldn’t send");
  await expect(page.locator("[data-back]")).toBeEnabled();
  await expect(page.locator("[data-reset]")).toBeEnabled();
  await expect(page.locator("[data-summary]")).toContainText("Sample Person");
});

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

test("a stalled verification script times out and can be retried from review", async ({ page }) => {
  const calls = await setup(page, () => ({ status: 201, body: { id: STORED_ID } }));
  await page.clock.install();
  // Hold the first script request open to model a transport that never completes.
  // Keep the Route so we can release it before the retry: an unresolved Playwright
  // interception otherwise blocks the subsequent request in Chromium.
  let stalledRoute: Route | undefined;
  const stall = (route: Route) => {
    stalledRoute = route;
  };
  await page.route("https://challenges.cloudflare.com/**", stall);
  await toReview(page);
  await expect.poll(() => Boolean(stalledRoute)).toBe(true);
  await page.clock.fastForward(10_001);
  await expect(page.getByRole("status")).toContainText("Go back and return to review");
  expect(calls).toHaveLength(0);
  await expect(page.locator('script[src*="challenges.cloudflare.com"]')).toHaveCount(0);
  await page.unroute("https://challenges.cloudflare.com/**", stall);
  // Release the old interception only after the timeout and cleanup are observed.
  // Aborting it models an eventual network error, without allowing a stale API
  // script to race with the new request.
  await stalledRoute!.abort("failed");
  await page.getByRole("button", { name: "← Back" }).click();
  await next(page);
  await expect.poll(() => page.evaluate(() => Boolean(window.turnstile))).toBe(true);
  await page.clock.fastForward(31);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toBeVisible();
  expect(calls).toHaveLength(1);
});

test("a script finishing after leaving review does not render a hidden widget", async ({
  page,
}) => {
  await setup(page, () => ({ status: 201, body: { id: STORED_ID } }));
  let script: Route | undefined;
  await page.route("https://challenges.cloudflare.com/**", (route) => {
    script = route;
  });
  await toReview(page);
  await expect.poll(() => Boolean(script)).toBe(true);
  await page.getByRole("button", { name: "← Back" }).click();
  await script!.fulfill({
    contentType: "text/javascript",
    body: FAKE_TURNSTILE.replace(
      "render(el, opts) {",
      "render(el, opts) { window.__renders = (window.__renders || 0) + 1;",
    ).replace(
      'opts.callback("test-token")',
      '(opts.callback("test-token"), window.__verified = true)',
    ),
  });
  await expect.poll(() => page.evaluate(() => Boolean(window.turnstile))).toBe(true);
  const renderCount = () =>
    page.evaluate(() => (window as Window & { __renders?: number }).__renders ?? 0);
  expect(await renderCount()).toBe(0);
  await next(page);
  await expect.poll(renderCount).toBe(1);
  await expect
    .poll(() =>
      page.evaluate(() => Boolean((window as Window & { __verified?: boolean }).__verified)),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toBeVisible();
});

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
  // A delayed Turnstile callback must not make this success-path test race the check.
  await expect(page.locator("html")).toHaveAttribute("data-test-check-ready", "true");
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
      : { status: 201, body: { id: STORED_ID } },
  );
  await toReview(page);
  await waitForFakeCheck(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("couldn’t send");
  await expect(page.locator("[data-summary]")).toContainText("Sample Person");
  await waitForFakeCheck(page); // a fresh token arrives after reset
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toBeVisible();
  expect(calls).toHaveLength(2);
  expect(calls[1]!.key).toBe(calls[0]!.key);
});

test("a conflicting send keeps answers and uses a new key only after another explicit send", async ({
  page,
}) => {
  const calls = await setup(page, (n) =>
    n === 1
      ? { status: 409, body: { error: "idempotency_conflict" } }
      : { status: 201, body: { id: STORED_ID } },
  );
  await toReview(page);
  await waitForFakeCheck(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("earlier enquiry");
  await expect(page.locator("[data-summary]")).toContainText("Sample Person");
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toHaveCount(0);
  expect(calls).toHaveLength(1);

  await waitForFakeCheck(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toBeVisible();
  expect(calls).toHaveLength(2);
  expect(calls[0]?.key).not.toBeNull();
  expect(calls[1]?.key).not.toBeNull();
  expect(calls[1]?.key).not.toBe(calls[0]?.key);
});

test("does not report Sent for a malformed positive acknowledgement", async ({ page }) => {
  const calls = await setup(page, () => ({ status: 201, body: { id: "accepted123" } }));
  await toReview(page);
  await waitForFakeCheck(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("couldn’t send");
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toHaveCount(0);
  await expect(page.locator("[data-summary]")).toContainText("Sample Person");
  expect(calls).toHaveLength(1);
});

test("server validation errors take the visitor to the right step with a clear message", async ({
  page,
}) => {
  await setup(page, () => ({
    status: 422,
    body: { error: "invalid_enquiry", errors: { phone: "invalid" } },
  }));
  await toReview(page);
  await waitForFakeCheck(page);
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
  await setup(page, () => ({ status: 201, body: { id: STORED_ID } }));
  await toReview(page);
  const audit = async () =>
    (
      await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()
    ).violations
      .filter((v) => ["serious", "critical"].includes(v.impact ?? ""))
      .map((v) => v.id);
  expect(await audit()).toEqual([]);
  await waitForFakeCheck(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: /your enquiry has reached us/ })).toBeVisible();
  expect(await audit()).toEqual([]);
});

test("submission-enabled homepage does not claim enquiries are disabled", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Preview: the planner can’t send enquiries yet.")).toHaveCount(0);
});
