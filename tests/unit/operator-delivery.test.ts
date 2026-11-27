import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import {
  readDeliveryOverview,
  readHeldDeliveries,
  type DeliveryD1,
} from "../../src/worker/operator-delivery";

const NOW = "2026-11-26T10:00:00.000Z";

function fixture() {
  const raw = new DatabaseSync(":memory:");
  for (const migration of [
    "0001_enquiries.sql",
    "0002_outbox_leases.sql",
    "0004_email_delivery_state.sql",
  ]) {
    raw.exec(readFileSync(`migrations/${migration}`, "utf8"));
  }
  raw.exec("PRAGMA foreign_keys = OFF");
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: string[]) {
          return {
            async first() {
              return raw.prepare(sql).get(...args);
            },
            async all() {
              return { results: raw.prepare(sql).all(...args) };
            },
          };
        },
      };
    },
  } as unknown as DeliveryD1;
  return { raw, db };
}

describe("operator delivery overview", () => {
  it("returns only aggregate counts and separates active final leases from exhausted events", async () => {
    const { raw, db } = fixture();
    try {
      const insert = raw.prepare(
        "INSERT INTO outbox (id, enquiry_id, kind, created_at, attempts, delivered_at, " +
          "accepted_provider_id, held_reason, lease_until, next_attempt_at) " +
          "VALUES (?1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
      );
      const future = "2026-11-26T10:01:00.000Z";
      const past = "2026-11-26T09:59:00.000Z";
      insert.run("a", "enquiry.created", NOW, 1, NOW, "private-provider-id", null, null, null);
      insert.run("b", "enquiry.created", NOW, 1, NOW, null, null, null, null);
      insert.run("c", "enquiry.created", NOW, 8, null, null, "provider", null, null);
      insert.run("d", "enquiry.created", NOW, 8, null, null, null, future, null);
      insert.run("e", "enquiry.created", NOW, 8, null, null, null, past, null);
      insert.run("f", "enquiry.created", NOW, 1, null, null, null, null, future);
      insert.run("g", "enquiry.created", NOW, 0, null, null, null, null, null);
      insert.run("h", "other.kind", NOW, 0, null, null, null, null, null);
      expect(await readDeliveryOverview(db, NOW)).toEqual({
        total: 7,
        accepted: 1,
        unconfirmed: 1,
        held: 2,
        leased: 1,
        retry: 1,
        ready: 1,
      });
      expect(raw.prepare("SELECT COUNT(*) AS c FROM outbox").get()).toEqual({ c: 8 });
    } finally {
      raw.close();
    }
  });

  it("returns zeros on an empty outbox and rejects invalid clocks", async () => {
    const { raw, db } = fixture();
    try {
      expect(await readDeliveryOverview(db, NOW)).toEqual({
        total: 0,
        accepted: 0,
        unconfirmed: 0,
        held: 0,
        leased: 0,
        retry: 0,
        ready: 0,
      });
      await expect(readDeliveryOverview(db, "bad")).rejects.toThrow("Invalid overview clock");
    } finally {
      raw.close();
    }
  });
});

const id = (n: number) => `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
function addHeld(raw: DatabaseSync, n: number, options: Record<string, unknown> = {}) {
  const values = {
    createdAt: NOW,
    attempts: 8,
    deliveredAt: null,
    reason: null,
    leaseUntil: null,
    kind: "enquiry.created",
    ...options,
  };
  raw
    .prepare(
      "INSERT INTO outbox (id,enquiry_id,kind,created_at,attempts,delivered_at,held_reason,lease_until) VALUES (?,?,?,?,?,?,?,?)",
    )
    .run(
      id(n),
      id(n),
      values.kind,
      values.createdAt,
      values.attempts,
      values.deliveredAt,
      values.reason,
      values.leaseUntil,
    );
}

describe("operator held delivery metadata", () => {
  it("matches held overview precedence and returns only minimal metadata", async () => {
    const { raw, db } = fixture();
    try {
      addHeld(raw, 1, { reason: "provider" });
      addHeld(raw, 2, { leaseUntil: "2026-11-26T10:01:00.000Z" });
      addHeld(raw, 3, { leaseUntil: NOW });
      addHeld(raw, 4, { deliveredAt: NOW, reason: "provider" });
      addHeld(raw, 5, { attempts: 0, createdAt: "2026-11-24T10:00:00.000Z" });
      addHeld(raw, 6, { kind: "other.kind" });
      addHeld(raw, 7, {
        attempts: 0,
        reason: "invalid_event",
        leaseUntil: "2026-11-26T10:01:00.000Z",
      });
      const result = await readHeldDeliveries(db, NOW);
      expect(result).toEqual({
        events: [
          { id: id(1), createdAt: NOW, attempts: 8, reason: "provider", window: "within_window" },
          {
            id: id(3),
            createdAt: NOW,
            attempts: 8,
            reason: "attempts_exhausted",
            window: "within_window",
          },
          {
            id: id(7),
            createdAt: NOW,
            attempts: 0,
            reason: "invalid_event",
            window: "within_window",
          },
        ],
        nextCursor: null,
      });
      expect((await readDeliveryOverview(db, NOW)).held).toBe(result.events.length);
      expect(raw.prepare("SELECT COUNT(*) AS c FROM outbox").get()).toEqual({ c: 7 });
    } finally {
      raw.close();
    }
  });

  it("pages timestamp ties stably with bounded limits", async () => {
    const { raw, db } = fixture();
    try {
      for (let n = 1; n <= 102; n++) addHeld(raw, n);
      const first = await readHeldDeliveries(db, NOW, { limit: "1" });
      expect(first.events.map((e) => e.id)).toEqual([id(1)]);
      expect(first.nextCursor).toEqual({ createdAt: NOW, id: id(1) });
      const second = await readHeldDeliveries(db, NOW, { limit: "1", after: NOW, afterId: id(1) });
      expect(second.events.map((e) => e.id)).toEqual([id(2)]);
      expect((await readHeldDeliveries(db, NOW, { limit: "999" })).events).toHaveLength(100);
      expect((await readHeldDeliveries(db, NOW)).events).toHaveLength(25);
      const last = await readHeldDeliveries(db, NOW, { after: NOW, afterId: id(102) });
      expect(last).toEqual({ events: [], nextCursor: null });
    } finally {
      raw.close();
    }
  });

  it("classifies age independently and keeps future canonical clocks under review", async () => {
    const { raw, db } = fixture();
    try {
      addHeld(raw, 1, { createdAt: "2026-11-25T11:00:00.000Z" });
      addHeld(raw, 2, { createdAt: "2026-11-25T11:00:00.001Z" });
      addHeld(raw, 3, { createdAt: "2026-11-26T10:00:00.001Z" });
      expect((await readHeldDeliveries(db, NOW)).events.map((e) => e.window)).toEqual([
        "expired",
        "within_window",
        "invalid_clock",
      ]);
    } finally {
      raw.close();
    }
  });

  it("rejects invalid queries before reading D1", async () => {
    const unreachable = {
      prepare: () => {
        throw new Error("must not query");
      },
    } as unknown as DeliveryD1;
    for (const query of [
      { after: NOW },
      { afterId: id(1) },
      { after: "2026-02-30T10:00:00.000Z", afterId: id(1) },
      { after: NOW, afterId: "bad" },
    ]) {
      await expect(readHeldDeliveries(unreachable, NOW, query)).rejects.toThrow("invalid_cursor");
    }
    for (const limit of ["0", "-1", "1.5", "bad", "", "1e2"]) {
      await expect(readHeldDeliveries(unreachable, NOW, { limit })).rejects.toThrow(
        "invalid_limit",
      );
    }
  });

  it.each([{ attempts: -1 }, { attempts: 1.5 }, { createdAt: "not-a-clock" }])(
    "fails closed on malformed stored metadata: %j",
    async (options) => {
      const { raw, db } = fixture();
      try {
        addHeld(raw, 1, { reason: "provider", ...options });
        await expect(readHeldDeliveries(db, NOW)).rejects.toThrow("Invalid held delivery metadata");
      } finally {
        raw.close();
      }
    },
  );

  it("normalizes unknown legacy reasons without echoing raw content", async () => {
    const { raw, db } = fixture();
    try {
      raw.exec("PRAGMA ignore_check_constraints = ON");
      addHeld(raw, 1, { reason: "private unrecognized reason <img>" });
      const result = await readHeldDeliveries(db, NOW);
      expect(result.events[0]?.reason).toBe("unknown");
      expect(JSON.stringify(result)).not.toContain("private unrecognized");
      await expect(readHeldDeliveries(db, "2026-02-30T10:00:00.000Z")).rejects.toThrow(
        "Invalid held delivery clock",
      );
      raw.prepare("UPDATE outbox SET id = ?").run("not-an-id");
      await expect(readHeldDeliveries(db, NOW)).rejects.toThrow("Invalid held delivery metadata");
    } finally {
      raw.close();
    }
  });

  it("selects no payload, enquiry link, provider identifier or claim token and uses pending-order index", async () => {
    const { raw, db } = fixture();
    try {
      addHeld(raw, 1);
      const queries: string[] = [];
      const recording = {
        ...db,
        prepare: (sql: string) => {
          queries.push(sql);
          return db.prepare(sql);
        },
      };
      await readHeldDeliveries(recording, NOW);
      expect(queries).toHaveLength(1);
      expect(queries[0]).not.toMatch(
        /notice_json|payload_json|enquiry_id|accepted_provider_id|claim_token/,
      );
      const plan = raw.prepare("EXPLAIN QUERY PLAN " + queries[0]).all(NOW, 8, null, null, 26);
      expect(JSON.stringify(plan)).toContain("idx_outbox_claimable");
      expect(JSON.stringify(plan)).not.toContain("TEMP B-TREE");
      await readHeldDeliveries(recording, NOW, { after: NOW, afterId: id(1) });
      const pagedPlan = JSON.stringify(
        raw.prepare("EXPLAIN QUERY PLAN " + queries[1]).all(NOW, 8, NOW, id(1), 26),
      );
      expect(pagedPlan).toContain("SEARCH outbox USING INDEX idx_outbox_claimable");
      expect(pagedPlan).not.toContain("TEMP B-TREE");
    } finally {
      raw.close();
    }
  });
});
