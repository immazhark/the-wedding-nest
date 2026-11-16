import { describe, expect, it } from "vitest";
import type { ImageMetadata } from "astro";
import { buildPublishedStories, storySchema } from "../../src/lib/stories/publication";
import type { ApprovedPhoto } from "../../src/lib/media/catalog";

const slug = "2025-12-garden-walima";
const base = "../../assets/events/walima/" + slug + "/";
const fileA = base + "01-stage-wide.jpg";
const fileB = base + "02-table-detail.jpg";
const pagePath = "../../content/stories/" + slug + ".json";
const record = {
  slug,
  occasion: "walima",
  title: "An evening gathering for a Walima",
  introduction:
    "A factual, permission-cleared introduction describing the occasion, the brief and the approved event coverage with appropriate attribution.",
  brief:
    "A description of what the hosts asked for, pending independent verification and the business owner's approval.",
  contribution:
    "A precise record of work carried out by the business, subject to documentary verification before publication.",
  images: [fileA, fileB],
  publicationApproved: true,
  approvalRef: "TWN-STORY-2026-A001",
};
const makePhoto = (file: string): ApprovedPhoto => ({
  image: { src: "/_astro/photo.jpg", width: 1400, height: 900 } as ImageMetadata,
  entry: {
    file,
    alt: "A carefully described event scene with no identities",
    category: "walima",
    orientation: "landscape",
    permission: true,
    releaseRef: "TWN-REL-2026-A001",
    focal: "center",
  },
});
const photos = { [fileA]: makePhoto(fileA), [fileB]: makePhoto(fileB) };

describe("owner-gated event stories", () => {
  it("ships no fictional portfolio stories until content is approved", () => {
    expect(buildPublishedStories({}, {})).toEqual([]);
  });

  it("requires explicit story approval, matching image files and photo releases", () => {
    const published = buildPublishedStories({ [pagePath]: record }, photos);
    expect(published).toHaveLength(1);
    expect(published[0]?.photos).toHaveLength(2);
    expect(published[0]?.photos[0]?.entry.file).toBe(fileA);

    expect(() =>
      buildPublishedStories({ [pagePath]: { ...record, publicationApproved: false } }, photos),
    ).toThrow();
    expect(() =>
      buildPublishedStories({ [pagePath]: record }, { [fileA]: photos[fileA]! }),
    ).toThrow(/photo|image/i);
    expect(() =>
      buildPublishedStories(
        { [pagePath]: record },
        { ...photos, [fileB]: makePhoto("../../assets/events/nikah/other/01-image.jpg") },
      ),
    ).toThrow();
  });

  it("rejects mismatched story filenames, duplicates and unknown claims", () => {
    expect(() =>
      buildPublishedStories({ "../../content/stories/other.json": record }, photos),
    ).toThrow(/slug|filename/i);
    expect(storySchema.safeParse({ ...record, images: [fileA, fileA] }).success).toBe(false);
    expect(storySchema.safeParse({ ...record, clientName: "Private Client" }).success).toBe(false);
    expect(
      storySchema.safeParse({ ...record, approvalRef: "https://secret.example" }).success,
    ).toBe(false);
  });
});
