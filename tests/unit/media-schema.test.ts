import { describe, expect, it } from "vitest";
import {
  focalClass,
  mediaEntrySchema,
  mediaManifestSchema,
  publishedMediaForFrame,
  RATIOS,
} from "../../src/lib/media/schema";

const entry = {
  file: "../../assets/events/walima/2025-12-garden-walima/01-stage-wide.jpg",
  alt: "Wide view of a stage dressed in white florals",
  category: "walima",
  focal: "center",
  orientation: "landscape",
  credit: "Photographer",
  permission: true,
  releaseRef: "TWN-REL-2026-A001",
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

  it("requires an opaque consent release reference that cannot expose names or URLs", () => {
    const invalid = [
      undefined,
      "",
      "family-name-consent",
      "https://example.com/consent.pdf",
      "../../private/release.pdf",
      "TWN-REL-2026-",
      "TWN-REL-2026-☃",
    ];
    for (const releaseRef of invalid) {
      expect(mediaEntrySchema.safeParse({ ...entry, releaseRef }).success, String(releaseRef)).toBe(
        false,
      );
    }
    expect(mediaEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("refuses external, absolute, traversing or category-mismatched sources", () => {
    const invalid = [
      "https://example.com/wedding.jpg",
      "/private/wedding.jpg",
      "../../assets/events/nikah/2025-12-garden-walima/01-stage-wide.jpg",
      "../../assets/events/walima/../../private/01-stage-wide.jpg",
      "../../assets/events/walima/2025-12-garden-walima/01-stage-wide.svg",
      "../../assets/events/walima/2025-12-garden-walima/01-stage-wide.jpg?x=1",
      "../../assets/events/walima/2025-12-garden-walima/01-stage-wide.jpg/extra",
    ];
    for (const file of invalid) {
      expect(mediaEntrySchema.safeParse({ ...entry, file }).success, file).toBe(false);
    }
  });

  it("rejects duplicate photo entries in a gallery manifest", () => {
    expect(mediaManifestSchema.safeParse({ images: [entry] }).success).toBe(true);
    expect(mediaManifestSchema.safeParse({ images: [entry, entry] }).success).toBe(false);
  });

  it("requires verified manifest metadata before a photo can render", () => {
    expect(publishedMediaForFrame(false, undefined)).toBeUndefined();
    expect(() => publishedMediaForFrame(true, undefined)).toThrow();
    expect(() => publishedMediaForFrame(true, { ...entry, permission: false })).toThrow();
    expect(publishedMediaForFrame(true, entry)?.alt).toBe(entry.alt);
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
