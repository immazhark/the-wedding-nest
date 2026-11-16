/**
 * Editorial case-study CTA only transfers a known occasion into the planner.
 * No client details, URLs, notes, budget or names are copied from a story.
 */
import { OCCASIONS, isOneOf } from "../enquiry/schema";
import type { MediaEntry } from "../media/schema";

/** Non-event image categories must not be guessed into an occasion. */
export function storyPlannerHref(category: MediaEntry["category"]): string {
  return isOneOf(OCCASIONS, category)
    ? `/plan-your-event/?occasion=${category}`
    : "/plan-your-event/";
}
