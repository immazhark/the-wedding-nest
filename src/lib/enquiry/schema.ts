/**
 * Plan Your Event — typed question tree.
 *
 * Options describe what a visitor may *ask about*; listing an option is not a promise
 * that The Wedding Nest provides it. Labels are draft copy pending owner approval.
 */

export const STAGES = [
  { id: "occasion", title: "Occasion", prompt: "What are you celebrating?" },
  { id: "scope", title: "Scope", prompt: "How can we help?" },
  { id: "style", title: "Style", prompt: "Which mood feels closest?" },
  { id: "logistics", title: "Details", prompt: "When, where and how many?" },
  { id: "contact", title: "Contact", prompt: "How should we reach you?" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export const OCCASIONS = [
  { id: "nikah", label: "Nikah", group: "wedding" },
  { id: "walima", label: "Walima", group: "wedding" },
  { id: "mehndi", label: "Mehndi", group: "wedding" },
  { id: "shaadi", label: "Shaadi / Wedding", group: "wedding" },
  { id: "engagement", label: "Engagement", group: "wedding" },
  { id: "reception", label: "Reception", group: "wedding" },
  { id: "sangeet", label: "Sangeet", group: "wedding" },
  { id: "birthday", label: "Birthday", group: "celebration" },
  { id: "anniversary", label: "Anniversary", group: "celebration" },
  { id: "corporate", label: "Corporate event", group: "celebration" },
  { id: "private", label: "Private gathering", group: "celebration" },
  { id: "other", label: "Something else", group: "celebration" },
] as const;

export type OccasionId = (typeof OCCASIONS)[number]["id"];

export const SCOPES = [
  {
    id: "full-planning",
    label: "End-to-end planning",
    hint: "One team to shape and coordinate the whole occasion.",
  },
  {
    id: "specific-services",
    label: "Specific services",
    hint: "Help with particular parts, such as catering or décor.",
  },
] as const;

export type ScopeId = (typeof SCOPES)[number]["id"];

type ServiceDef = {
  id: string;
  label: string;
  /** If set, only shown when at least one of these occasions is selected. */
  onlyFor?: readonly OccasionId[];
};

export const SERVICES = [
  { id: "catering", label: "Catering & menus" },
  { id: "decor", label: "Décor, florals & staging" },
  { id: "hospitality", label: "Guest hospitality" },
  { id: "venue-coordination", label: "Venue coordination" },
  { id: "photo-film", label: "Photography & film" },
  { id: "makeup", label: "Makeup & beauty" },
  { id: "transport", label: "Cars & guest transport" },
  { id: "invitations", label: "Invitations & stationery" },
  { id: "gifting", label: "Gifts, favours & trousseau packing" },
  {
    id: "ceremony-coordination",
    label: "Ceremony coordination",
    onlyFor: ["nikah", "shaadi", "engagement", "walima", "reception", "sangeet"],
  },
  { id: "mehndi-artist", label: "Mehndi artist", onlyFor: ["mehndi", "shaadi", "sangeet"] },
  {
    id: "av-production",
    label: "Sound, lighting & AV",
    onlyFor: ["corporate", "sangeet", "reception", "private", "birthday", "anniversary"],
  },
] as const satisfies readonly ServiceDef[];

export type ServiceId = (typeof SERVICES)[number]["id"];

export const STYLES = [
  { id: "heritage", label: "Hyderabadi heritage", hint: "Rich textiles, brass, deep jewel tones" },
  { id: "garden", label: "Garden & floral", hint: "Open air, soft greens, abundant flowers" },
  { id: "minimal", label: "Modern minimal", hint: "Clean lines, ivory, quiet luxury" },
  { id: "grand", label: "Grand & opulent", hint: "Scale, chandeliers, dramatic staging" },
  { id: "intimate", label: "Intimate & personal", hint: "Smaller guest lists, warm details" },
] as const;

export type StyleId = (typeof STYLES)[number]["id"];

export const BUDGETS = [
  { id: "under-5l", label: "Under ₹5 lakh" },
  { id: "5-15l", label: "₹5–15 lakh" },
  { id: "15-30l", label: "₹15–30 lakh" },
  { id: "30l-plus", label: "₹30 lakh +" },
  { id: "discuss", label: "Prefer to discuss" },
] as const;

export type BudgetId = (typeof BUDGETS)[number]["id"];

export const CONTACT_CHANNELS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "call", label: "Phone call" },
] as const;

export type ContactChannelId = (typeof CONTACT_CHANNELS)[number]["id"];

export type EventDate = { kind: "date"; value: string } | { kind: "undecided" };

export type EnquiryState = {
  occasions: OccasionId[];
  scope: ScopeId | null;
  services: ServiceId[];
  styles: StyleId[];
  date: EventDate;
  /** Kept as text so the field is a plain editable input, not a slider. */
  guestCount: string;
  location: string;
  budget: BudgetId | null;
  notes: string;
  name: string;
  phone: string;
  contactChannel: ContactChannelId;
  consent: boolean;
  marketingConsent: boolean;
};

export const emptyEnquiry = (): EnquiryState => ({
  occasions: [],
  scope: null,
  services: [],
  styles: [],
  date: { kind: "undecided" },
  guestCount: "",
  location: "",
  budget: null,
  notes: "",
  name: "",
  phone: "",
  contactChannel: "whatsapp",
  consent: false,
  marketingConsent: false,
});

/** Services relevant to the selected occasions (conditional branching). */
export function serviceOptionsFor(occasions: readonly OccasionId[]) {
  return SERVICES.filter(
    (s: ServiceDef) => !s.onlyFor || s.onlyFor.some((o) => occasions.includes(o)),
  );
}

export const isOneOf = <T extends { id: string }>(
  list: readonly T[],
  value: unknown,
): value is T["id"] => typeof value === "string" && list.some((item) => item.id === value);
