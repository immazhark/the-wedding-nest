import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { readDeliveryOverview } from "../../src/worker/operator-delivery";
import type { D1Like } from "../../src/worker/types";

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
          };
        },
      };
    },
  } as unknown as D1Like;
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
