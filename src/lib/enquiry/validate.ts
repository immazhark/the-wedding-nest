/**
 * Validation for enquiries. Accepts `unknown` so the same rules run on the server
 * (Worker, M2) against untrusted JSON; the browser UI is never the security boundary.
 */
import {
  BUDGETS,
  CONTACT_CHANNELS,
  OCCASIONS,
  SCOPES,
  STYLES,
  isOneOf,
  serviceOptionsFor,
  type EnquiryState,
  type EventDate,
  type OccasionId,
  type ServiceId,
  type StyleId,
} from "./schema";

export const LIMITS = {
  name: 100,
  phone: 24,
  location: 160,
  notes: 1500,
  maxGuests: 20000,
} as const;

export type ErrorCode =
  "required" | "invalid" | "too_long" | "not_available_for_occasion" | "consent_required";

export type ValidationResult =
  | { ok: true; value: EnquiryState }
  | { ok: false; errors: Partial<Record<keyof EnquiryState, ErrorCode>> };

// Digits with optional leading +, spaces, hyphens, brackets; 8–15 digits (E.164 max).
export function isValidPhone(raw: string): boolean {
  if (raw.length > LIMITS.phone || !/^\+?[\d\s\-()]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, "").length;
  return digits >= 8 && digits <= 15;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isValidGuestCount(raw: string): boolean {
  const t = raw.trim();
  if (!/^\d{1,6}$/.test(t)) return false;
  const n = Number(t);
  return n >= 1 && n <= LIMITS.maxGuests;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : null);
const arr = (v: unknown) => (Array.isArray(v) ? v : null);

export function validateEnquiry(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { occasions: "invalid" } };
  }
  const i = input as Record<string, unknown>;
  const errors: Partial<Record<keyof EnquiryState, ErrorCode>> = {};

  const occasionsRaw = arr(i["occasions"]);
  const occasions = (occasionsRaw ?? []).filter((o): o is OccasionId => isOneOf(OCCASIONS, o));
  if (!occasionsRaw || occasionsRaw.length === 0) errors.occasions = "required";
  else if (
    occasions.length !== occasionsRaw.length ||
    occasionsRaw.length > OCCASIONS.length ||
    new Set(occasions).size !== occasions.length
  )
    errors.occasions = "invalid";

  const scope = isOneOf(SCOPES, i["scope"]) ? i["scope"] : null;
  if (!scope) errors.scope = "required";

  const servicesRaw = arr(i["services"]) ?? [];
  const allowed = new Set<string>(serviceOptionsFor(occasions).map((s) => s.id));
  const services = servicesRaw.filter(
    (s): s is ServiceId => typeof s === "string" && allowed.has(s),
  );
  if (servicesRaw.length !== services.length) {
    errors.services = servicesRaw.every((s) => typeof s === "string")
      ? "not_available_for_occasion"
      : "invalid";
  } else if (new Set(services).size !== services.length) {
    errors.services = "invalid";
  } else if (scope === "full-planning" && services.length > 0) {
    // Hidden service choices must never become a silently persisted preference.
    errors.services = "invalid";
  } else if (scope === "specific-services" && services.length === 0) {
    errors.services = "required";
  }

  const stylesRaw = arr(i["styles"]) ?? [];
  const styles = stylesRaw.filter((s): s is StyleId => isOneOf(STYLES, s));
  if (styles.length !== stylesRaw.length || new Set(styles).size !== styles.length)
    errors.styles = "invalid";

  let date: EventDate = { kind: "undecided" };
  const d = i["date"] as Record<string, unknown> | undefined;
  if (d && typeof d === "object" && d["kind"] === "date") {
    const v = str(d["value"]);
    if (v && isValidDate(v)) date = { kind: "date", value: v };
    else errors.date = "invalid";
  } else if (!(d && typeof d === "object" && d["kind"] === "undecided")) errors.date = "invalid";

  const guestCount = str(i["guestCount"]) ?? "";
  if (guestCount !== "" && !isValidGuestCount(guestCount)) errors.guestCount = "invalid";

  const text = (key: "location" | "notes" | "name", required: boolean) => {
    const v = str(i[key] ?? "");
    if (v === null) errors[key] = "invalid";
    else if (v.length > LIMITS[key]) errors[key] = "too_long";
    else if (required && v.length === 0) errors[key] = "required";
    return v ?? "";
  };
  const location = text("location", false);
  const notes = text("notes", false);
  const name = text("name", true);

  const budget = i["budget"] == null ? null : isOneOf(BUDGETS, i["budget"]) ? i["budget"] : null;
  if (i["budget"] != null && budget === null) errors.budget = "invalid";

  const phone = str(i["phone"]) ?? "";
  if (!phone) errors.phone = "required";
  else if (!isValidPhone(phone)) errors.phone = "invalid";

  const contactChannel = isOneOf(CONTACT_CHANNELS, i["contactChannel"])
    ? i["contactChannel"]
    : null;
  if (!contactChannel) errors.contactChannel = "invalid";

  if (i["consent"] !== true) errors.consent = "consent_required";
  const marketingConsent = i["marketingConsent"] === true;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      occasions,
      scope,
      services: scope === "full-planning" ? [] : services,
      styles,
      date,
      guestCount,
      location,
      budget,
      notes,
      name,
      phone,
      contactChannel: contactChannel!,
      consent: true,
      marketingConsent,
    },
  };
}
