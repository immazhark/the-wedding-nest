/**
 * Verified public facts only, as supplied by the owner. Opening days, service coverage and
 * any legal name stay absent until approved (see docs/full-project-handover.md §8).
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
  facebook: "https://www.facebook.com/twn.events",
  // Supplied by the business owner on 18 November 2026. Studio address and hours remain unapproved.
  phone: "+919966973113",
  phoneDisplay: "+91 99669 73113",
  email: "theweddingnest.events@gmail.com",
  // WhatsApp is the same number as the phone.
  whatsapp: "https://wa.me/919966973113",
  address: {
    street: "12-2-1/D/68, Zeba Bagh, Asif Nagar",
    locality: "Hyderabad",
    region: "Telangana",
    postalCode: "500028",
  },
  // Owner-supplied; days of the week were not specified, so none are claimed.
  hours: "9:00 am to 12:00 midnight",
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

/** Minimal, owner-verified Organization data. Ratings, opening hours and
 * service-specific LocalBusiness claims stay absent until explicitly approved.
 * Escaping '<' makes the generated JSON safe for an inline JSON-LD script.
 */
export function organizationJsonLd(): string {
  const facts = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    telephone: SITE.phone,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: "IN",
    },
    sameAs: [SITE.instagram, SITE.facebook],
  };
  return JSON.stringify(facts).replace(/</g, "\\u003c");
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
  { href: "/#services", label: "Services" },
  { href: "/#occasions", label: "Occasions" },
  { href: "/#approach", label: "Approach" },
  { href: "/plan-your-event/", label: "Plan your event" },
] as const;
