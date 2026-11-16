/**
 * DORMANT TRANSACTIONAL OUTBOX DELIVERY CORE.
 *
 * No Cron trigger, HTTP endpoint, transport, authorised recipient or automatic
 * task is installed. These are atomic D1 operations for a future owner-approved
 * consumer; no customer payloads are read, logged or returned here.
 *
 * Delivery is AT LEAST ONCE if the provider succeeds but a worker's lease
 * expires before acknowledgement. Future provider adapter must supply stable
 * delivery idempotency (e.g. the immutable outbox ID) before this is enabled.
 */
import type { D1Like } from "./types";

export const OUTBOX_MAX_ATTEMPTS = 8;
export const OUTBOX_LEASE_MS = 2 * 60_000;
const BACKOFF_BASE_MS = 60_000;
const BACKOFF_CAP_MS = 60 * 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface OutboxClaim {
  id: string;
  enquiryId: string;
  kind: "enquiry.created";
  attempt: number;
  token: string;
  leaseUntil: string;
}

/** Strict sortable UTC timestamp: all state-machine comparisons use one format. */
function parseInstant(iso: string): number {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(iso) ||
    !Number.isFinite(Date.parse(iso)) ||
    new Date(iso).toISOString() !== iso
  ) {
    throw new Error("Invalid outbox timestamp");
  }
  return Date.parse(iso);
}

function checkClaim(claim: OutboxClaim): void {
  if (
    !UUID.test(claim.id) ||
    !UUID.test(claim.enquiryId) ||
    !UUID.test(claim.token) ||
    claim.kind !== "enquiry.created" ||
    !Number.isSafeInteger(claim.attempt) ||
    claim.attempt < 1 ||
    claim.attempt > OUTBOX_MAX_ATTEMPTS
  ) {
    throw new Error("Invalid outbox claim");
  }
  parseInstant(claim.leaseUntil);
}

/**
 * Select only event metadata, then acquire a conditional lease. Two processes
 * may select the same row; only one can change it via the attempts and
 * eligibility CAS predicate. The loser gets null, never a duplicate claim.
 */
export async function claimNextOutbox(db: D1Like, nowIso: string): Promise<OutboxClaim | null> {
  const at = parseInstant(nowIso);
  const leaseUntil = new Date(at + OUTBOX_LEASE_MS).toISOString();
  const candidate = await db
    .prepare(
      "SELECT id, enquiry_id, kind, attempts FROM outbox " +
        "WHERE kind = 'enquiry.created' AND delivered_at IS NULL AND attempts < ?1 " +
        "AND (next_attempt_at IS NULL OR next_attempt_at <= ?2) " +
        "AND (lease_until IS NULL OR lease_until <= ?2) " +
        "ORDER BY created_at ASC, id ASC LIMIT 1",
    )
    .bind(OUTBOX_MAX_ATTEMPTS, nowIso)
    .first<{ id: string; enquiry_id: string; kind: string; attempts: number }>();

  if (!candidate) return null;
  if (
    !UUID.test(candidate.id) ||
    !UUID.test(candidate.enquiry_id) ||
    candidate.kind !== "enquiry.created" ||
    !Number.isSafeInteger(candidate.attempts) ||
    candidate.attempts < 0 ||
    candidate.attempts >= OUTBOX_MAX_ATTEMPTS
  ) {
    throw new Error("Invalid outbox event metadata");
  }
  const token = crypto.randomUUID();
  const update = await db
    .prepare(
      "UPDATE outbox SET claim_token = ?1, lease_until = ?2, attempts = attempts + 1 " +
        "WHERE id = ?3 AND kind = 'enquiry.created' AND attempts = ?4 " +
        "AND delivered_at IS NULL AND (next_attempt_at IS NULL OR next_attempt_at <= ?5) " +
        "AND (lease_until IS NULL OR lease_until <= ?5)",
    )
    .bind(token, leaseUntil, candidate.id, candidate.attempts, nowIso)
    .run();

  if (update.meta.changes !== 1) return null;
  return {
    id: candidate.id,
    enquiryId: candidate.enquiry_id,
    kind: "enquiry.created",
    attempt: candidate.attempts + 1,
    token,
    leaseUntil,
  };
}

/**
 * ACK only after provider-verified acceptance; forged or expired claims cannot
 * mark events delivered. This primitive intentionally never calls a provider.
 */
export async function completeOutboxClaim(
  db: D1Like,
  claim: OutboxClaim,
  nowIso: string,
): Promise<boolean> {
  checkClaim(claim);
  parseInstant(nowIso);
  const result = await db
    .prepare(
      "UPDATE outbox SET delivered_at = ?1, claim_token = NULL, lease_until = NULL, " +
        "next_attempt_at = NULL WHERE id = ?2 AND claim_token = ?3 " +
        "AND delivered_at IS NULL AND lease_until > ?1 AND attempts = ?4",
    )
    .bind(nowIso, claim.id, claim.token, claim.attempt)
    .run();
  return result.meta.changes === 1;
}

/** Retry a failed delivery with exponential backoff (1m, 2m, 4m, ... cap 1h). */
export async function releaseFailedOutboxClaim(
  db: D1Like,
  claim: OutboxClaim,
  nowIso: string,
): Promise<boolean> {
  checkClaim(claim);
  const at = parseInstant(nowIso);
  const delay = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** (claim.attempt - 1));
  const nextAttemptAt = new Date(at + delay).toISOString();
  const result = await db
    .prepare(
      "UPDATE outbox SET claim_token = NULL, lease_until = NULL, next_attempt_at = ?1 " +
        "WHERE id = ?2 AND claim_token = ?3 AND delivered_at IS NULL " +
        "AND lease_until > ?4 AND attempts = ?5",
    )
    .bind(nextAttemptAt, claim.id, claim.token, nowIso, claim.attempt)
    .run();
  return result.meta.changes === 1;
}
