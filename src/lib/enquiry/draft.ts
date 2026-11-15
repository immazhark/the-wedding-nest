/**
 * Optional local draft of *non-sensitive* selections so a visitor can resume.
 * Contact details, notes and consent are never included, and drafts expire.
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
} from "./schema";
import { isValidDate, isValidGuestCount } from "./validate";

export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const DRAFT_STORAGE_KEY = "twn:enquiry-draft";

type DraftData = Pick<
  EnquiryState,
  "occasions" | "scope" | "services" | "styles" | "date" | "guestCount" | "location" | "budget"
>;
export type Draft = { v: 1; savedAt: number; data: DraftData };

export function toDraft(s: EnquiryState, now: number): Draft {
  const { occasions, scope, services, styles, date, guestCount, location, budget } = s;
  return {
    v: 1,
    savedAt: now,
    data: { occasions, scope, services, styles, date, guestCount, location, budget },
  };
}

/** Returns a fresh state with draft selections applied, or null if stale/invalid. */
export function restoreDraft(raw: unknown, now: number): EnquiryState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Partial<Draft>;
  if (d.v !== 1 || typeof d.savedAt !== "number" || now - d.savedAt > DRAFT_TTL_MS) return null;
  const data = d.data as Partial<DraftData> | undefined;
  if (!data || typeof data !== "object") return null;

  const occasions = Array.isArray(data.occasions) ? data.occasions : [];
  if (!occasions.every((o) => isOneOf(OCCASIONS, o))) return null;
  const allowed = new Set<string>(serviceOptionsFor(occasions).map((s) => s.id));
  const services = Array.isArray(data.services) ? data.services : [];
  const styles = Array.isArray(data.styles) ? data.styles : [];
  if (!services.every((s) => allowed.has(s)) || !styles.every((s) => isOneOf(STYLES, s)))
    return null;

  const base = emptyEnquiry();
  const date = data.date?.kind === "date" && isValidDate(data.date.value) ? data.date : base.date;
  return {
    ...base,
    occasions,
    services,
    styles,
    date,
    scope: isOneOf(SCOPES, data.scope) ? data.scope : null,
    budget: isOneOf(BUDGETS, data.budget) ? data.budget : null,
    guestCount:
      typeof data.guestCount === "string" && isValidGuestCount(data.guestCount)
        ? data.guestCount
        : "",
    location: typeof data.location === "string" ? data.location.slice(0, 160) : "",
  };
}
