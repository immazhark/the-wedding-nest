/** Read-only delivery monitoring: aggregate overview and restricted held-event metadata. */
import { OUTBOX_MAX_ATTEMPTS } from "./outbox";
import type { D1Like, D1PreparedLike } from "./types";
import {
  isCanonicalInstant,
  notificationWindow,
  type NotificationWindow,
} from "./notification-window";

export async function readDeliveryOverview(db: D1Like, now: string) {
  if (!Number.isFinite(Date.parse(now)) || new Date(now).toISOString() !== now) {
    throw new Error("Invalid overview clock");
  }
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS total, " +
        "COUNT(CASE WHEN state = 'accepted' THEN 1 END) AS accepted, " +
        "COUNT(CASE WHEN state = 'unconfirmed' THEN 1 END) AS unconfirmed, " +
        "COUNT(CASE WHEN state = 'held' THEN 1 END) AS held, " +
        "COUNT(CASE WHEN state = 'leased' THEN 1 END) AS leased, " +
        "COUNT(CASE WHEN state = 'retry' THEN 1 END) AS retry, " +
        "COUNT(CASE WHEN state = 'ready' THEN 1 END) AS ready " +
        "FROM (SELECT CASE " +
        "WHEN delivered_at IS NOT NULL AND accepted_provider_id IS NOT NULL THEN 'accepted' " +
        "WHEN delivered_at IS NOT NULL THEN 'unconfirmed' " +
        "WHEN held_reason IS NOT NULL THEN 'held' " +
        "WHEN lease_until > ?1 THEN 'leased' " +
        "WHEN attempts >= ?2 THEN 'held' " +
        "WHEN next_attempt_at > ?1 THEN 'retry' ELSE 'ready' END AS state " +
        "FROM outbox WHERE kind = 'enquiry.created')",
    )
    .bind(now, OUTBOX_MAX_ATTEMPTS)
    .first<{
      total: number;
      accepted: number;
      unconfirmed: number;
      held: number;
      leased: number;
      retry: number;
      ready: number;
    }>();
  if (!row) throw new Error("Delivery overview unavailable");
  const { total, accepted, unconfirmed, held, leased, retry, ready } = row;
  const counts = [accepted, unconfirmed, held, leased, retry, ready];
  if (
    ![total, ...counts].every((count) => Number.isSafeInteger(count) && count >= 0) ||
    counts.reduce((sum, count) => sum + count, 0) !== total
  ) {
    throw new Error("Invalid delivery overview");
  }
  return { total, accepted, unconfirmed, held, leased, retry, ready };
}

interface DeliveryStatement extends D1PreparedLike {
  bind(...values: unknown[]): DeliveryStatement;
  all<T = unknown>(): Promise<{ results: T[] }>;
}
export interface DeliveryD1 extends D1Like {
  prepare(sql: string): DeliveryStatement;
}

export class InvalidHeldDeliveryQuery extends Error {}
export interface HeldDeliveryQuery {
  limit?: string | null;
  after?: string | null;
  afterId?: string | null;
}
const EVENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HOLD_REASONS = ["invalid_event", "provider", "attempts_exhausted"] as const;
type HoldReason = (typeof HOLD_REASONS)[number] | "unknown";
export interface HeldDelivery {
  id: string;
  createdAt: string;
  attempts: number;
  reason: HoldReason;
  window: NotificationWindow;
}

/**
 * Restricted operational metadata only. IDs are linkable: never log or treat as anonymous.
 * Selection matches overview precedence, including explicit holds before active leases.
 * Age is a separate warning, not a new queue state or permission to retry.
 */
export async function readHeldDeliveries(
  db: DeliveryD1,
  now: string,
  query: HeldDeliveryQuery = {},
): Promise<{ events: HeldDelivery[]; nextCursor: { createdAt: string; id: string } | null }> {
  if (!isCanonicalInstant(now)) throw new Error("Invalid held delivery clock");
  const after = query.after ?? null;
  const afterId = query.afterId ?? null;
  if (
    (after === null) !== (afterId === null) ||
    (after !== null && (!isCanonicalInstant(after) || !EVENT_ID.test(afterId!)))
  )
    throw new InvalidHeldDeliveryQuery("invalid_cursor");
  const asked = query.limit ?? "25";
  if (!/^[1-9]\d*$/.test(asked) || !Number.isSafeInteger(Number(asked))) {
    throw new InvalidHeldDeliveryQuery("invalid_limit");
  }
  const limit = Math.min(Number(asked), 100);
  const { results } = await db
    .prepare(
      // The existing partial ordered index avoids sorting the entire pending queue.
      "SELECT id, created_at, attempts, held_reason FROM outbox INDEXED BY idx_outbox_claimable " +
        "WHERE delivered_at IS NULL AND kind = 'enquiry.created' " +
        "AND (held_reason IS NOT NULL OR (attempts >= ?2 AND (lease_until IS NULL OR lease_until <= ?1))) " +
        (after === null ? "" : "AND (created_at, id) > (?3, ?4) ") +
        "ORDER BY created_at ASC, id ASC LIMIT ?5",
    )
    .bind(now, OUTBOX_MAX_ATTEMPTS, after, afterId, limit + 1)
    .all<{
      id: unknown;
      created_at: unknown;
      attempts: unknown;
      held_reason: unknown;
    }>();
  if (!Array.isArray(results) || results.length > limit + 1)
    throw new Error("Invalid held delivery metadata");
  // Validate the extra row too; never return a misleading cursor over corrupt metadata.
  const rows = results.map((row): HeldDelivery => {
    if (
      !row ||
      typeof row.id !== "string" ||
      !EVENT_ID.test(row.id) ||
      !isCanonicalInstant(row.created_at) ||
      typeof row.attempts !== "number" ||
      !Number.isSafeInteger(row.attempts) ||
      row.attempts < 0
    )
      throw new Error("Invalid held delivery metadata");
    const reason: HoldReason =
      row.held_reason === null && row.attempts >= OUTBOX_MAX_ATTEMPTS
        ? "attempts_exhausted"
        : (HOLD_REASONS.find((reason) => reason === row.held_reason) ?? "unknown");
    return {
      id: row.id,
      createdAt: row.created_at,
      attempts: row.attempts,
      reason,
      window: notificationWindow(row.created_at, now),
    };
  });
  const events = rows.slice(0, limit);
  const last = events.at(-1);
  return {
    events,
    nextCursor: rows.length > limit && last ? { createdAt: last.createdAt, id: last.id } : null,
  };
}
