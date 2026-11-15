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
} as const;

/**
 * Indexing stays off for every build until an approved production launch sets
 * PUBLIC_ALLOW_INDEXING=true in the production build environment.
 */
export const ALLOW_INDEXING =
  (import.meta.env?.PUBLIC_ALLOW_INDEXING ??
    (typeof process !== "undefined" ? process.env["PUBLIC_ALLOW_INDEXING"] : undefined)) === "true";

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
  { href: "/#services", label: "Services" },
  { href: "/#occasions", label: "Occasions" },
  { href: "/#approach", label: "Approach" },
  { href: "/plan-your-event/", label: "Plan your event" },
] as const;
