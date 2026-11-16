/**
 * Zero portfolio pages by default. A story can be generated only from an
 * owner-approved factual record and individually consent-reviewed local media.
 * Opaque IDs are pointers to private permission evidence, never evidence alone.
 */
import { z } from "astro/zod";
import type { ApprovedPhoto } from "../media/catalog";
import { MEDIA_CATEGORIES, mediaEntrySchema } from "../media/schema";
import { approvedEventPhotos } from "../media/catalog";

const NEUTRAL_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_PATH = /^\.\.\/\.\.\/content\/stories\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/;

export const storySchema = z
  .object({
    slug: z.string().regex(NEUTRAL_SLUG),
    occasion: z.enum(MEDIA_CATEGORIES),
    title: z.string().min(12).max(120),
    introduction: z.string().min(80).max(700),
    brief: z.string().min(80).max(900),
    contribution: z.string().min(80).max(900),
    images: z.array(z.string()).min(2).max(12),
    publicationApproved: z.literal(true),
    approvalRef: z.string().regex(/^TWN-STORY-20\d{2}-[A-Z0-9]{4,10}$/),
  })
  .strict()
  .superRefine((story, context) => {
    const seen = new Set<string>();
    story.images.forEach((file, index) => {
      if (seen.has(file)) {
        context.addIssue({
          code: "custom",
          path: ["images", index],
          message: "Duplicate photograph in a portfolio story",
        });
      }
      seen.add(file);
    });
  });

export type ApprovedStory = z.infer<typeof storySchema> & {
  photos: ApprovedPhoto[];
};

/**
 * An undeclared or unapproved story fails the whole build rather than being
 * published as a plausible-looking fabricated event.
 */
export function buildPublishedStories(
  sources: Record<string, unknown>,
  photosByFile: Readonly<Record<string, ApprovedPhoto>>,
): ApprovedStory[] {
  return Object.entries(sources)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, raw]) => {
      const filename = SOURCE_PATH.exec(path)?.[1];
      if (!filename) throw new Error("Invalid portfolio story filename");
      const story = storySchema.parse(raw);
      if (filename !== story.slug) {
        throw new Error("Story slug must match its reviewed filename");
      }
      const folder = `../../assets/events/${story.occasion}/${story.slug}/`;
      const photos = story.images.map((file) => {
        if (!file.startsWith(folder)) {
          throw new Error("Story photo must belong to the matching event folder");
        }
        const photo = photosByFile[file];
        if (!photo) throw new Error("Missing individually approved story photo: " + file);
        const entry = mediaEntrySchema.parse(photo.entry);
        if (entry.file !== file || entry.category !== story.occasion) {
          throw new Error("Story image and permission record must match the exact file");
        }
        if (
          !photo.image ||
          typeof photo.image.src !== "string" ||
          !Number.isSafeInteger(photo.image.width) ||
          photo.image.width <= 0 ||
          !Number.isSafeInteger(photo.image.height) ||
          photo.image.height <= 0
        ) {
          throw new Error("Invalid approved story image metadata");
        }
        return photo;
      });
      return { ...story, photos };
    });
}

const sources = import.meta.glob("../../content/stories/*.json", {
  eager: true,
  import: "default",
});

export const publishedStories = buildPublishedStories(sources, approvedEventPhotos);
