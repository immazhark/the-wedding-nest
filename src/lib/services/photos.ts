/**
 * Which approved photographs accompany which approved service page. A page only shows photographs
 * that appear in the reviewed media manifests (exact local files with a release reference); a
 * service without an entry here is simply typographic.
 */
import { approvedEventPhotos, type ApprovedPhoto } from "../media/catalog";

const dir = "../../assets/events/catering/";
const CATERING = {
  hero: `${dir}menu-table-details/02-pineapple-dish.jpg`,
  strip: [
    `${dir}menu-table-details/01-savoury-bowl.jpg`,
    `${dir}menu-table-details/03-saffron-dessert-cup.jpg`,
    `${dir}menu-table-details/02-pineapple-dish.jpg`,
  ],
  portrait: `${dir}menu-table-details/04-white-dessert-glass.jpg`,
  team: `${dir}service-team/01-service-team-with-banner.jpg`,
} as const;

export interface ServicePhotos {
  hero?: ApprovedPhoto;
  strip: ApprovedPhoto[];
  portrait?: ApprovedPhoto;
  team?: ApprovedPhoto;
}

export function servicePhotos(slug: string): ServicePhotos {
  if (slug !== "hyderabadi-wedding-catering") return { strip: [] };
  const hero = approvedEventPhotos[CATERING.hero];
  const portrait = approvedEventPhotos[CATERING.portrait];
  const team = approvedEventPhotos[CATERING.team];
  return {
    ...(hero ? { hero } : {}),
    strip: CATERING.strip.flatMap((file) => {
      const photo = approvedEventPhotos[file];
      return photo ? [photo] : [];
    }),
    ...(portrait ? { portrait } : {}),
    ...(team ? { team } : {}),
  };
}
