import { describe, expect, it } from "vitest";
import {
  buildPublishedTestimonials,
  testimonialSchema,
} from "../../src/lib/testimonials/publication";

const record = {
  id: "client-walima-2025",
  quote:
    "They looked after every guest as if each one were family, and nothing was left to chance.",
  attribution: "Client, Walima",
  source: "written-by-client",
  publicationApproved: true,
  approvalRef: "TWN-QUOTE-2026-A001",
};
const path = "../../content/testimonials/client-walima-2025.json";

describe("testimonial publication", () => {
  it("publishes nothing when there are no approved records", () => {
    expect(buildPublishedTestimonials({})).toEqual([]);
  });

  it("accepts an owner-approved record with permission reference", () => {
    expect(buildPublishedTestimonials({ [path]: record })).toHaveLength(1);
  });

  it("rejects unapproved, unreferenced or extra-field records", () => {
    expect(() => testimonialSchema.parse({ ...record, publicationApproved: false })).toThrow();
    expect(() => testimonialSchema.parse({ ...record, approvalRef: "x" })).toThrow();
    expect(() => testimonialSchema.parse({ ...record, rating: 5 })).toThrow();
    expect(() => testimonialSchema.parse({ ...record, email: "a@b.c" })).toThrow();
  });

  it("requires a declared source so Google excerpts cannot be passed off as client-written", () => {
    expect(() => testimonialSchema.parse({ ...record, source: undefined })).toThrow();
    expect(() => testimonialSchema.parse({ ...record, source: "invented" })).toThrow();
  });

  it("requires the filename to match the id and ids to be unique", () => {
    expect(() =>
      buildPublishedTestimonials({ "../../content/testimonials/other.json": record }),
    ).toThrow();
  });

  it("orders records deterministically by id", () => {
    const b = { ...record, id: "client-b-2025" };
    const out = buildPublishedTestimonials({
      "../../content/testimonials/client-b-2025.json": b,
      [path]: record,
    });
    expect(out.map((t) => t.id)).toEqual(["client-b-2025", "client-walima-2025"]);
  });
});
