/**
 * Public service pages are generated only from individually reviewed records.
 * This registry is a route allowlist, NOT a statement that TWN offers each service.
 * No source JSON records are bundled until the owner approves their exact copy.
 */
import { z } from "astro/zod";
import type { ServiceId } from "../enquiry/schema";

export const SERVICE_PAGE_SLUGS = [
  "nikah-decoration-hyderabad",
  "hyderabadi-wedding-catering",
  "wedding-photography-videography",
  "bridal-makeup-hyderabad",
  "mehndi-artist-hyderabad",
  "trousseau-packing-hyderabad",
  "wedding-cars-hyderabad",
  "guest-hospitality-hyderabad",
] as const;

const PLANNER_SERVICE: Record<(typeof SERVICE_PAGE_SLUGS)[number], ServiceId> = {
  "nikah-decoration-hyderabad": "decor",
  "hyderabadi-wedding-catering": "catering",
  "wedding-photography-videography": "photo-film",
  "bridal-makeup-hyderabad": "makeup",
  "mehndi-artist-hyderabad": "mehndi-artist",
  "trousseau-packing-hyderabad": "gifting",
  "wedding-cars-hyderabad": "transport",
  "guest-hospitality-hyderabad": "hospitality",
};

export const servicePageSchema = z
  .object({
    slug: z.enum(SERVICE_PAGE_SLUGS),
    publicationApproved: z.literal(true),
    /** Opaque private editorial sign-off, never customer details or a public URL. */
    approvalRef: z.string().regex(/^TWN-PUB-20\d{2}-[A-Z0-9]{4,10}$/),
    title: z.string().min(12).max(100),
    description: z.string().min(60).max(170),
    introduction: z.string().min(80).max(700),
    sections: z
      .array(
        z
          .object({
            title: z.string().min(8).max(80),
            body: z.string().min(70).max(600),
          })
          .strict(),
      )
      .min(2)
      .max(5),
  })
  .strict();

export type ApprovedServicePage = z.infer<typeof servicePageSchema> & {
  plannerService: ServiceId;
};

const SOURCE_PATH = /^\.\.\/\.\.\/content\/services\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/;

/**
 * Fail closed: unapproved, malformed or misnamed files break the build.
 * This is a technical declaration; human approval evidence is checked outside Git.
 */
export function buildPublishedServicePages(
  sources: Record<string, unknown>,
): ApprovedServicePage[] {
  return Object.entries(sources)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, raw]) => {
      const filename = SOURCE_PATH.exec(path)?.[1];
      if (!filename) throw new Error("Invalid service publication filename");
      const page = servicePageSchema.parse(raw);
      if (filename !== page.slug) {
        throw new Error("Service page slug must match its reviewed filename");
      }
      return { ...page, plannerService: PLANNER_SERVICE[page.slug] };
    });
}

const sources = import.meta.glob("../../content/services/*.json", {
  eager: true,
  import: "default",
});

export const publishedServicePages = buildPublishedServicePages(sources);

/** Prefer a published, verified detail page; otherwise retain the planner path. */
export function servicePageHref(service: ServiceId, pages: readonly ApprovedServicePage[]): string {
  const match = pages.find((page) => page.plannerService === service);
  return match ? `/services/${match.slug}/` : `/plan-your-event/?service=${service}`;
}
