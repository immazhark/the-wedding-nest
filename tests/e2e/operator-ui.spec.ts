import { expect, test } from "@playwright/test";

// The page is static; its API is mocked here. Server-side auth/CSRF/CAS are covered by unit tests.
const ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const HOSTILE = '<img src=x onerror="window.__pwned=1">';

test("operator page renders hostile text inertly, updates status and survives a stale conflict", async ({
  page,
}) => {
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
        enquiry: {
          id: ID,
          createdAt: "2026-12-01T09:00:00.000Z",
          status,
          unsuccessfulAt: null,
          marketingConsent: false,
          payload: {
            name: HOSTILE,
            phone: "+91 98765 43210",
            notes: HOSTILE,
            occasions: ["nikah"],
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
