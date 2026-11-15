/**
 * Verified public facts only. Phone, WhatsApp, email and address are intentionally absent
 * until the business approves them (see docs/full-project-handover.md §8).
 */
export const SITE = {
  name: "The Wedding Nest",
  url: "https://theweddingnest.in",
  tagline: "Weddings & celebrations in Hyderabad",
  description:
    "The Wedding Nest plans and styles weddings and celebrations in Hyderabad — from Nikah, Walima and Mehndi to engagements, receptions and private events.",
  locale: "en_IN",
  region: "Hyderabad, Telangana",
  instagram: "https://www.instagram.com/twn.events/",
  /**
   * Public Google Business listing, as supplied by the owner in the project handover.
   * Linked only — reviews are never copied, cached or scraped (docs/customer-testimonials.md).
   * TODO before launch: confirm it matches the owner's share link https://share.google/aS1MwFrsfwp8ES0Js.
   */
  googleReviews:
    "https://www.google.com/maps/place/The+Wedding+Nest/@17.3898158,78.4490999,106m/data=!3m1!1e3!4m6!3m5!1s0x3bcb9722d0819949:0xfffaa57907d4043d!8m2!3d17.390032!4d78.4492282!16s%2Fg%2F11y9zgk97t",
} as const;

/**
 * Indexing stays off for every build until an approved production launch sets
 * PUBLIC_ALLOW_INDEXING=true in the production build environment.
 */
export const ALLOW_INDEXING =
  (import.meta.env?.PUBLIC_ALLOW_INDEXING ??
    (typeof process !== "undefined" ? process.env["PUBLIC_ALLOW_INDEXING"] : undefined)) === "true";

const env = (name: string): string | undefined =>
  (import.meta.env?.[name] as string | undefined) ??
  (typeof process !== "undefined" ? process.env[name] : undefined);

/** Live enquiry submission. Owner-gated: production builds leave this off. */
export const ENQUIRIES = {
  enabled: env("PUBLIC_ENQUIRIES_ENABLED") === "true",
  turnstileSiteKey: env("PUBLIC_TURNSTILE_SITE_KEY") ?? "",
} as const;

export function pageTitle(page?: string): string {
  return page ? `${page} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
}

export function canonicalUrl(path: string): string {
  const url = new URL(path, SITE.url);
  url.search = "";
  url.hash = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url.toString();
}

export function robotsContent(indexable: boolean): string {
  return indexable ? "index, follow" : "noindex, nofollow";
}

export const NAV = [
  { href: "/services/", label: "Services" },
  { href: "/weddings/", label: "Weddings" },
  { href: "/nikah-and-walima/", label: "Nikah & Walima" },
  { href: "/celebrations/", label: "Celebrations" },
  { href: "/plan-your-event/", label: "Plan your event" },
] as const;
