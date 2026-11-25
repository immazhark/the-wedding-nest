import { expect, test } from "@playwright/test";

test("privacy notice is honest about prelaunch state and carries the owner's decisions", async ({
  request,
}) => {
  const response = await request.get("/privacy/");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("pre-launch notice for review");
  expect(html).toContain("90 days");
  expect(html).toContain("explicitly marked unsuccessful");
  expect(html).toContain("mailto:theweddingnest.events@gmail.com");
  expect(html).toContain("noindex, nofollow");
});

test("privacy notice remains readable, linked and accessible on small screens", async ({
  page,
}) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole("link", { name: "Privacy (pre-launch)" })).toBeVisible();
});
