import { STAGES, serviceOptionsFor, type EnquiryState, type StageId } from "./schema";
import { isValidDate, isValidGuestCount, isValidPhone } from "./validate";

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
