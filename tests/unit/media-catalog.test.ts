import type { ImageMetadata } from "astro";
import { describe, expect, it } from "vitest";
import { buildApprovedMediaCatalog } from "../../src/lib/media/catalog";

const file = "../../assets/events/walima/2025-12-garden-walima/01-stage-wide.jpg";
const entry = {
  file,
  slot: "home-hero",
  alt: "Wide wedding stage with white floral arrangements",
  category: "walima",
  orientation: "landscape",
  permission: true,
  releaseRef: "TWN-REL-2026-A001",
};
const image = {
  src: "/_astro/01-stage-wide.hash.jpg",
  width: 3200,
  height: 1800,
  format: "jpg",
} as ImageMetadata;
const manifestPath = "../../content/media/walima.json";

describe("approved event media catalog", () => {
  it("renders no images until permitted manifests and matching sources exist", () => {
    expect(buildApprovedMediaCatalog({}, {})).toEqual({});
  });

  it("associates approved metadata with the exact local asset and editorial slot", () => {
    const catalog = buildApprovedMediaCatalog(
      { [manifestPath]: { images: [entry] } },
      { [file]: image },
    );
    expect(catalog["home-hero"]?.image).toBe(image);
    expect(catalog["home-hero"]?.entry.file).toBe(file);
    expect(catalog["home-hero"]?.entry.releaseRef).toBe(entry.releaseRef);
  });

  it("fails closed on missing releases, false permission, or unrecognized slots", () => {
    for (const invalid of [
      { ...entry, permission: false },
      { ...entry, releaseRef: undefined },
      { ...entry, slot: "private-portrait" },
    ]) {
      expect(() =>
        buildApprovedMediaCatalog(
          { [manifestPath]: { images: [invalid] } },
          { [file]: image },
        ),
      ).toThrow();
    }
  });

  it("rejects an approved declaration without its exact local imported asset", () => {
    expect(() => buildApprovedMediaCatalog({ [manifestPath]: { images: [entry] } }, {})).toThrow(
      /missing|unmatched/i,
    );
  });

  it("rejects unmanifested files before they could enter a site build", () => {
    expect(() => buildApprovedMediaCatalog({}, { [file]: image })).toThrow(/unreviewed/i);
  });

  it("rejects duplicate editorial slots and photographs across separate manifests", () => {
    const second = "../../assets/events/nikah/2026-02-courtyard-nikah/01-ceremony.jpg";
    const other = { ...entry, file: second, category: "nikah", releaseRef: "TWN-REL-2026-B002" };
    const assets = { [file]: image, [second]: image };
    expect(() =>
      buildApprovedMediaCatalog(
        {
          [manifestPath]: { images: [entry] },
          "../../content/media/nikah.json": { images: [other] },
        },
        assets,
      ),
    ).toThrow(/slot/i);
    expect(() =>
      buildApprovedMediaCatalog(
        {
          [manifestPath]: { images: [entry] },
          "../../content/media/duplicate.json": { images: [entry] },
        },
        { [file]: image },
      ),
    ).toThrow(/duplicate/i);
  });

  it("rejects invalid manifest modules and asset entries", () => {
    expect(() => buildApprovedMediaCatalog({ [manifestPath]: null }, {})).toThrow();
    expect(() =>
      buildApprovedMediaCatalog({ [manifestPath]: { images: [entry] } }, { [file]: {} as ImageMetadata }),
    ).toThrow(/metadata/i);
  });
});
