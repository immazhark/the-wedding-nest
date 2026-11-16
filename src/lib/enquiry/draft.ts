/**
 * Optional local draft of *non-sensitive* selections so a visitor can resume.
 * Contact details, venue/location, notes and consent are never included (free text can
 * identify a person or home address), and drafts expire.
 */
import {
  BUDGETS,
  OCCASIONS,
  SCOPES,
  STYLES,
  emptyEnquiry,
  isOneOf,
  serviceOptionsFor,
  type EnquiryState,
  type EventDate,
} from "./schema";
import { isValidDate, isValidGuestCount } from "./validate";

export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const DRAFT_STORAGE_KEY = "twn:enquiry-draft";

type DraftData = Pick<
  EnquiryState,
  "occasions" | "scope" | "services" | "styles" | "date" | "guestCount" | "budget"
>;
export type Draft = { v: 1; savedAt: number; data: DraftData };

export function toDraft(s: EnquiryState, now: number): Draft {
  const { date } = s;
  const scope = isOneOf(SCOPES, s.scope) ? s.scope : null;
  const budget = isOneOf(BUDGETS, s.budget) ? s.budget : null;
  const guestCount =
    typeof s.guestCount === "string" && isValidGuestCount(s.guestCount) ? s.guestCount : "";
  // Create a standalone allow-listed snapshot. Unexpected runtime objects must not
  // be carried into localStorage, even if a caller bypasses TypeScript's types.
  const occasions = Array.isArray(s.occasions)
    ? s.occasions.filter((id) => isOneOf(OCCASIONS, id))
    : [];
  const allowedServices = new Set<string>(serviceOptionsFor(occasions).map((item) => item.id));
  const services =
    scope === "specific-services"
      ? Array.isArray(s.services)
        ? s.services.filter((id) => typeof id === "string" && allowedServices.has(id))
        : []
      : [];
  const styles = Array.isArray(s.styles) ? s.styles.filter((id) => isOneOf(STYLES, id)) : [];
  const savedDate: EventDate =
    date?.kind === "date" && typeof date.value === "string" && isValidDate(date.value)
      ? { kind: "date", value: date.value }
      : { kind: "undecided" };
  return {
    v: 1,
    savedAt: now,
    data: { occasions, scope, services, styles, date: savedDate, guestCount, budget },
  };
}

/** Returns a fresh state with draft selections applied, or null if stale/invalid. */
export function restoreDraft(raw: unknown, now: number): EnquiryState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Partial<Draft>;
  if (
    d.v !== 1 ||
    typeof d.savedAt !== "number" ||
    !Number.isFinite(d.savedAt) ||
    !Number.isFinite(now) ||
    d.savedAt < 0 ||
    d.savedAt > now ||
    now - d.savedAt > DRAFT_TTL_MS
  )
    return null;
  const data = d.data as Partial<DraftData> | undefined;
  if (!data || typeof data !== "object") return null;

  const occasions = Array.isArray(data.occasions) ? data.occasions : [];
  if (!occasions.every((o) => isOneOf(OCCASIONS, o))) return null;
  const allowed = new Set<string>(serviceOptionsFor(occasions).map((s) => s.id));
  const services = Array.isArray(data.services) ? data.services : [];
  const styles = Array.isArray(data.styles) ? data.styles : [];
  if (
    new Set(occasions).size !== occasions.length ||
    new Set(services).size !== services.length ||
    new Set(styles).size !== styles.length ||
    !services.every((s) => allowed.has(s)) ||
    !styles.every((s) => isOneOf(STYLES, s))
  )
    return null;

  const base = emptyEnquiry();
  const scope = isOneOf(SCOPES, data.scope) ? data.scope : null;
  const date: EventDate =
    data.date?.kind === "date" &&
    typeof data.date.value === "string" &&
    isValidDate(data.date.value)
      ? { kind: "date", value: data.date.value }
      : base.date;
  return {
    ...base,
    occasions,
    services: scope === "specific-services" ? services : [],
    styles,
    date,
    scope,
    budget: isOneOf(BUDGETS, data.budget) ? data.budget : null,
    guestCount:
      typeof data.guestCount === "string" && isValidGuestCount(data.guestCount)
        ? data.guestCount
        : "",
  };
}
