/** Read-only delivery overview: no recipient, payload, provider ID or event ID leaves D1. */
import { OUTBOX_MAX_ATTEMPTS } from "./outbox";
import type { D1Like } from "./types";

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
