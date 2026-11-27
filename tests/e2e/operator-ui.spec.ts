import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// The page is static; its API is mocked here. Server-side auth/CSRF/CAS are covered by unit tests.
const ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const HOSTILE = '<img src=x onerror="window.__pwned=1">';

const workerd = process.env["E2E_TARGET"] === "workerd";

// Real Worker runtime, no Access configuration: every operator surface must fail closed (404).
test("operator surfaces are invisible when Access is not configured", async ({ request }) => {
  test.skip(!workerd, "needs the Workers runtime");
  for (const path of [
    "/operator/",
    "/operator/operator.js",
    "/operator/labels.js",
    "/api/operator/enquiries",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()["cache-control"]).toBe("no-store");
  }
});

test("operator page renders hostile text inertly, updates status and survives a stale conflict", async ({
  page,
}, testInfo) => {
  test.skip(workerd, "static page is gated by the Worker; covered by the fail-closed test");
  let status = "new";
  let conflictNext = false;
  const posts: unknown[] = [];

  await page.route("**/api/operator/enquiries?**", (route) =>
    route.fulfill({
      json: {
        enquiries: [
          {
            id: ID,
            createdAt: "2026-12-01T09:00:00.000Z",
            status,
            name: HOSTILE,
            occasions: ["nikah"],
          },
        ],
      },
    }),
  );
  await page.route(`**/api/operator/enquiries/${ID}`, (route) =>
    route.fulfill({
      json: {
        history: [],
        enquiry: {
          id: ID,
          createdAt: "2026-12-01T09:00:00.000Z",
          status,
          unsuccessfulAt: null,
          marketingConsent: false,
          consentAt: "2026-12-01T09:00:00.000Z",
          payload: {
            name: HOSTILE,
            phone: "+91 98765 43210",
            notes: HOSTILE,
            occasions: ["nikah", "legacy-occasion"],
            scope: "specific-services",
            services: ["decor", "photo-film"],
            styles: ["heritage", "legacy_style", HOSTILE, "constructor"],
            budget: "5-15l",
            contactChannel: "whatsapp",
            date: { kind: "undecided" },
            guestCount: "350",
            location: "Fictional venue",
          },
        },
      },
    }),
  );
  await page.route(`**/api/operator/enquiries/${ID}/status`, async (route) => {
    posts.push(route.request().postDataJSON());
    if (conflictNext) {
      status = "contacted"; // someone else already moved it
      return route.fulfill({ status: 409, json: { error: "stale_or_missing" } });
    }
    status = (route.request().postDataJSON() as { to: string }).to;
    return route.fulfill({ json: { ok: true } });
  });

  await page.goto("/operator/");
  await page.getByRole("button", { name: /Sample|<img/ }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(HOSTILE);
  expect(await page.evaluate(() => (window as { __pwned?: number }).__pwned)).toBeUndefined();
  await expect(page.locator("#fields img")).toHaveCount(0);

  const value = (label: string) =>
    page
      .locator("#fields dt")
      .filter({ hasText: new RegExp(`^${label}$`) })
      .locator("+ dd");
  await expect(value("Scope")).toHaveText("Specific services");
  await expect(value("Services")).toHaveText("Décor, florals & staging, Photography & film");
  await expect(value("Styles")).toHaveText(
    `Hyderabadi heritage, legacy style, ${HOSTILE}, constructor`,
  );
  await expect(value("Budget")).toHaveText("₹5–15 lakh");
  await expect(value("Occasions")).toHaveText("Nikah, legacy occasion");
  await expect(value("Preferred contact")).toHaveText("WhatsApp");
  await expect(value("Date")).toHaveText("Undecided");
  const consentDate = await page.evaluate(() =>
    new Date("2026-12-01T09:00:00.000Z").toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  );
  await expect(value("Consent recorded")).toHaveText(consentDate);
  await expect(page.locator("#fields img")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2 })).toBeFocused();

  await mkdir("playwright-report", { recursive: true });
  await page.screenshot({
    path: `playwright-report/operator-details-${testInfo.project.name}.png`,
    fullPage: true,
  });

  let confirmation = "";
  page.once("dialog", async (dialog) => {
    confirmation = dialog.message();
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Mark unsuccessful" }).click();
  expect(confirmation).toBe(
    "Mark unsuccessful? Details become eligible for deletion after 90 days. Pending deliveries hold deletion. Automatic cleanup is not active.",
  );
  expect(posts).toEqual([]);

  conflictNext = true;
  await page.getByRole("button", { name: "Mark in progress" }).click();
  await expect(page.getByRole("status")).toContainText("Someone else changed this enquiry");
  // The reloaded record is now "contacted": the stale "Mark contacted" action is gone.
  await expect(page.getByRole("button", { name: "Mark contacted" })).toHaveCount(0);

  conflictNext = false;
  await page.getByRole("button", { name: "Mark in progress" }).click();
  await expect(page.getByRole("status")).toHaveText("Updated.");
  expect(posts).toEqual([
    { from: "new", to: "in_progress" },
    { from: "contacted", to: "in_progress" },
  ]);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("operator list ignores superseded filters and blocks duplicate pagination requests", async ({
  page,
}) => {
  test.skip(workerd, "static page is gated by the Worker");
  const at = "2026-12-01T09:00:00.000Z";
  const olderId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const entry = (id: string, name: string, status: string) => ({
    id,
    name,
    status,
    createdAt: at,
    occasions: ["nikah"],
  });
  // Resolve fetches explicitly in the browser, so request order is deterministic
  // without relying on fixed sleeps or network latency.
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    const pending: {
      url: string;
      resolve: (response: Response) => void;
    }[] = [];
    Object.assign(window, { operatorTestPending: pending });
    window.fetch = (input, init) => {
      const url = String(input);
      if (!url.startsWith("/api/operator/enquiries?")) return original(input, init);
      return new Promise<Response>((resolve) => pending.push({ url, resolve }));
    };
  });
  type Pending = { url: string; resolve: (response: Response) => void };
  const count = () =>
    page.evaluate(
      () => (window as unknown as { operatorTestPending: Pending[] }).operatorTestPending.length,
    );
  const deliver = (index: number, body: unknown) =>
    page.evaluate(
      async ({ index, body }) => {
        const pending = (window as unknown as { operatorTestPending: Pending[] })
          .operatorTestPending;
        pending[index]!.resolve(Response.json(body));
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      },
      { index, body },
    );

  await page.goto("/operator/");
  await expect.poll(count).toBe(1);
  await page.getByLabel("Show").selectOption("booked");
  await expect.poll(count).toBe(2);
  await deliver(1, {
    enquiries: [entry(ID, "Booked fixture", "booked")],
    nextCursor: { createdAt: at, id: ID },
  });
  await expect(page.getByRole("button", { name: /Booked fixture/ })).toBeVisible();
  await deliver(0, {
    enquiries: [entry(olderId, "Obsolete fixture", "new")],
    nextCursor: null,
  });
  await expect(page.getByRole("button", { name: /Obsolete fixture/ })).toHaveCount(0);
  const more = page.getByRole("button", { name: "Load older" });
  await expect(more).toBeVisible();
  await more.click();
  await expect.poll(count).toBe(3);
  await expect(more).toBeDisabled();
  await more.evaluate((button) => button.dispatchEvent(new Event("click")));
  expect(await count()).toBe(3);
  await deliver(2, {
    enquiries: [entry(olderId, "Older booked fixture", "booked")],
    nextCursor: null,
  });
  await expect(page.getByRole("button", { name: /Older booked fixture/ })).toBeVisible();
  await expect(more).toBeHidden();
});

test("operator navigation ignores late details and status writes from abandoned views", async ({
  page,
}) => {
  test.skip(workerd, "static page is gated by the Worker");
  const other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const at = "2026-12-01T09:00:00.000Z";
  const entry = (id: string, name: string) => ({
    id,
    createdAt: at,
    status: "new",
    name,
    occasions: ["nikah"],
  });
  await page.route("**/api/operator/enquiries?**", (route) =>
    route.fulfill({
      json: { enquiries: [entry(ID, "First fixture"), entry(other, "Second fixture")] },
    }),
  );
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    const pending: {
      url: string;
      method: string;
      resolve: (response: Response) => void;
    }[] = [];
    Object.assign(window, { operatorDetailPending: pending });
    window.fetch = (input, init) => {
      const url = String(input);
      if (!url.startsWith("/api/operator/enquiries/")) return original(input, init);
      return new Promise<Response>((resolve) =>
        pending.push({ url, method: init?.method || "GET", resolve }),
      );
    };
  });
  type Pending = { url: string; method: string; resolve: (response: Response) => void };
  const count = () =>
    page.evaluate(
      () =>
        (window as unknown as { operatorDetailPending: Pending[] }).operatorDetailPending.length,
    );
  const deliver = (index: number, body: unknown) =>
    page.evaluate(
      async ({ index, body }) => {
        const pending = (window as unknown as { operatorDetailPending: Pending[] })
          .operatorDetailPending;
        pending[index]!.resolve(Response.json(body));
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      },
      { index, body },
    );
  const detail = (id: string, name: string) => ({
    enquiry: {
      id,
      createdAt: at,
      status: "new",
      marketingConsent: false,
      payload: { name },
    },
    history: [],
  });

  await page.goto("/operator/");
  await page.getByRole("button", { name: /First fixture/ }).click();
  await expect.poll(count).toBe(1);
  await page.getByRole("button", { name: /Back to list/ }).click();
  await page.getByRole("button", { name: /Second fixture/ }).click();
  await expect.poll(count).toBe(2);
  await deliver(1, detail(other, "Second fixture"));
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Second fixture");
  await deliver(0, detail(ID, "First fixture"));
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Second fixture");

  await page.getByRole("button", { name: "Mark contacted" }).click();
  await expect.poll(count).toBe(3);
  await expect(page.getByRole("button", { name: "Mark booked" })).toBeDisabled();
  await page.getByRole("button", { name: /Back to list/ }).click();
  await page.getByRole("button", { name: /First fixture/ }).click();
  await expect.poll(count).toBe(4);
  await deliver(3, detail(ID, "First fixture"));
  await deliver(2, { ok: true });
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("First fixture");
  expect(await count()).toBe(4);
});

test("operator distinguishes an unavailable audit trail from an empty one", async ({ page }) => {
  test.skip(workerd, "static page is gated by the Worker");
  let history: unknown[] | null = null;
  const at = "2026-12-01T09:00:00.000Z";
  const entry = { id: ID, name: "Audit fixture", createdAt: at, status: "new", occasions: [] };
  await page.route("**/api/operator/enquiries?**", (route) =>
    route.fulfill({ json: { enquiries: [entry], nextCursor: null } }),
  );
  await page.route(`**/api/operator/enquiries/${ID}`, (route) =>
    route.fulfill({
      json: {
        history,
        enquiry: { ...entry, marketingConsent: false, payload: { name: entry.name } },
      },
    }),
  );
  await page.goto("/operator/");
  await page.getByRole("button", { name: /Audit fixture/ }).click();
  await expect(
    page
      .locator("#fields dt")
      .filter({ hasText: /^Consent recorded$/ })
      .locator("+ dd"),
  ).toHaveText("Not recorded");
  for (const optional of ["Scope", "Services", "Styles", "Budget"]) {
    await expect(
      page.locator("#fields dt").filter({ hasText: new RegExp(`^${optional}$`) }),
    ).toHaveCount(0);
  }
  await expect(page.locator("#fields")).toContainText("Audit history unavailable");
  await expect(page.getByRole("button", { name: "Mark contacted" })).toHaveCount(0);
  await page.getByRole("button", { name: /Back to list/ }).click();
  history = [];
  await page.getByRole("button", { name: /Audit fixture/ }).click();
  await expect(page.locator("#fields")).toContainText("No recorded status changes.");
  await expect(page.getByRole("button", { name: "Mark contacted" })).toBeEnabled();
});

test("delivery overview loads on demand and never presents failed reads as zeros", async ({
  page,
}) => {
  test.skip(workerd, "static page is gated by the Worker");
  let calls = 0;
  let fail = false;
  await page.route("**/api/operator/enquiries?**", (route) =>
    route.fulfill({ json: { enquiries: [], nextCursor: null } }),
  );
  await page.route("**/api/operator/delivery-overview", (route) => {
    calls++;
    return fail
      ? route.fulfill({ status: 503, json: { error: "storage_unavailable" } })
      : route.fulfill({
          json: {
            total: 7,
            accepted: 1,
            unconfirmed: 1,
            held: 2,
            leased: 1,
            retry: 1,
            ready: 1,
          },
        });
  });
  await page.goto("/operator/");
  await expect(page.getByRole("status")).toHaveText("No enquiries.");
  expect(calls).toBe(0);
  await page.getByText("Notification delivery", { exact: true }).click();
  await expect(page.locator("#delivery-message")).toHaveText("7 events in the current overview.");
  await expect(page.locator("#delivery-held")).toHaveText("2");
  await expect(page.locator("#delivery-accepted")).toHaveText("1");
  expect(calls).toBe(1);

  fail = true;
  await page.getByRole("button", { name: "Refresh delivery overview" }).click();
  await expect(page.locator("#delivery-message")).toContainText("Delivery overview unavailable");
  await expect(page.locator("#delivery-held")).toHaveText("—");
  await expect(page.locator("#delivery-accepted")).toHaveText("—");
  expect(calls).toBe(2);
});

test("held notifications load on demand with safe metadata, paging and failure visibility", async ({
  page,
}, testInfo) => {
  test.skip(workerd, "static page is gated by the Worker");
  const at = "2026-12-01T09:00:00.000Z";
  const other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  let calls = 0;
  let fail = false;
  const entry = (id: string, reason: string, window: string) => ({
    id,
    createdAt: at,
    attempts: 8,
    reason,
    window,
    notice_json: HOSTILE,
    enquiryId: "private-enquiry-id",
    accepted_provider_id: "private-provider-id",
  });
  await page.route("**/api/operator/enquiries?**", (route) =>
    route.fulfill({ json: { enquiries: [], nextCursor: null } }),
  );
  await page.route("**/api/operator/delivery-overview", (route) =>
    route.fulfill({
      json: { total: 2, accepted: 0, held: 2, unconfirmed: 0, leased: 0, retry: 0, ready: 0 },
    }),
  );
  await page.route("**/api/operator/delivery-held?**", async (route) => {
    calls++;
    if (fail) return route.fulfill({ status: 503, json: { error: "storage_unavailable" } });
    const url = new URL(route.request().url());
    return route.fulfill({
      json: url.searchParams.has("after")
        ? { events: [entry(other, "unknown", "invalid_clock")], nextCursor: null }
        : { events: [entry(ID, "provider", "expired")], nextCursor: { createdAt: at, id: ID } },
    });
  });
  await page.goto("/operator/");
  expect(calls).toBe(0);
  await page.getByText("Notification delivery", { exact: true }).click();
  expect(calls).toBe(0);
  await page.getByText("Held notifications", { exact: true }).click();
  await expect(page.locator("#held-list")).toContainText(ID);
  await expect(page.locator("#held-list")).toContainText("Provider blocked delivery");
  await expect(page.locator("#held-list")).toContainText("Outside the automatic send window");
  await expect(page.locator("#held-list")).not.toContainText("private-");
  await expect(page.locator("#held-list img")).toHaveCount(0);
  await page.getByRole("button", { name: "Load more held notifications" }).click();
  await expect(page.locator("#held-list li")).toHaveCount(2);
  await expect(page.locator("#held-list")).toContainText("Reason requires review");
  await expect(page.locator("#held-list")).toContainText("Event clock requires review");
  await expect(page.getByRole("button", { name: "Load more held notifications" })).toBeHidden();
  await mkdir("playwright-report", { recursive: true });
  await page.screenshot({
    path: `playwright-report/operator-held-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
  fail = true;
  await page.getByRole("button", { name: "Refresh held notifications" }).click();
  await expect(page.locator("#held-message")).toContainText("Could not load held notifications");
  await expect(page.locator("#held-message")).not.toContainText("No held notifications");
  await expect(page.locator("#held-list li")).toHaveCount(0);
});

test("held notifications reject late views and duplicate pagination requests", async ({ page }) => {
  test.skip(workerd, "static page is gated by the Worker");
  const at = "2026-12-01T09:00:00.000Z";
  const other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await page.route("**/api/operator/enquiries?**", (route) =>
    route.fulfill({ json: { enquiries: [], nextCursor: null } }),
  );
  await page.route("**/api/operator/delivery-overview", (route) =>
    route.fulfill({
      json: { total: 0, accepted: 0, held: 0, unconfirmed: 0, leased: 0, retry: 0, ready: 0 },
    }),
  );
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    const pending: { url: string; resolve: (r: Response) => void }[] = [];
    Object.assign(window, { heldTestPending: pending });
    window.fetch = (input, init) =>
      String(input).startsWith("/api/operator/delivery-held?")
        ? new Promise<Response>((resolve) => pending.push({ url: String(input), resolve }))
        : original(input, init);
  });
  type Pending = { url: string; resolve: (r: Response) => void };
  const count = () =>
    page.evaluate(
      () => (window as unknown as { heldTestPending: Pending[] }).heldTestPending.length,
    );
  const deliver = (index: number, body: unknown) =>
    page.evaluate(
      ({ index, body }) => {
        (window as unknown as { heldTestPending: Pending[] }).heldTestPending[index]!.resolve(
          Response.json(body),
        );
      },
      { index, body },
    );
  const entry = (id: string) => ({
    id,
    createdAt: at,
    attempts: 8,
    reason: "attempts_exhausted",
    window: "within_window",
  });
  await page.goto("/operator/");
  await page.getByText("Notification delivery", { exact: true }).click();
  const toggle = page.getByText("Held notifications", { exact: true });
  await toggle.click();
  await expect.poll(count).toBe(1);
  await toggle.click();
  await toggle.click();
  await expect.poll(count).toBe(2);
  await deliver(1, { events: [entry(other)], nextCursor: { createdAt: at, id: other } });
  await expect(page.locator("#held-list")).toContainText(other);
  await deliver(0, { events: [entry(ID)], nextCursor: null });
  await expect(page.locator("#held-list")).not.toContainText(ID);
  const more = page.getByRole("button", { name: "Load more held notifications" });
  await more.click();
  await expect.poll(count).toBe(3);
  await expect(more).toBeDisabled();
  await more.evaluate((button) => button.dispatchEvent(new Event("click")));
  expect(await count()).toBe(3);
  await deliver(2, { events: [], nextCursor: null });
  await expect(more).toBeHidden();
  await expect(page.locator("#held-list li")).toHaveCount(1);
});
