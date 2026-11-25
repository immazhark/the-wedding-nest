/**
 * Which approved photographs and films accompany which approved service page. A page only shows
 * media that appears in the reviewed manifests (exact local files with a release reference); a
 * service without an entry here is simply typographic.
 *
 * Catering is art-directed as a sequence (crisp opening, one detail photograph per menu in menu
 * order, a dessert moment, the team). Every other service is a gallery: one wide opening
 * photograph, then a lightbox mosaic that lets visitors explore the work before any planning.
 */
import { approvedEventPhotos, type ApprovedPhoto } from "../media/catalog";

const ev = "../../assets/events/";

export interface ServiceFilm {
  src: string;
  poster: string;
  width: number;
  height: number;
  eyebrow: string;
  heading: string;
  caption: string;
  /** Accessible name of the (silent) film. */
  label: string;
}

/**
 * Each service keeps the shared, accessible gallery machinery but has its own composition, so the
 * pages are not one recipe repeated: how the page opens, the tone of the gallery chapter, and how
 * the photographs are laid out.
 */
export interface ServiceLook {
  /** "split": copy beside a crisp photograph. "full": a full-bleed cinematic opening. */
  hero: "split" | "full";
  /** Tone of the gallery chapter: dark kohl, ivory paper, or warm saffron paper. */
  tone: "dark" | "ivory" | "saffron";
  /** "mosaic": three columns. "duo": two large columns. "editorial": rows of fixed proportions. "rail": one row. */
  gallery: "mosaic" | "duo" | "editorial" | "rail";
}
export const DEFAULT_LOOK: ServiceLook = { hero: "split", tone: "dark", gallery: "mosaic" };

export interface ServicePhotos {
  hero?: ApprovedPhoto;
  /** One per menu card, in menu order; a missing approval leaves that card typographic. */
  menus: (ApprovedPhoto | undefined)[];
  dessert?: ApprovedPhoto;
  team?: ApprovedPhoto;
  /** The explorable showcase, in display order. */
  gallery: ApprovedPhoto[];
  film?: ServiceFilm;
  look: ServiceLook;
}

interface Source {
  hero: string;
  menus?: readonly string[];
  dessert?: string;
  team?: string;
  gallery?: readonly string[];
  film?: ServiceFilm;
  look?: ServiceLook;
}

const SOURCES: Record<string, Source> = {
  "hyderabadi-wedding-catering": {
    hero: `${ev}catering/hero-biryani-hall/01-biryani-hall-banner.jpg`,
    menus: [
      `${ev}catering/menu-deccani-platter/01-rolls-platter.jpg`,
      `${ev}catering/menu-nawabi-biryani/01-biryani-with-menu-stand.jpg`,
      `${ev}catering/menu-daawat-grill/01-grilled-chicken-platter.jpg`,
      `${ev}catering/menu-shahi-haleem/01-haleem-cashew-topping.jpg`,
    ],
    dessert: `${ev}catering/dessert-saffron-bowl/01-saffron-dessert-almonds.jpg`,
    team: `${ev}catering/service-team/01-service-team-with-banner.jpg`,
    film: {
      src: "/media/catering-pot-to-plate.mp4",
      poster: "/media/catering-pot-to-plate-poster.jpg",
      width: 720,
      height: 960,
      eyebrow: "In the kitchen",
      heading: "From the pot to the plate.",
      caption: "Preparation and plating, filmed in a Wedding Nest catering kitchen.",
      label:
        "A cook ladles curry from a large pot and plates it onto a foil platter of shredded cabbage",
    },
  },
  "nikah-decoration-hyderabad": {
    look: { hero: "full", tone: "dark", gallery: "editorial" },
    hero: `${ev}decor/stage-cream-florals/01-stage-wide-cream-florals.jpg`,
    gallery: [
      `${ev}decor/stage-cream-florals/02-stage-sofas-close.jpg`,
      `${ev}decor/marigold-jasmine-backdrop/02-marigold-backdrop-front.jpg`,
      `${ev}decor/marigold-jasmine-backdrop/03-marigold-backdrop-angle.jpg`,
      `${ev}decor/pink-gold-backdrop/01-pink-backdrop-sequin-drapes.jpg`,
      `${ev}decor/bridal-room-petals/01-bed-rose-petals.jpg`,
      `${ev}decor/garden-night-seating/01-string-lights-seating.jpg`,
      `${ev}decor/doorway-garlands/01-flower-garland-doorway.jpg`,
      `${ev}decor/hall-stage-decor/02-stage-seating.jpg`,
    ],
  },
  "mehndi-artist-hyderabad": {
    look: { hero: "split", tone: "saffron", gallery: "duo" },
    hero: `${ev}mehndi/mehndi-hands/01-mehndi-hands-gathering.jpg`,
    gallery: [
      `${ev}mehndi/henna-detail/01-henna-forearms-hands.jpg`,
      `${ev}mehndi/mehndi-hands-vertical/01-henna-hands-portrait.jpg`,
      `${ev}mehndi/mehndi-seating/01-mehndi-seating-detail.jpg`,
      `${ev}mehndi/henna-cones/01-henna-cone-fan.jpg`,
      `${ev}mehndi/henna-detail/02-henna-open-palms.jpg`,
      `${ev}celebrations/couple-garlands/01-couple-holding-hands.jpg`,
    ],
  },
  "trousseau-packing-hyderabad": {
    look: { hero: "split", tone: "ivory", gallery: "mosaic" },
    hero: `${ev}details/trousseau-trays/00-trays-overview.jpg`,
    gallery: [
      `${ev}details/trousseau-baskets/01-tulle-wrapped-basket.jpg`,
      `${ev}details/trousseau-trays/01-gold-tray-red-rose.jpg`,
      `${ev}details/trousseau-baskets/04-suitcases-tulle-ribbon.jpg`,
      `${ev}details/trousseau-trays/02-maroon-outfit-display.jpg`,
      `${ev}details/trousseau-trays/03-compartment-boxes.jpg`,
      `${ev}details/trousseau-trays/04-blue-outfit-and-shoes.jpg`,
      `${ev}details/gift-packaging/01-gift-bag-box-card.jpg`,
      `${ev}details/trousseau-trays/05-shoes-and-handbag-tray.jpg`,
      `${ev}details/trousseau-baskets/03-wrapped-shoes-basket.jpg`,
      `${ev}details/gift-packaging/03-satin-potli-pouches.jpg`,
      `${ev}details/trousseau-baskets/02-wrapped-clutches-laid-out.jpg`,
      `${ev}details/trousseau-trays/06-beauty-gift-tray.jpg`,
      `${ev}details/gift-packaging/02-outfit-stand-presentation.jpg`,
      `${ev}details/gift-box-ribbon/01-gold-gift-box-ribbon.jpg`,
    ],
    film: {
      src: "/media/trousseau-packing.mp4",
      poster: "/media/trousseau-packing-poster.jpg",
      width: 540,
      height: 720,
      eyebrow: "The finishing",
      heading: "Packed with care.",
      caption: "Wrapped suitcases and gift boxes, tied with ribbon, tulle and flowers.",
      label: "Suitcases and gold-wrapped gift boxes tied with red ribbon, cream tulle and roses",
    },
  },
  "guest-hospitality-hyderabad": {
    look: { hero: "full", tone: "dark", gallery: "rail" },
    hero: `${ev}celebrations/banquet-table/01-long-banquet-table.jpg`,
    gallery: [
      `${ev}celebrations/table-settings/02-napkin-and-bowl-portrait.jpg`,
      `${ev}celebrations/table-settings/01-long-table-shallow-focus.jpg`,
      `${ev}celebrations/table-settings/04-gold-rim-bowl.jpg`,
      `${ev}celebrations/table-settings/06-round-table-layout.jpg`,
      `${ev}celebrations/table-settings/03-vase-and-basket-portrait.jpg`,
      `${ev}catering/table-setting-gold/01-gold-runner-place-settings.jpg`,
      `${ev}celebrations/table-settings/05-hall-bowl-portrait.jpg`,
    ],
  },
};

const pick = (files: readonly string[] = []) =>
  files.flatMap((file) => {
    const photo = approvedEventPhotos[file];
    return photo ? [photo] : [];
  });

/** Every manifest file a service page asks for (a test uses this to catch typos). */
export function requestedFiles(slug: string): string[] {
  const s = SOURCES[slug];
  if (!s) return [];
  return [s.hero, ...(s.menus ?? []), s.dessert, s.team, ...(s.gallery ?? [])].filter(
    (f): f is string => Boolean(f),
  );
}
export const SERVICE_MEDIA_SLUGS = Object.keys(SOURCES);

export function servicePhotos(slug: string): ServicePhotos {
  const s = SOURCES[slug];
  if (!s) return { menus: [], gallery: [], look: DEFAULT_LOOK };
  const hero = approvedEventPhotos[s.hero];
  const dessert = s.dessert ? approvedEventPhotos[s.dessert] : undefined;
  const team = s.team ? approvedEventPhotos[s.team] : undefined;
  return {
    ...(hero ? { hero } : {}),
    menus: (s.menus ?? []).map((file) => approvedEventPhotos[file]),
    ...(dessert ? { dessert } : {}),
    ...(team ? { team } : {}),
    gallery: pick(s.gallery),
    ...(s.film ? { film: s.film } : {}),
    look: s.look ?? DEFAULT_LOOK,
  };
}
