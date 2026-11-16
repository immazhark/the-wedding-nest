import { expect, test } from "@playwright/test";

test("unapproved service landing pages cannot be reached", async ({ request }) => {
  const response = await request.get("/services/hyderabadi-wedding-catering/");
  expect(response.status()).toBe(404);
});
