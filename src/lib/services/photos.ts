/**
 * Which approved photographs accompany which approved service page. A page only shows photographs
 * that appear in the reviewed media manifests (exact local files with a release reference); a
 * service without an entry here is simply typographic.
 *
 * Catering is art-directed as a sequence: a crisp opening, one detail photograph per menu (in menu
 * order, so each menu card is paired with a picture), a dessert moment, and the team.
 */
import { approvedEventPhotos, type ApprovedPhoto } from "../media/catalog";

const dir = "../../assets/events/catering/";
const CATERING = {
  hero: `${dir}hero-biryani-hall/01-biryani-hall-banner.jpg`,
  menus: [
    `${dir}menu-deccani-platter/01-rolls-platter.jpg`,
    `${dir}menu-nawabi-biryani/01-biryani-with-menu-stand.jpg`,
    `${dir}menu-daawat-grill/01-grilled-chicken-platter.jpg`,
    `${dir}menu-shahi-haleem/01-haleem-cashew-topping.jpg`,
  ],
  dessert: `${dir}dessert-saffron-bowl/01-saffron-dessert-almonds.jpg`,
  team: `${dir}service-team/01-service-team-with-banner.jpg`,
} as const;

export interface ServicePhotos {
  hero?: ApprovedPhoto;
  /** One per menu card, in menu order; a missing approval leaves that card typographic. */
  menus: (ApprovedPhoto | undefined)[];
  dessert?: ApprovedPhoto;
  team?: ApprovedPhoto;
}

export function servicePhotos(slug: string): ServicePhotos {
  if (slug !== "hyderabadi-wedding-catering") return { menus: [] };
  const hero = approvedEventPhotos[CATERING.hero];
  const dessert = approvedEventPhotos[CATERING.dessert];
  const team = approvedEventPhotos[CATERING.team];
  return {
    ...(hero ? { hero } : {}),
    menus: CATERING.menus.map((file) => approvedEventPhotos[file]),
    ...(dessert ? { dessert } : {}),
    ...(team ? { team } : {}),
  };
}
