import { expect, test } from "@playwright/test";

test("unapproved service landing pages cannot be reached", async ({ request }) => {
  for (const slug of [
    "bridal-makeup-hyderabad",
    "wedding-cars-hyderabad",
    "mehndi-artist-hyderabad",
  ]) {
    const response = await request.get(`/services/${slug}/`);
    expect(response.status(), slug).toBe(404);
  }
});

test("the owner-approved catering page is published", async ({ request }) => {
  const response = await request.get("/services/hyderabadi-wedding-catering/");
  expect(response.status()).toBe(200);
});
