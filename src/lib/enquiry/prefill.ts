/** Deep links into the planner, e.g. /plan-your-event/?occasion=nikah&service=catering. */
import {
  OCCASIONS,
  SERVICES,
  isOneOf,
  serviceOptionsFor,
  type EnquiryState,
  type OccasionId,
  type ServiceId,
} from "./schema";

export function prefillFromQuery(state: EnquiryState, params: URLSearchParams): EnquiryState {
  const occasions = [...state.occasions];
  for (const o of params.getAll("occasion"))
    if (isOneOf(OCCASIONS, o) && !occasions.includes(o)) occasions.push(o);

  let { scope, services } = state;
  const service = params.get("service");
  if (isOneOf(SERVICES, service)) {
    const allowed = serviceOptionsFor(occasions).some((s) => s.id === service);
    if (allowed) {
      scope = "specific-services";
      services = services.includes(service) ? services : [...services, service];
    }
  }
  return { ...state, occasions, scope, services };
}

export function plannerHref(opts: { occasions?: readonly OccasionId[]; service?: ServiceId }) {
  const p = new URLSearchParams();
  for (const o of opts.occasions ?? []) p.append("occasion", o);
  if (opts.service) p.set("service", opts.service);
  const qs = p.toString();
  return `/plan-your-event/${qs ? `?${qs}` : ""}`;
}
