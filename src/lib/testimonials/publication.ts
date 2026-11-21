/**
 * Zero testimonials by default. A quotation is published only from an owner-approved record that
 * carries an opaque pointer to private permission evidence (never evidence by itself). No star
 * ratings, review counts or scraped Google review text exist in this model by design; see
 * docs/customer-testimonials.md.
 */
import { z } from "astro/zod";

const SOURCE_PATH = /^\.\.\/\.\.\/content\/testimonials\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/;

export const TESTIMONIAL_SOURCES = [
  "written-by-client",
  "google-review-with-permission",
  "video-transcript-approved",
] as const;

export const testimonialSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    quote: z.string().min(40).max(600),
    attribution: z.string().min(3).max(80),
    source: z.enum(TESTIMONIAL_SOURCES),
    publicationApproved: z.literal(true),
    approvalRef: z.string().regex(/^TWN-QUOTE-20\d{2}-[A-Z0-9]{4,10}$/),
  })
  .strict();

export type ApprovedTestimonial = z.infer<typeof testimonialSchema>;

/** Any invalid or mismatched record fails the build instead of publishing plausible praise. */
export function buildPublishedTestimonials(
  sources: Record<string, unknown>,
): ApprovedTestimonial[] {
  const seen = new Set<string>();
  return Object.entries(sources)
    .map(([path, raw]) => {
      const filename = SOURCE_PATH.exec(path)?.[1];
      if (!filename) throw new Error("Invalid testimonial filename");
      const item = testimonialSchema.parse(raw);
      if (filename !== item.id) throw new Error("Testimonial id must match its reviewed filename");
      if (seen.has(item.id)) throw new Error("Duplicate testimonial id");
      seen.add(item.id);
      return item;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

const sources = import.meta.glob("../../content/testimonials/*.json", {
  eager: true,
  import: "default",
});

export const publishedTestimonials = buildPublishedTestimonials(sources);
