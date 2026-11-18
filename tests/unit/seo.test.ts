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
      telephone: "+919966973113",
      email: "theweddingnest.events@gmail.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "12-2-1/D/68, Zeba Bagh, Asif Nagar",
        addressLocality: "Hyderabad",
        addressRegion: "Telangana",
        postalCode: "500028",
        addressCountry: "IN",
      },
      sameAs: ["https://www.instagram.com/twn.events/", "https://www.facebook.com/twn.events"],
    });
    for (const unapproved of [
      "aggregateRating",
      "review",
      "priceRange",
      "openingHours",
      "openingHoursSpecification",
    ]) {
      expect(json).not.toHaveProperty(unapproved);
    }
  });

  it("only lists owner-supplied public contact details", () => {
    expect(SITE.instagram).toBe("https://www.instagram.com/twn.events/");
    expect(SITE.facebook).toBe("https://www.facebook.com/twn.events");
    expect(SITE.phone).toBe("+919966973113");
    expect(SITE.email).toBe("theweddingnest.events@gmail.com");
    // WhatsApp uses the same number as the phone.
    expect(SITE.whatsapp).toBe("https://wa.me/919966973113");
    expect(SITE.address.postalCode).toBe("500028");
    expect(SITE.hours).toBe("9:00 am to 12:00 midnight");
    // twn.events was an earlier domain the business no longer uses or owns.
    expect(JSON.stringify(SITE)).not.toMatch(/https?:\/\/(www\.)?twn\.events/);
  });
});
