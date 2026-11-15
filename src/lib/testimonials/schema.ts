/**
 * Real client testimonials only (docs/customer-testimonials.md). Every entry needs explicit
 * permission; consent records themselves stay outside the repository. There is deliberately
 * no field for star ratings or review counts.
 */
import { z } from "astro/zod";
import { MEDIA_CATEGORIES } from "../media/schema";

const common = {
  /** How the person agreed to be named, rendered exactly as given. */
  attribution: z.string().min(2),
  attributionStyle: z.enum(["full-name", "first-name-initial", "initials", "role"]),
  /** Only when the event association is verified. */
  eventCategory: z.enum(MEDIA_CATEGORIES).optional(),
  order: z.number().int().optional(),
  permission: z.literal(true),
};

const quote = z
  .object({
    kind: z.literal("quote"),
    source: z.enum(["google", "direct", "instagram"]),
    sourceUrl: z.url().optional(),
    /** Faithful wording; excerpts must not change the meaning. */
    text: z.string().min(20).max(600),
    ...common,
  })
  .refine((q) => q.source === "direct" || !!q.sourceUrl, {
    message: "Google and Instagram testimonials must link to their source",
    path: ["sourceUrl"],
  });

const video = z.object({
  kind: z.literal("video"),
  source: z.enum(["direct", "instagram"]),
  sourceUrl: z.url().optional(),
  title: z.string().min(4),
  video: z.object({
    src: z.string().min(1),
    poster: z.string().min(1),
    /** WebVTT captions are mandatory. */
    captions: z.string().min(1),
    durationSeconds: z.number().positive(),
  }),
  transcript: z.string().min(10),
  ...common,
});

export const testimonialSchema = z.union([quote, video]);
export type Testimonial = z.infer<typeof testimonialSchema>;

/** Validated, permitted entries in display order; anything else is dropped. */
export function publishable(entries: unknown[]): Testimonial[] {
  return entries
    .map((e) => testimonialSchema.safeParse(e))
    .flatMap((r) => (r.success ? [r.data] : []))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
