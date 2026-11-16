import { describe, expect, it } from "vitest";
import { buildPublishedServicePages, servicePageSchema } from "../../src/lib/services/publication";

const example = {
  slug: "hyderabadi-wedding-catering",
  publicationApproved: true,
  approvalRef: "TWN-PUB-2026-A001",
  title: "Catering enquiries for wedding celebrations",
  description:
    "Discuss menus, guest numbers, dietary preferences and service requirements with The Wedding Nest.",
  introduction:
    "A wedding meal involves practical decisions about guest numbers, service style and the venue. This page describes the choices a family can discuss before confirming an arrangement.",
  sections: [
    {
      title: "Start with the gathering",
      body: "Guest count, venue requirements and the events being hosted can shape the initial catering conversation.",
    },
    {
      title: "Discuss the details",
      body: "Menus, preferences and any required arrangements should be confirmed directly with the planning team.",
    },
  ],
};

describe("owner-gated service publication", () => {
  it("starts with zero service pages, not invented offers", () => {
    expect(buildPublishedServicePages({})).toEqual([]);
  });

  it("requires an explicit approval record and exact local filename", () => {
    const validPath = "../../content/services/hyderabadi-wedding-catering.json";
    const approved = buildPublishedServicePages({ [validPath]: example });
    expect(approved).toHaveLength(1);
    expect(approved[0]?.plannerService).toBe("catering");

    for (const publicationApproved of [undefined, false, "true"]) {
      expect(() =>
        buildPublishedServicePages({
          [validPath]: { ...example, publicationApproved },
        }),
      ).toThrow();
    }

    expect(() =>
      buildPublishedServicePages({
        "../../content/services/nikah-decoration-hyderabad.json": example,
      }),
    ).toThrow(/slug|filename/i);
  });

  it("rejects arbitrary routes, unverified statements and unknown fields", () => {
    expect(servicePageSchema.safeParse({ ...example, slug: "random-service" }).success).toBe(false);
    expect(servicePageSchema.safeParse({ ...example, approvalRef: "family-name" }).success).toBe(
      false,
    );
    expect(servicePageSchema.safeParse({ ...example, aggregateRating: 5 }).success).toBe(false);
    expect(servicePageSchema.safeParse({ ...example, sections: [] }).success).toBe(false);
  });
});
