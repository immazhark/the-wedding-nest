/**
 * Dormant status-management core for a future authenticated operator interface.
 * No HTTP route, credential, scheduler or live caller is installed here.
 * Caller authentication and operator authority must be established before live use.
 * Unsuccessful disposition continues to use privacy.ts and its explicit 90-day clock.
 */
import type { D1Like, D1PreparedLike } from "./types";

const ENQUIRY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS_ORDER = new Map([
  ["new", 0],
  ["contacted", 1],
  ["in_progress", 2],
  ["booked", 3],
]);

/**
 * Advance a known active status using a single compare-and-set statement.
 * Returns false for a missing record, stale expected status or inconsistent clock.
 * Booked, unsuccessful and unknown stored states cannot be overwritten. This never
 * starts/resets retention, reads customer payloads or changes notification delivery.
 */
export function prepareAdvanceEnquiryStatus(
  db: D1Like,
  enquiryId: string,
  expectedStatus: unknown,
  nextStatus: unknown,
): D1PreparedLike {
  if (typeof enquiryId !== "string" || !ENQUIRY_ID.test(enquiryId)) {
    throw new Error("Invalid enquiry id");
  }
  const from = typeof expectedStatus === "string" ? STATUS_ORDER.get(expectedStatus) : undefined;
  const to = typeof nextStatus === "string" ? STATUS_ORDER.get(nextStatus) : undefined;
  if (from === undefined || to === undefined || to <= from) {
    throw new Error("Invalid enquiry status transition");
  }
  return db
    .prepare(
      "UPDATE enquiries SET status = ?1 WHERE id = ?2 AND status = ?3 " +
        "AND unsuccessful_at IS NULL",
    )
    .bind(nextStatus, enquiryId, expectedStatus);
}

export async function advanceEnquiryStatus(
  db: D1Like,
  enquiryId: string,
  expectedStatus: unknown,
  nextStatus: unknown,
): Promise<boolean> {
  const result = await prepareAdvanceEnquiryStatus(db, enquiryId, expectedStatus, nextStatus).run();
  return result.meta.changes === 1;
}
