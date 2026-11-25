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

/** Owner decision, 24 Nov 2026: 90 days after explicit unsuccessful disposition. */
export const UNSUCCESSFUL_RETENTION_DAYS = 90;
const MAX_RETENTION_BATCH = 100;

function retentionTime(iso: string): number {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(iso) ||
    !Number.isFinite(Date.parse(iso)) ||
    new Date(iso).toISOString() !== iso
  ) {
    throw new Error("Invalid retention time");
  }
  return Date.parse(iso);
}

function unsuccessfulCutoff(nowIso: string): string {
  return new Date(retentionTime(nowIso) - UNSUCCESSFUL_RETENTION_DAYS * 86_400_000).toISOString();
}

/**
 * Dormant operator primitive, not a route or automatic status inference. Only known active
 * states may transition; booked/unknown states are protected. The reviewed status must still
 * match at write time, and repeating a call never resets the clock. Caller authentication and
 * authority are required before any future live use.
 */
export async function markEnquiryUnsuccessful(
  db: D1Like,
  enquiryId: string,
  expectedStatus: unknown,
  atIso: string,
): Promise<boolean> {
  if (typeof enquiryId !== "string" || !ENQUIRY_ID.test(enquiryId)) {
    throw new Error("Invalid enquiry id");
  }
  if (
    expectedStatus !== "new" &&
    expectedStatus !== "contacted" &&
    expectedStatus !== "in_progress"
  ) {
    throw new Error("Invalid expected enquiry status");
  }
  retentionTime(atIso);
  const result = await db
    .prepare(
      "UPDATE enquiries SET status = 'unsuccessful', unsuccessful_at = ?1 " +
        "WHERE id = ?2 AND status = ?3 AND status IN ('new', 'contacted', 'in_progress') " +
        "AND unsuccessful_at IS NULL AND created_at <= ?1",
    )
    .bind(atIso, enquiryId, expectedStatus)
    .run();
  return result.meta.changes === 1;
}

const PENDING_DELIVERY =
  "EXISTS (SELECT 1 FROM outbox o WHERE o.enquiry_id = e.id AND o.delivered_at IS NULL)";

/** Counts only; includes blocked pending-delivery records for operator review. Never logs PII. */
export async function previewUnsuccessfulRetention(
  db: D1Like,
  nowIso: string,
): Promise<{ eligibleCount: number; pendingDeliveryCount: number }> {
  const cutoff = unsuccessfulCutoff(nowIso);
  const row = await db
    .prepare(
      `SELECT COUNT(CASE WHEN NOT ${PENDING_DELIVERY} THEN 1 END) AS eligible, ` +
        `COUNT(CASE WHEN ${PENDING_DELIVERY} THEN 1 END) AS pending ` +
        "FROM enquiries e WHERE e.status = 'unsuccessful' " +
        "AND e.unsuccessful_at IS NOT NULL AND e.unsuccessful_at <= ?1",
    )
    .bind(cutoff)
    .first<{ eligible: number; pending: number }>();
  if (!row || ![row.eligible, row.pending].every((n) => Number.isSafeInteger(n) && n >= 0)) {
    throw new Error("Invalid unsuccessful retention counts");
  }
  return { eligibleCount: row.eligible, pendingDeliveryCount: row.pending };
}

/**
 * Dormant bounded deletion, requiring migration 0003 and future authenticated operator approval.
 * No route, cron or live caller is installed. Pending deliveries are held for review instead of
 * being silently discarded. Active/booked/unknown-clock records are never candidates. Conditions
 * are checked in the DELETE itself, so a stale preview cannot authorise a different record.
 */
export async function deleteExpiredUnsuccessfulEnquiries(
  db: D1Like,
  nowIso: string,
  limit = MAX_RETENTION_BATCH,
): Promise<number> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_RETENTION_BATCH) {
    throw new Error("Invalid retention batch");
  }
  const cutoff = unsuccessfulCutoff(nowIso);
  const result = await db
    .prepare(
      "DELETE FROM enquiries WHERE id IN (SELECT e.id FROM enquiries e " +
        "WHERE e.status = 'unsuccessful' AND e.unsuccessful_at IS NOT NULL " +
        `AND e.unsuccessful_at <= ?1 AND NOT ${PENDING_DELIVERY} ` +
        "ORDER BY e.unsuccessful_at, e.id LIMIT ?2)",
    )
    .bind(cutoff, limit)
    .run();
  return result.meta.changes;
}
