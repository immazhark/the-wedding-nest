/** Real SQLite migrations verify the dormant D1 outbox lease primitives. */
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import {
  claimNextOutbox,
  completeOutboxClaim,
  releaseFailedOutboxClaim,
  OUTBOX_MAX_ATTEMPTS,
} from "../../src/worker/outbox";
import type { D1Like, D1PreparedLike } from "../../src/worker/types";

function createDb() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(readFileSync("migrations/0001_enquiries.sql", "utf8"));
  db.exec(readFileSync("migrations/0002_outbox_leases.sql", "utf8"));
  const prepare = (sql: string): D1PreparedLike => {
    let values: unknown[] = [];
    const stmt = {
      bind(...args: unknown[]) {
        values = args;
        return stmt;
      },
      async first<T>() {
        return (db.prepare(sql).get(...(values as never[])) ?? null) as T | null;
      },
      async run() {
        return { meta: { changes: Number(db.prepare(sql).run(...(values as never[])).changes) } };
      },
    };
    return stmt;
  };
  const d1: D1Like = {
    prepare,
    async batch() {
      throw new Error("Outbox lease operations should not require a batch");
    },
  };
  return { db, d1 };
}

const ID = "11111111-2222-4333-8444-555555555555";
const KEY = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const OUTBOX_ID = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
const NOW = "2026-11-16T12:00:00.000Z";

function seed(db: DatabaseSync) {
  db.prepare(
    "INSERT INTO enquiries (id, idempotency_key, created_at, payload_json, consent_at, marketing_consent) " +
      "VALUES (?1, ?2, ?3, ?4, ?3, 0)",
  ).run(ID, KEY, "2026-11-16T11:00:00.000Z", '{"name":"Private Test Person","phone":"9876543210"}');
  db.prepare(
    "INSERT INTO outbox (id, enquiry_id, kind, created_at) VALUES (?1, ?2, 'enquiry.created', ?3)",
  ).run(OUTBOX_ID, ID, "2026-11-16T11:00:00.000Z");
}

describe("dormant outbox lease and retry primitives", () => {
  it("claims once under contention; returns reference-only data, not customer details", async () => {
    const { db, d1 } = createDb();
    seed(db);
    const [a, b] = await Promise.all([claimNextOutbox(d1, NOW), claimNextOutbox(d1, NOW)]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
    const claim = a ?? b;
    expect(claim).toMatchObject({
      id: OUTBOX_ID,
      enquiryId: ID,
      kind: "enquiry.created",
      attempt: 1,
    });
    expect(claim?.token).toMatch(/^[0-9a-f-]{36}$/i);
    expect(JSON.stringify(claim)).not.toMatch(/Private Test Person|9876543210|payload_json/);
    expect(await claimNextOutbox(d1, NOW)).toBeNull();
    expect(db.prepare("SELECT attempts FROM outbox").get()).toEqual({ attempts: 1 });
  });

  it("uses token-and-lease CAS so stale workers cannot acknowledge delivery", async () => {
    const { db, d1 } = createDb();
    seed(db);
    const first = await claimNextOutbox(d1, NOW);
    expect(first).not.toBeNull();
    expect(await completeOutboxClaim(d1, first!, "2026-11-16T12:00:50.000Z")).toBe(true);
    expect(await completeOutboxClaim(d1, first!, "2026-11-16T12:00:51.000Z")).toBe(false);
    expect(await claimNextOutbox(d1, "2026-11-16T12:03:00.000Z")).toBeNull();
    expect(db.prepare("SELECT delivered_at FROM outbox").get()).toEqual({
      delivered_at: "2026-11-16T12:00:50.000Z",
    });
  });

  it("reclaims an expired lease but rejects the former worker's token", async () => {
    const { db, d1 } = createDb();
    seed(db);
    const old = await claimNextOutbox(d1, NOW);
    expect(old).not.toBeNull();
    const fresh = await claimNextOutbox(d1, "2026-11-16T12:03:00.000Z");
    expect(fresh).toMatchObject({ id: OUTBOX_ID, attempt: 2 });
    expect(fresh?.token).not.toBe(old?.token);
    expect(await completeOutboxClaim(d1, old!, "2026-11-16T12:03:01.000Z")).toBe(false);
    expect(await releaseFailedOutboxClaim(d1, old!, "2026-11-16T12:03:01.000Z")).toBe(false);
    expect(await completeOutboxClaim(d1, fresh!, "2026-11-16T12:03:02.000Z")).toBe(true);
  });

  it("backs off failed claims and permanently stops auto-claiming after capped attempts", async () => {
    const { db, d1 } = createDb();
    seed(db);
    let when = Date.parse(NOW);
    for (let attempt = 1; attempt <= OUTBOX_MAX_ATTEMPTS; attempt++) {
      const instant = new Date(when).toISOString();
      const claim = await claimNextOutbox(d1, instant);
      expect(claim?.attempt).toBe(attempt);
      expect(await releaseFailedOutboxClaim(d1, claim!, instant)).toBe(true);
      const row = db
        .prepare("SELECT next_attempt_at, attempts, delivered_at FROM outbox")
        .get() as {
        next_attempt_at: string;
        attempts: number;
        delivered_at: string | null;
      };
      expect(row.attempts).toBe(attempt);
      expect(row.delivered_at).toBeNull();
      expect(Date.parse(row.next_attempt_at)).toBeGreaterThan(when);
      expect(await claimNextOutbox(d1, instant)).toBeNull();
      when = Date.parse(row.next_attempt_at);
    }
    expect(await claimNextOutbox(d1, new Date(when + 86400_000).toISOString())).toBeNull();
    expect(db.prepare("SELECT COUNT(*) AS c FROM enquiries").get()).toEqual({ c: 1 });
  });

  it("rejects malformed dates, refuses stale success and ignores unrelated event kinds", async () => {
    const { db, d1 } = createDb();
    seed(db);
    for (const time of ["", "yesterday", "2026-02-30T12:00:00.000Z", "2026-11-16"]) {
      await expect(claimNextOutbox(d1, time)).rejects.toThrow("Invalid outbox timestamp");
    }
    const claim = await claimNextOutbox(d1, NOW);
    expect(await completeOutboxClaim(d1, claim!, "2026-11-16T12:02:01.000Z")).toBe(false);
    const row = db.prepare("SELECT delivered_at FROM outbox").get() as {
      delivered_at: string | null;
    };
    expect(row.delivered_at).toBeNull();
    db.prepare("UPDATE outbox SET kind = 'unapproved.kind'").run();
    expect(await claimNextOutbox(d1, "2026-11-16T12:05:00.000Z")).toBeNull();
  });
});
