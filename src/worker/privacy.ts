/**
 * A narrow primitive for an explicitly authorised access/deletion workflow.
 *
 * NOT exposed as a route, scheduled retention job, or production switch.
 * The owner must approve a privacy policy, retention rules and an
 * authenticated operator process before this is called on live data.
 *
 * The D1 schema's ON DELETE CASCADE removes any linked outbox event in the
 * same database statement, preventing future notifications for a deleted lead.
 * No personal data is returned or logged.
 */
import type { D1Like } from "./types";

const ENQUIRY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function deleteEnquiryRecord(db: D1Like, enquiryId: string): Promise<boolean> {
  if (!ENQUIRY_ID.test(enquiryId)) throw new Error("Invalid enquiry id");

  const result = await db
    .prepare("DELETE FROM enquiries WHERE id = ?1")
    .bind(enquiryId)
    .run();
  return result.meta.changes === 1;
}
