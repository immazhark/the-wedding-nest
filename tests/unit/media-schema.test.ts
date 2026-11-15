import { describe, expect, it } from "vitest";
import { focalClass, mediaEntrySchema, RATIOS } from "../../src/lib/media/schema";

const entry = {
  file: "../../assets/events/walima/2025-12-garden-walima/01-stage-wide.jpg",
  alt: "Wide view of a stage dressed in white florals",
  category: "walima",
  focal: "center",
  orientation: "landscape",
  credit: "Photographer",
  permission: true,
};

describe("media manifest schema", () => {
  it("accepts a complete, permitted image", () => {
    expect(mediaEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("rejects any image without explicit publication permission", () => {
    for (const permission of [false, undefined, "yes"]) {
      expect(mediaEntrySchema.safeParse({ ...entry, permission }).success).toBe(false);
    }
  });

  it("requires meaningful alt text and a known category", () => {
    expect(mediaEntrySchema.safeParse({ ...entry, alt: "img" }).success).toBe(false);
    expect(mediaEntrySchema.safeParse({ ...entry, category: "random" }).success).toBe(false);
  });
});

describe("frame helpers", () => {
  it("maps focal keywords to object-position classes", () => {
    expect(focalClass("center")).toBe("object-center");
    expect(focalClass("top-left")).toBe("object-left-top");
  });

  it("defines the supported photographic ratios", () => {
    expect(Object.keys(RATIOS)).toEqual(["portrait", "tall", "square", "landscape", "panorama"]);
  });
});
