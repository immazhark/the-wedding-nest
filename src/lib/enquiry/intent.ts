/**
 * Compact, allow-listed intent from public editorial links into the planner.
 * Never read contact data, budget, free text or arbitrary state from URLs.
 */
import {
  OCCASIONS,
  SERVICES,
  isOneOf,
  serviceOptionsFor,
  type EnquiryState,
  type OccasionId,
  type ServiceId,
} from "./schema";

export type PlannerIntent = { occasion?: OccasionId; service?: ServiceId };

export function readPlannerIntent(search: string): PlannerIntent {
  const params = new URLSearchParams(search);
  const occasions = params.getAll("occasion");
  const services = params.getAll("service");

  // Ambiguous or unrecognized values cannot silently pick a different path.
  if (occasions.length > 1 || services.length > 1) return {};
  let occasion: OccasionId | undefined;
  let service: ServiceId | undefined;

  if (occasions.length === 1) {
    const raw = occasions[0];
    if (!isOneOf(OCCASIONS, raw)) return {};
    occasion = raw;
  }
  if (services.length === 1) {
    const raw = services[0];
    if (!isOneOf(SERVICES, raw)) return {};
    service = raw;
  }
  return { ...(occasion ? { occasion } : {}), ...(service ? { service } : {}) };
}

/** Add only known choices, preserving a visitor's existing non-sensitive plan. */
export function applyPlannerIntent(draft: EnquiryState, intent: PlannerIntent): EnquiryState {
  if (!intent.occasion && !intent.service) return draft;

  const occasions: OccasionId[] =
    intent.occasion && !draft.occasions.includes(intent.occasion)
      ? [...draft.occasions, intent.occasion]
      : draft.occasions;

  const allowed = serviceOptionsFor(occasions).some((option) => option.id === intent.service);
  if (!intent.occasion && !allowed) return draft;

  const services: ServiceId[] =
    allowed && intent.service && !draft.services.includes(intent.service)
      ? [...draft.services, intent.service]
      : draft.services;

  return {
    ...draft,
    occasions,
    services,
    scope: allowed ? "specific-services" : draft.scope,
  };
}
