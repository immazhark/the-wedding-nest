import { describe, expect, it } from "vitest";
import {
  SITE,
  canonicalUrl,
  pageTitle,
  robotsContent,
  organizationJsonLd,
} from "../../src/lib/site/config";

describe("site metadata", () => {
  it("uses the registered production domain", () => {
    expect(SITE.url).toBe("https://theweddingnest.in");
  });

  it("builds page titles with the brand name once", () => {
    expect(pageTitle()).toBe("The Wedding Nest — Weddings & celebrations in Hyderabad");
    expect(pageTitle("Plan your event")).toBe("Plan your event · The Wedding Nest");
  });

  it("builds absolute canonical URLs with a trailing slash and no query", () => {
    expect(canonicalUrl("/")).toBe("https://theweddingnest.in/");
    expect(canonicalUrl("/plan-your-event")).toBe("https://theweddingnest.in/plan-your-event/");
    expect(canonicalUrl("/plan-your-event/?utm=x")).toBe(
      "https://theweddingnest.in/plan-your-event/",
    );
  });

  it("is not indexable unless explicitly enabled for an approved production launch", () => {
    expect(robotsContent(false)).toBe("noindex, nofollow");
    expect(robotsContent(true)).toBe("index, follow");
  });

  it("provides only verified facts in Organization structured data", () => {
    const raw = organizationJsonLd();
    const json = JSON.parse(raw);
    expect(json).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://theweddingnest.in/#organization",
      name: "The Wedding Nest",
      url: "https://theweddingnest.in",
      sameAs: ["https://www.instagram.com/twn.events/"],
    });
    for (const unapproved of [
      "telephone",
      "address",
      "email",
      "aggregateRating",
      "review",
      "priceRange",
    ]) {
      expect(json).not.toHaveProperty(unapproved);
    }
  });

  it("only lists verified public profiles", () => {
    expect(SITE.instagram).toBe("https://www.instagram.com/twn.events/");
    expect(SITE).not.toHaveProperty("phone");
    expect(SITE).not.toHaveProperty("email");
  });
});
