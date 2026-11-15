import { describe, expect, it } from "vitest";
import { SITE, canonicalUrl, pageTitle, robotsContent } from "../../src/lib/site/config";

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

  it("only lists verified public profiles", () => {
    expect(SITE.instagram).toBe("https://www.instagram.com/twn.events/");
    expect(SITE).not.toHaveProperty("phone");
    expect(SITE).not.toHaveProperty("email");
  });
});
