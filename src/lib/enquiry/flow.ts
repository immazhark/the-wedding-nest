import { STAGES, serviceOptionsFor, type EnquiryState, type StageId } from "./schema";
import { isValidDate, isValidGuestCount, isValidPhone } from "./validate";

export type PlannerField = "date" | "guestCount" | "name" | "phone" | "consent";

/** Validate just the field a visitor has left, without announcing untouched answers. */
export function fieldError(field: PlannerField, s: EnquiryState): string | null {
  switch (field) {
    case "date":
      return s.date.kind === "date" && !isValidDate(s.date.value)
        ? "Please enter a valid date."
        : null;
    case "guestCount":
      return s.guestCount.trim() !== "" && !isValidGuestCount(s.guestCount)
        ? "Please enter the number of guests as a whole number, or leave it blank."
        : null;
    case "name":
      return s.name.trim() ? null : "Please enter your name.";
    case "phone":
      return isValidPhone(s.phone)
        ? null
        : "Please enter a phone or WhatsApp number we can reach you on.";
    case "consent":
      return s.consent ? null : "Please agree to us using your details to respond to this enquiry.";
  }
}

export function isStageComplete(stage: StageId, s: EnquiryState): boolean {
  switch (stage) {
    case "occasion":
      return s.occasions.length > 0;
    case "scope": {
      if (s.scope === "full-planning") return true;
      if (s.scope !== "specific-services") return false;
      const allowed = new Set<string>(serviceOptionsFor(s.occasions).map((o) => o.id));
      return s.services.length > 0 && s.services.every((id) => allowed.has(id));
    }
    case "style":
      return true; // optional
    case "logistics":
      return (
        (s.date.kind === "undecided" || isValidDate(s.date.value)) &&
        (s.guestCount.trim() === "" || isValidGuestCount(s.guestCount))
      );
    case "contact":
      return s.name.trim().length > 0 && isValidPhone(s.phone) && s.consent === true;
  }
}

const order: StageId[] = STAGES.map((st) => st.id);

export function nextStage(stage: StageId): StageId | null {
  return order[order.indexOf(stage) + 1] ?? null;
}

export function previousStage(stage: StageId): StageId | null {
  const i = order.indexOf(stage);
  return i > 0 ? (order[i - 1] ?? null) : null;
}

export function firstIncompleteStage(s: EnquiryState): StageId | null {
  return order.find((st) => !isStageComplete(st, s)) ?? null;
}

/** Plain-language message for the first problem on a stage, or null when it can proceed. */
export function stageError(stage: StageId, s: EnquiryState): string | null {
  if (isStageComplete(stage, s)) return null;
  switch (stage) {
    case "occasion":
      return "Please choose at least one occasion.";
    case "scope":
      return s.scope === null
        ? "Please tell us how we can help."
        : "Please choose at least one service.";
    case "style":
      return null;
    case "logistics":
      return fieldError("date", s) ?? fieldError("guestCount", s);
    case "contact":
      return fieldError("name", s) ?? fieldError("phone", s) ?? fieldError("consent", s);
  }
}
