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

  const result = await db.prepare("DELETE FROM enquiries WHERE id = ?1").bind(enquiryId).run();
  return result.meta.changes === 1;
}

/** Aggregated, non-identifying impact estimate. No retention policy is assumed. */
export interface RetentionImpact {
  candidateCount: number;
  nonNewCount: number;
  pendingOutboxCount: number;
}

/**
 * Preview records predating an explicitly supplied cutoff without reading any
 * customer payload, phone, name or individual ID. No write is performed.
 *
 * A booked/non-new enquiry or a pending notification is only a warning count:
 * callers MUST NOT infer that these records can be deleted. There is no public
 * route, operator credential, automatic cleanup or live retention policy here.
 */
export async function previewRetentionImpact(
  db: D1Like,
  cutoffIso: string,
): Promise<RetentionImpact> {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(cutoffIso) ||
    !Number.isFinite(Date.parse(cutoffIso)) ||
    new Date(cutoffIso).toISOString() !== cutoffIso
  ) {
    throw new Error("Invalid retention cutoff");
  }

  const row = await db
    .prepare(
      "SELECT COUNT(*) AS candidate_count, " +
        "COALESCE(SUM(CASE WHEN e.status <> 'new' THEN 1 ELSE 0 END), 0) AS non_new_count, " +
        "COALESCE(SUM(CASE WHEN EXISTS (" +
        "SELECT 1 FROM outbox o WHERE o.enquiry_id = e.id AND o.delivered_at IS NULL" +
        ") THEN 1 ELSE 0 END), 0) AS pending_outbox_count " +
        "FROM enquiries e WHERE e.created_at < ?1",
    )
    .bind(cutoffIso)
    .first<{
      candidate_count: number;
      non_new_count: number;
      pending_outbox_count: number;
    }>();

  if (
    !row ||
    ![row.candidate_count, row.non_new_count, row.pending_outbox_count].every(
      (count) => Number.isSafeInteger(count) && count >= 0,
    )
  ) {
    throw new Error("Invalid retention preview data");
  }

  return {
    candidateCount: row.candidate_count,
    nonNewCount: row.non_new_count,
    pendingOutboxCount: row.pending_outbox_count,
  };
}
