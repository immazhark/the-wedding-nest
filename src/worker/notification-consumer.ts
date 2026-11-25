/** Dormant single-event consumer. No route, cron, bindings or live callers. */
import { buildOperatorNotice, type OperatorNotice } from "./notification-content";
import {
  EMAIL_NOTICE_VERSION,
  isEmailConfigured,
  sendOperatorEmail,
  type EmailConfiguration,
} from "./notification-email";
import {
  claimNextOutbox,
  releaseFailedOutboxClaim,
  OUTBOX_MAX_ATTEMPTS,
  type OutboxClaim,
} from "./outbox";
import type { D1Like } from "./types";

type HeldReason = "invalid_event" | "provider" | "attempts_exhausted";
export interface ConsumerResult {
  /** Safe aggregate outcome only. No customer contents, credentials or provider body. */
  status: "disabled" | "idle" | "accepted" | "retry" | "held" | "lease_lost" | "storage_error";
}

const LIVE =
  "id = ?1 AND claim_token = ?2 AND attempts = ?3 AND delivered_at IS NULL AND lease_until > ?4";

async function hold(
  db: D1Like,
  claim: OutboxClaim,
  now: string,
  reason: HeldReason,
): Promise<ConsumerResult> {
  const result = await db
    .prepare(
      `UPDATE outbox SET held_reason = ?5, attempts = ?6, claim_token = NULL, lease_until = NULL, next_attempt_at = NULL WHERE ${LIVE}`,
    )
    .bind(claim.id, claim.token, claim.attempt, now, reason, OUTBOX_MAX_ATTEMPTS)
    .run();
  return { status: result.meta.changes === 1 ? "held" : "lease_lost" };
}

/**
 * The caller supplies a fresh clock for each phase. Database errors never become
 * a successful acknowledgement; an unacknowledged lease expires naturally.
 * All provider access is through the existing fixed-recipient email adapter.
 */
export async function consumeOneOperatorEmail(
  db: D1Like,
  config: EmailConfiguration,
  clock: () => Date = () => new Date(),
  fetcher: typeof fetch = fetch,
): Promise<ConsumerResult> {
  // Crucially before a claim or any private-data read.
  if (!isEmailConfigured(config)) return { status: "disabled" };
  try {
    const claim = await claimNextOutbox(db, clock().toISOString());
    if (!claim) return { status: "idle" };
    const now = clock().toISOString();
    const source = await db
      .prepare(
        "SELECT o.notice_json, e.payload_json FROM outbox o JOIN enquiries e ON e.id = o.enquiry_id " +
          "WHERE o.id = ?1 AND o.claim_token = ?2 AND o.attempts = ?3 AND o.delivered_at IS NULL AND o.lease_until > ?4",
      )
      .bind(claim.id, claim.token, claim.attempt, now)
      .first<{ notice_json: string | null; payload_json: string }>();
    if (!source) return { status: "lease_lost" };
    if (source.notice_json === null) {
      let notice: OperatorNotice;
      try {
        notice = buildOperatorNotice(claim.enquiryId, JSON.parse(source.payload_json));
      } catch {
        return await hold(db, claim, clock().toISOString(), "invalid_event");
      }
      // Persist first, then read the winning immutable snapshot. Never regenerate
      // a sent notice from mutable enquiry details on a retry.
      await db
        .prepare(
          `UPDATE outbox SET notice_json = ?5, notice_version = ?6 WHERE ${LIVE} AND notice_json IS NULL`,
        )
        .bind(
          claim.id,
          claim.token,
          claim.attempt,
          clock().toISOString(),
          JSON.stringify(notice),
          EMAIL_NOTICE_VERSION,
        )
        .run();
    }
    const snapshot = await db
      .prepare(`SELECT created_at, notice_json, notice_version FROM outbox WHERE ${LIVE}`)
      .bind(claim.id, claim.token, claim.attempt, clock().toISOString())
      .first<{ created_at: string; notice_json: string | null; notice_version: number | null }>();
    if (!snapshot) return { status: "lease_lost" };
    let notice: OperatorNotice;
    try {
      const value: unknown = JSON.parse(snapshot.notice_json ?? "null");
      if (
        snapshot.notice_version !== EMAIL_NOTICE_VERSION ||
        typeof value !== "object" ||
        value === null ||
        !("enquiryId" in value) ||
        value.enquiryId !== claim.enquiryId ||
        !("subject" in value) ||
        typeof value.subject !== "string" ||
        !("text" in value) ||
        typeof value.text !== "string"
      )
        throw new Error("Invalid snapshot");
      notice = { enquiryId: claim.enquiryId, subject: value.subject, text: value.text };
    } catch {
      return await hold(db, claim, clock().toISOString(), "invalid_event");
    }
    const sendAt = clock();
    // Do not start a ten-second transport attempt with an expired/nearly expired lease.
    if (sendAt.getTime() + 10_000 >= Date.parse(claim.leaseUntil)) return { status: "lease_lost" };
    const outcome = await sendOperatorEmail(
      config,
      { id: claim.id, createdAt: snapshot.created_at, notice },
      sendAt,
      fetcher,
    );
    const finishedAt = clock().toISOString();
    if (outcome.status === "blocked") {
      return await hold(
        db,
        claim,
        finishedAt,
        outcome.reason === "provider" ? "provider" : "invalid_event",
      );
    }
    if (outcome.status === "retry") {
      if (claim.attempt >= OUTBOX_MAX_ATTEMPTS)
        return await hold(db, claim, finishedAt, "attempts_exhausted");
      return {
        status: (await releaseFailedOutboxClaim(db, claim, finishedAt)) ? "retry" : "lease_lost",
      };
    }
    // A single statement records provider acceptance and closes the live lease.
    // Legacy delivered_at means provider acceptance, never verified inbox receipt.
    const ack = await db
      .prepare(
        `UPDATE outbox SET delivered_at = ?4, accepted_provider_id = ?5, claim_token = NULL, lease_until = NULL, next_attempt_at = NULL WHERE ${LIVE}`,
      )
      .bind(claim.id, claim.token, claim.attempt, finishedAt, outcome.providerId)
      .run();
    return { status: ack.meta.changes === 1 ? "accepted" : "lease_lost" };
  } catch {
    return { status: "storage_error" };
  }
}
