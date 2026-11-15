/**
 * Occasion and service page content. EDITORIAL WORKING DRAFT — owner approval required.
 * Describes traditions in general terms and what visitors can ask about; makes no claims about
 * clients, capacity, prices or guarantees (docs/creative-excellence-standards.md).
 */
import type { OccasionId, ServiceId } from "../enquiry/schema";
import type { MEDIA_CATEGORIES } from "../media/schema";

/** Plain descriptions of each tradition (general cultural meaning, not claims about TWN). */
export const OCCASION_NOTES: Record<OccasionId, string> = {
  nikah: "The marriage ceremony",
  walima: "The reception hosted by the groom’s family",
  mehndi: "The henna evening",
  shaadi: "The wedding day itself",
  engagement: "Often the first time both families gather",
  reception: "The celebration after the ceremony",
  sangeet: "An evening of music and dance",
  birthday: "From a first birthday to a milestone one",
  anniversary: "A marriage, marked with the people who were there",
  corporate: "Launches, dinners and company gatherings",
  private: "A family occasion that doesn’t fit a category",
  other: "Tell us what you have in mind",
};

export type OccasionPage = {
  slug: string;
  nav: string;
  /** Used in "Tell us about your …". */
  ctaNoun: string;
  title: string;
  description: string;
  eyebrow: string;
  /** Composed headline lines; the last one is set in italic. */
  headline: [string, string];
  lede: string;
  occasions: readonly OccasionId[];
  /** Topics the first conversation usually covers (process, not promises). */
  conversation: { title: string; text: string }[];
  photo: string;
  testimonialCategories: readonly (typeof MEDIA_CATEGORIES)[number][];
};

export const OCCASION_PAGES: OccasionPage[] = [
  {
    slug: "nikah-and-walima",
    nav: "Nikah & Walima",
    ctaNoun: "Nikah and Walima",
    title: "Nikah and Walima in Hyderabad",
    description:
      "Planning a Nikah, Walima and Mehndi in Hyderabad — the whole sequence of days, or the parts you need help with.",
    eyebrow: "Nikah · Walima · Mehndi",
    headline: ["Three days, one family,", "one team."],
    lede: "A Hyderabadi wedding rarely happens in a single evening. We plan the Nikah, the Walima and the days around them as one sequence, or only the parts you’d like to hand over.",
    occasions: ["nikah", "walima", "mehndi"],
    conversation: [
      {
        title: "Each day, separately",
        text: "Guest numbers, venues and timings often differ from the Mehndi to the Walima. We look at each one on its own terms.",
      },
      {
        title: "Your family’s customs",
        text: "Every family keeps traditions differently. We ask how yours does things, rather than assume.",
      },
      {
        title: "Food for every event",
        text: "Menus for each day, planned around your guests and the hosts on each side.",
      },
    ],
    photo: "A Nikah or Walima stage from a TWN event",
    testimonialCategories: ["nikah", "walima", "mehndi"],
  },
  {
    slug: "weddings",
    nav: "Weddings",
    ctaNoun: "wedding",
    title: "Weddings in Hyderabad",
    description:
      "Weddings, engagements, receptions, Sangeet and Mehndi in Hyderabad — planned in full or in part, for families from every community.",
    eyebrow: "Weddings",
    headline: ["From the engagement", "to the last dance."],
    lede: "Engagements, Sangeet, Mehndi, the wedding day and the reception — for families from every community, planned as a whole or one event at a time.",
    occasions: ["engagement", "sangeet", "mehndi", "shaadi", "reception"],
    conversation: [
      {
        title: "How many events",
        text: "Some families hold five functions, some hold one. We start with the shape of your celebration, not a package.",
      },
      {
        title: "Who is involved",
        text: "Both families, often across cities. We agree early who decides what, so plans don’t stall.",
      },
      {
        title: "What you already have",
        text: "If you’ve booked a venue, a caterer or a photographer, we plan around them.",
      },
    ],
    photo: "A wide moment from a TWN wedding",
    testimonialCategories: ["shaadi", "engagement", "reception", "sangeet", "mehndi"],
  },
  {
    slug: "celebrations",
    nav: "Celebrations",
    ctaNoun: "celebration",
    title: "Celebrations and events in Hyderabad",
    description:
      "Birthdays, anniversaries, corporate evenings and private gatherings in Hyderabad, planned with the same care as a wedding.",
    eyebrow: "Celebrations",
    headline: ["Not every occasion", "is a wedding."],
    lede: "Birthdays, anniversaries, company evenings and family gatherings get the same attention to food, setting and guests.",
    occasions: ["birthday", "anniversary", "corporate", "private"],
    conversation: [
      {
        title: "The guests",
        text: "Who is coming, and what the evening should feel like for them.",
      },
      {
        title: "The setting",
        text: "At home, at a venue or somewhere new. Each changes what needs planning.",
      },
      {
        title: "The scale",
        text: "An intimate dinner and a large gathering need different things. We’ll ask, not assume.",
      },
    ],
    photo: "A celebration or corporate evening from a TWN event",
    testimonialCategories: ["celebrations", "corporate"],
  },
];

/** What a visitor can ask about for each core service (no promises of availability). */
export const SERVICE_NOTES: Partial<Record<ServiceId, string>> = {
  catering: "Menus planned around each event, your guests and your family’s preferences.",
  decor: "Stage, florals, lighting and the look of each space.",
  hospitality: "Looking after guests on the day: welcome, seating and the small things.",
  "venue-coordination": "Working with your venue on timings, layout and the running of each event.",
  "photo-film": "Photographers and filmmakers to record each event.",
  makeup: "Makeup and styling for the bride and the family.",
  transport: "Cars for the couple and transport for guests.",
  invitations: "Invitation cards and stationery for each event.",
  gifting: "Favours, gifts and trousseau packing.",
};
