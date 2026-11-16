/**
 * Authentic event media: manifest schema and frame helpers.
 * Every published photograph must carry explicit permission (see docs/photography-brief.md).
 */
import { z } from "astro/zod";

export const MEDIA_CATEGORIES = [
  "nikah",
  "walima",
  "mehndi",
  "shaadi",
  "engagement",
  "reception",
  "sangeet",
  "celebrations",
  "corporate",
  "catering",
  "decor",
  "details",
] as const;

export const FOCAL_POINTS = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
export type Focal = (typeof FOCAL_POINTS)[number];

// Keep event photos inside the repository's reviewed media directory.
// This rejects remote URLs, path traversal, query strings and active SVG content.
const EVENT_FILE =
  /^\.\.\/\.\.\/assets\/events\/([a-z]+)\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpe?g|png|webp|avif)$/;

export const mediaEntrySchema = z
  .object({
    file: z.string().regex(EVENT_FILE, "Use a local image in assets/events/<category>/<event>/"),
    alt: z.string().min(8, "Describe what is actually in the photo"),
    category: z.enum(MEDIA_CATEGORIES),
    focal: z.enum(FOCAL_POINTS).default("center"),
    orientation: z.enum(["portrait", "landscape", "square"]),
    caption: z.string().optional(),
    credit: z.string().optional(),
    /** Families and photographer agreed to publication. Anything but `true` is rejected. */
    permission: z.literal(true),
    /** Opaque pointer to a private, independently checked permission record. Never a name or URL. */
    releaseRef: z
      .string()
      .regex(/^TWN-REL-20\d{2}-[A-Z0-9]{4,10}$/, "Use an opaque TWN release reference"),
  })
  .superRefine((entry, context) => {
    const categoryFolder = EVENT_FILE.exec(entry.file)?.[1];
    if (categoryFolder !== entry.category) {
      context.addIssue({
        code: "custom",
        path: ["file"],
        message: "The asset folder must match the declared event category",
      });
    }
  });
export type MediaEntry = z.infer<typeof mediaEntrySchema>;

/** Reject duplicated photos before an editor assembles an approved portfolio. */
export const mediaManifestSchema = z
  .object({ images: z.array(mediaEntrySchema) })
  .superRefine((manifest, context) => {
    const seen = new Set<string>();
    manifest.images.forEach((entry, index) => {
      if (seen.has(entry.file))
        context.addIssue({
          code: "custom",
          path: ["images", index, "file"],
          message: "Duplicate photograph in media manifest",
        });
      seen.add(entry.file);
    });
  });

/** Every image rendered by Frame must carry the validated publication declaration. */
export function publishedMediaForFrame(hasImage: boolean, entry: unknown): MediaEntry | undefined {
  return hasImage ? mediaEntrySchema.parse(entry) : undefined;
}

/** Supported frame ratios (width / height). Layouts choose by the photograph, not one crop. */
export const RATIOS = {
  portrait: "aspect-[4/5]",
  tall: "aspect-[3/4]",
  square: "aspect-square",
  landscape: "aspect-[3/2]",
  panorama: "aspect-[21/9]",
} as const;
export type Ratio = keyof typeof RATIOS;

// Literal class names so Tailwind generates them.
const FOCAL_CLASSES: Record<Focal, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
  "top-left": "object-left-top",
  "top-right": "object-right-top",
  "bottom-left": "object-left-bottom",
  "bottom-right": "object-right-bottom",
};

export const focalClass = (focal: Focal) => FOCAL_CLASSES[focal];
