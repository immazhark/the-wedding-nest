/**
 * Build-time-only association of consent-reviewed manifest entries and exact local assets.
 * A photo cannot be selected by inventing metadata for a different image.
 * No real photography is imported or published until its original and consent record are approved.
 */
import type { ImageMetadata } from "astro";
import { mediaManifestSchema, type HomeMediaSlot, type MediaEntry } from "./schema";

export interface ApprovedPhoto {
  readonly image: ImageMetadata;
  readonly entry: MediaEntry;
}

export type HomePhotoCatalog = Partial<Record<HomeMediaSlot, ApprovedPhoto>>;

const manifestPath = /^\.\.\/\.\.\/content\/media\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/;

export interface ApprovedMediaCollection {
  readonly home: HomePhotoCatalog;
  readonly photosByFile: Readonly<Record<string, ApprovedPhoto>>;
}

export function buildApprovedMediaCollection(
  manifests: Record<string, unknown>,
  images: Record<string, ImageMetadata>,
  eventPaths: readonly string[] = Object.keys(images),
): ApprovedMediaCollection {
  const result: HomePhotoCatalog = {};
  const byFile: Record<string, ApprovedPhoto> = {};
  const files = new Set<string>();
  for (const [path, raw] of Object.entries(manifests).sort(([a], [b]) => a.localeCompare(b))) {
    if (!manifestPath.test(path)) throw new Error("Invalid reviewed media manifest path");
    const manifest = mediaManifestSchema.parse(raw);
    for (const entry of manifest.images) {
      if (files.has(entry.file)) throw new Error("Duplicate photograph across media manifests");
      files.add(entry.file);
      const image = images[entry.file];
      if (!image) throw new Error("Missing matching local imported asset: " + entry.file);
      if (
        typeof image.src !== "string" ||
        !image.src ||
        !Number.isSafeInteger(image.width) ||
        image.width <= 0 ||
        !Number.isSafeInteger(image.height) ||
        image.height <= 0
      ) {
        throw new Error("Invalid local image metadata");
      }
      const approved = { image, entry };
      byFile[entry.file] = approved;
      if (entry.slot) {
        if (result[entry.slot]) throw new Error("Duplicate editorial photo slot: " + entry.slot);
        result[entry.slot] = approved;
      }
    }
  }
  // An original sitting in the import directory without a verified declaration
  // must never slip through the build as an unnoticed, publicly bundled asset.
  // Scan every file in the event directory, not just supported image types.
  // Even an SVG, GIF, PDF or differently cased extension must not slip in
  // without a reviewed manifest (which only permits safe image formats).
  for (const path of new Set([...Object.keys(images), ...eventPaths])) {
    if (!files.has(path)) throw new Error("Unreviewed local event asset: " + path);
  }
  return { home: result, photosByFile: byFile };
}

/** Retain the existing homepage API while also supporting verified case studies. */
export function buildApprovedMediaCatalog(
  manifests: Record<string, unknown>,
  images: Record<string, ImageMetadata>,
  eventPaths: readonly string[] = Object.keys(images),
): HomePhotoCatalog {
  return buildApprovedMediaCollection(manifests, images, eventPaths).home;
}

// Eager imports are safe only because *every* imported original is required to
// have a valid consent-reviewed declaration. If no photos exist, this is empty
// and the homepage keeps its honest, labelled placeholders.
const manifests = import.meta.glob("../../content/media/*.json", {
  eager: true,
  import: "default",
});
const assets = import.meta.glob<ImageMetadata>(
  "../../assets/events/**/*.{jpg,jpeg,png,webp,avif}",
  { eager: true, import: "default" },
);

// Lazy, URL-mode imports enumerate names only: no unsupported file is
// imported into a page or published. An accidental file still fails the build.
const allEventPaths = Object.keys(import.meta.glob("../../assets/events/**/*", { query: "?url" }));

const approvedMedia = buildApprovedMediaCollection(manifests, assets, allEventPaths);

export const approvedHomePhotos = approvedMedia.home;
export const approvedEventPhotos = approvedMedia.photosByFile;
