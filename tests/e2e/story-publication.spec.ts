import { expect, test } from "@playwright/test";

test("unapproved event stories never become public routes", async ({ request }) => {
  const response = await request.get("/stories/2025-12-garden-walima/");
  expect(response.status()).toBe(404);
});
