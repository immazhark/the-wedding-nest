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

export const mediaEntrySchema = z.object({
  file: z.string().min(1),
  alt: z.string().min(8, "Describe what is actually in the photo"),
  category: z.enum(MEDIA_CATEGORIES),
  focal: z.enum(FOCAL_POINTS).default("center"),
  orientation: z.enum(["portrait", "landscape", "square"]),
  caption: z.string().optional(),
  credit: z.string().optional(),
  /** Families and photographer agreed to publication. Anything but `true` is rejected. */
  permission: z.literal(true),
});
export type MediaEntry = z.infer<typeof mediaEntrySchema>;

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
