import { expect, test } from "@playwright/test";
import { publishedServiceSlugs } from "../support/publication-records";

const SLUGS = [
  "nikah-decoration-hyderabad",
  "hyderabadi-wedding-catering",
  "wedding-photography-videography",
  "bridal-makeup-hyderabad",
  "mehndi-artist-hyderabad",
  "trousseau-packing-hyderabad",
  "wedding-cars-hyderabad",
  "guest-hospitality-hyderabad",
];

test("service routes exist only for reviewed source records", async ({ request }) => {
  const approved = new Set(publishedServiceSlugs());
  for (const slug of SLUGS) {
    const response = await request.get(`/services/${slug}/`);
    expect(response.status(), slug).toBe(approved.has(slug) ? 200 : 404);
  }
  expect((await request.get("/services/unapproved-test-service/")).status()).toBe(404);
});

test("the owner-approved catering page is published", async ({ request }) => {
  const response = await request.get("/services/hyderabadi-wedding-catering/");
  expect(response.status()).toBe(200);
});
