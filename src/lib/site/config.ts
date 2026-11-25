import { previewNoticeMode } from "./release";

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
  // Owner-supplied 18 November 2026: open all seven days.
  hours: "every day, 9:00 am to 12:00 midnight",
  // Owner/Founder's personal number, published at his own direction. 9966973113 is the business line.
  founder: {
    name: "Mohammed Ather Khan",
    role: "Owner and Founder",
    phone: "+918686773095",
    phoneDisplay: "+91 86867 73095",
  },
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

/** Owner-gated display state; independent of indexing and live intake. Defaults to preview. */
export const PREVIEW_NOTICE = previewNoticeMode({
  publicRelease: env("PUBLIC_SITE_RELEASED"),
  enquiriesEnabled: env("PUBLIC_ENQUIRIES_ENABLED"),
  turnstileSiteKey: env("PUBLIC_TURNSTILE_SITE_KEY"),
});

/** Existing approved single-colour logo, on the site's dark ground. */
export const SOCIAL_IMAGE = {
  url: new URL("/social/twn-brand.png", SITE.url).toString(),
  width: 1200,
  height: 630,
  alt: "The Wedding Nest — official logo",
} as const;

export function pageTitle(page?: string): string {
  return page ? `${page} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
}

/** Minimal, owner-verified Organization data. Ratings and
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
    founder: { "@type": "Person", name: SITE.founder.name, telephone: SITE.founder.phone },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "00:00",
    },
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

/**
 * Service structured data for an owner-approved service page. Only facts already on the approved
 * page are used (name, description, URL, provider, the Hyderabad area): no price, rating, review,
 * availability or offer is ever generated.
 */
export function serviceJsonLd(page: { title: string; description: string }, path: string): string {
  const url = canonicalUrl(path);
  const facts = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: page.title,
    description: page.description,
    url,
    provider: { "@id": `${SITE.url}/#organization` },
    areaServed: { "@type": "AdministrativeArea", name: SITE.region },
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
