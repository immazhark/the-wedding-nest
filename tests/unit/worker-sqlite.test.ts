/**
 * Runs the real handler SQL against the real migration on SQLite (D1's engine) via node:sqlite,
 * so schema/statement mismatches are caught without Cloudflare access.
 */
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { handleEnquiry } from "../../src/worker/enquiry";
import {
  deleteEnquiryRecord,
  previewRetentionImpact,
  markEnquiryUnsuccessful,
  previewUnsuccessfulRetention,
  deleteExpiredUnsuccessfulEnquiries,
} from "../../src/worker/privacy";
import type { D1Like, D1PreparedLike } from "../../src/worker/types";

function sqliteD1(): { d1: D1Like; db: DatabaseSync } {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(readFileSync("migrations/0001_enquiries.sql", "utf8"));
  const prepare = (sql: string): D1PreparedLike & { exec(): number } => {
    let args: unknown[] = [];
    const stmt = {
      bind(...values: unknown[]) {
        args = values;
        return stmt;
      },
      async first<T>() {
        return (db.prepare(sql).get(...(args as never[])) ?? null) as T | null;
      },
      async run() {
        return { meta: { changes: Number(db.prepare(sql).run(...(args as never[])).changes) } };
      },
      exec() {
        return Number(db.prepare(sql).run(...(args as never[])).changes);
      },
    };
    return stmt;
  };
  const d1: D1Like = {
    prepare,
    async batch(stmts) {
      db.exec("BEGIN");
      try {
        const out = stmts.map((s) => ({
          meta: { changes: (s as ReturnType<typeof prepare>).exec() },
        }));
        db.exec("COMMIT");
        return out;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return { d1, db };
}

const enquiry = {
  occasions: ["walima"],
  scope: "specific-services",
  services: ["catering"],
  styles: ["heritage"],
  date: { kind: "date", value: "2027-03-01" },
  guestCount: "300",
  location: "",
  budget: null,
  notes: "",
  name: "Sample Person",
  phone: "+91 98765 43210",
  contactChannel: "call",
  consent: true,
  marketingConsent: true,
};

const req = (key: string, entry = enquiry) =>
  new Request("https://staging.example.test/api/enquiry", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://staging.example.test",
      "idempotency-key": key,
    },
    body: JSON.stringify({ turnstileToken: "t", enquiry: entry }),
  });

describe("enquiry handler against the real D1 schema (SQLite)", () => {
  it("writes one enquiry + one outbox row, and a retry adds nothing", async () => {
    const { d1, db } = sqliteD1();
    const env = {
      ENQUIRIES_ENABLED: "true",
      ALLOWED_ORIGINS: "https://staging.example.test",
      TURNSTILE_SECRET: "s",
      DB: d1,
    };
    const deps = {
      fetch: (async () => Response.json({ success: true })) as unknown as typeof fetch,
      log: () => {},
    };
    const key = "11111111-2222-4333-8444-555555555555";

    const first = await handleEnquiry(req(key), env, deps);
    expect(first.status).toBe(201);
    const { id } = (await first.json()) as { id: string };

    const retry = await handleEnquiry(req(key), env, deps);
    expect(retry.status).toBe(200);
    expect(((await retry.json()) as { id: string }).id).toBe(id);

    const row = db.prepare("SELECT * FROM enquiries").get() as Record<string, unknown>;
    expect(row["id"]).toBe(id);
    expect(row["marketing_consent"]).toBe(1);
    expect(JSON.parse(String(row["payload_json"])).services).toEqual(["catering"]);
    expect(db.prepare("SELECT COUNT(*) AS c FROM enquiries").get()).toEqual({ c: 1 });
    expect(db.prepare("SELECT enquiry_id, kind FROM outbox").all()).toEqual([
      { enquiry_id: id, kind: "enquiry.created" },
    ]);
  });
});

describe("idempotency key bound to the real stored SQLite enquiry", () => {
  it("does not confirm altered name, phone, or consent under the same key", async () => {
    const { d1, db } = sqliteD1();
    const env = {
      ENQUIRIES_ENABLED: "true",
      ALLOWED_ORIGINS: "https://staging.example.test",
      TURNSTILE_SECRET: "s",
      DB: d1,
    };
    let verifications = 0;
    const deps = {
      fetch: (async () => {
        verifications++;
        return Response.json({ success: true });
      }) as unknown as typeof fetch,
      log: () => {},
    };
    const key = "11111111-2222-4333-8444-555555555555";
    const original = await handleEnquiry(req(key), env, deps);
    const originalId = ((await original.json()) as { id: string }).id;

    const changed = await handleEnquiry(
      req(key, { ...enquiry, name: "Updated Person" }),
      env,
      deps,
    );
    expect(changed.status).toBe(409);
    expect(await changed.json()).toEqual({ error: "idempotency_conflict" });

    const invalid = await handleEnquiry(req(key, { ...enquiry, consent: false }), env, deps);
    expect(invalid.status).toBe(422);

    const retry = await handleEnquiry(req(key), env, deps);
    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({ id: originalId });

    expect(verifications).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS c FROM enquiries").get()).toEqual({ c: 1 });
    expect(db.prepare("SELECT COUNT(*) AS c FROM outbox").get()).toEqual({ c: 1 });
    const record = db.prepare("SELECT payload_json FROM enquiries").get() as {
      payload_json: string;
    };
    expect(JSON.parse(record.payload_json).name).toBe("Sample Person");
  });
});

describe("explicit enquiry deletion using the real D1 migration", () => {
  it("deletes only the authorised record and cascades to its pending outbox event", async () => {
    const { d1, db } = sqliteD1();
    const env = {
      ENQUIRIES_ENABLED: "true",
      ALLOWED_ORIGINS: "https://staging.example.test",
      TURNSTILE_SECRET: "s",
      DB: d1,
    };
    const deps = {
      fetch: (async () => Response.json({ success: true })) as unknown as typeof fetch,
      log: () => {},
    };
    const first = await handleEnquiry(req("11111111-2222-4333-8444-555555555555"), env, deps);
    const second = await handleEnquiry(req("11111111-2222-4333-8444-666666666666"), env, deps);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const { id: firstId } = (await first.json()) as { id: string };
    const { id: secondId } = (await second.json()) as { id: string };

    expect(await deleteEnquiryRecord(d1, firstId)).toBe(true);
    expect(db.prepare("SELECT id FROM enquiries").all()).toEqual([{ id: secondId }]);
    expect(db.prepare("SELECT enquiry_id FROM outbox").all()).toEqual([{ enquiry_id: secondId }]);
    expect(await deleteEnquiryRecord(d1, firstId)).toBe(false);
    await expect(deleteEnquiryRecord(d1, "' OR 1=1 --")).rejects.toThrow("Invalid enquiry id");
    expect(db.prepare("SELECT COUNT(*) AS c FROM enquiries").get()).toEqual({ c: 1 });
    expect(db.prepare("SELECT COUNT(*) AS c FROM outbox").get()).toEqual({ c: 1 });
  });
});

describe("read-only retention planning against real SQLite/D1 migration", () => {
  it("counts only pre-cutoff records, including queued notifications, without exposing personal data", async () => {
    const { d1, db } = sqliteD1();
    const add = (id: string, at: string, status: string, name: string) => {
      db.prepare(
        "INSERT INTO enquiries " +
          "(id, idempotency_key, created_at, payload_json, consent_at, marketing_consent, status) " +
          "VALUES (?1, ?1, ?2, ?3, ?2, 0, ?4)",
      ).run(id, at, JSON.stringify({ name, phone: "+91 9000000000" }), status);
    };
    const oldNew = "11111111-2222-4333-8444-111111111111";
    const oldBooked = "22222222-3333-4444-8555-222222222222";
    const recent = "33333333-4444-4555-8666-333333333333";
    add(oldNew, "2026-01-01T00:00:00.000Z", "new", "Private A");
    add(oldBooked, "2026-01-02T00:00:00.000Z", "booked", "Private B");
    add(recent, "2026-07-01T00:00:00.000Z", "new", "Private C");
    db.prepare(
      "INSERT INTO outbox (id, enquiry_id, kind, created_at) VALUES (?1, ?2, 'enquiry.created', ?3)",
    ).run("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", oldNew, "2026-01-01T00:00:00.000Z");

    const preview = await previewRetentionImpact(d1, "2026-06-01T00:00:00.000Z");
    expect(preview).toEqual({
      candidateCount: 2,
      nonNewCount: 1,
      pendingOutboxCount: 1,
    });
    expect(JSON.stringify(preview)).not.toContain("Private");
    expect(JSON.stringify(preview)).not.toContain("9000000000");
    expect(db.prepare("SELECT COUNT(*) AS c FROM enquiries").get()).toEqual({ c: 3 });
    expect(db.prepare("SELECT COUNT(*) AS c FROM outbox").get()).toEqual({ c: 1 });
  });

  it("has zero counts with no rows and refuses malformed date cutoffs", async () => {
    const { d1 } = sqliteD1();
    expect(await previewRetentionImpact(d1, "2026-06-01T00:00:00.000Z")).toEqual({
      candidateCount: 0,
      nonNewCount: 0,
      pendingOutboxCount: 0,
    });
    for (const cutoff of [
      "",
      "2026-02-30T00:00:00.000Z",
      "2026-06-01",
      "2026-06-01T00:00:00Z",
      "2026-06-01T00:00:00.000Z' OR 1=1 --",
    ]) {
      await expect(previewRetentionImpact(d1, cutoff)).rejects.toThrow(/Invalid retention cutoff/);
    }
  });
});

describe("owner-approved unsuccessful-enquiry retention", () => {
  const now = "2026-11-24T00:00:00.000Z";
  const cutoff = "2026-08-26T00:00:00.000Z";
  const id = "11111111-2222-4333-8444-111111111111";
  function setup() {
    const { d1, db } = sqliteD1();
    db.exec(readFileSync("migrations/0003_unsuccessful_retention.sql", "utf8"));
    const add = (key: string, status = "new", closed: string | null = null) => {
      db.prepare(
        "INSERT INTO enquiries (id,idempotency_key,created_at,payload_json,consent_at,marketing_consent,status,unsuccessful_at) " +
          "VALUES (?1,?1,'2026-01-01T00:00:00.000Z','{}','2026-01-01T00:00:00.000Z',0,?2,?3)",
      ).run(key, status, closed);
    };
    return { d1, db, add };
  }

  it("starts the clock only on an explicit unsuccessful disposition, without resetting it", async () => {
    const { d1, db, add } = setup();
    add(id);
    expect(await markEnquiryUnsuccessful(d1, id, "new", cutoff)).toBe(true);
    expect(await markEnquiryUnsuccessful(d1, id, "new", now)).toBe(false);
    expect(db.prepare("SELECT status,unsuccessful_at FROM enquiries").get()).toEqual({
      status: "unsuccessful",
      unsuccessful_at: cutoff,
    });
  });

  it.each(["booked", "unknown", "cancelled"])(
    "cannot automatically close a %s record",
    async (status) => {
      const { d1, db, add } = setup();
      add(id, status);
      expect(await markEnquiryUnsuccessful(d1, id, "new", cutoff)).toBe(false);
      expect(db.prepare("SELECT status FROM enquiries").get()).toEqual({ status });
    },
  );

  it("rejects an unsuccessful disposition based on a stale reviewed status", async () => {
    const { d1, db, add } = setup();
    add(id, "contacted");
    expect(await markEnquiryUnsuccessful(d1, id, "new", cutoff)).toBe(false);
    expect(db.prepare("SELECT status,unsuccessful_at FROM enquiries").get()).toEqual({
      status: "contacted",
      unsuccessful_at: null,
    });
    expect(await markEnquiryUnsuccessful(d1, id, "contacted", cutoff)).toBe(true);
  });

  it("can close a reviewed in-progress enquiry", async () => {
    const { d1, db, add } = setup();
    add(id, "in_progress");
    expect(await markEnquiryUnsuccessful(d1, id, "in_progress", cutoff)).toBe(true);
    expect(db.prepare("SELECT status,unsuccessful_at FROM enquiries").get()).toEqual({
      status: "unsuccessful",
      unsuccessful_at: cutoff,
    });
  });

  it.each(["booked", "unsuccessful", "unknown", null, {}])(
    "rejects an invalid reviewed status %j",
    async (status) => {
      const { d1, db, add } = setup();
      add(id);
      await expect(markEnquiryUnsuccessful(d1, id, status, cutoff)).rejects.toThrow(
        /Invalid expected enquiry status/,
      );
      expect(db.prepare("SELECT status,unsuccessful_at FROM enquiries").get()).toEqual({
        status: "new",
        unsuccessful_at: null,
      });
    },
  );

  it("retains active, booked, unknown-clock, recent and pending-delivery records", async () => {
    const { d1, db, add } = setup();
    add(id, "unsuccessful", cutoff);
    add("active", "new");
    add("booked", "booked", cutoff);
    add("unknown-clock", "unsuccessful");
    add("recent", "unsuccessful", "2026-08-26T00:00:00.001Z");
    add("pending", "unsuccessful", cutoff);
    db.prepare(
      "INSERT INTO outbox (id,enquiry_id,kind,created_at) VALUES ('event','pending','enquiry.created',?1)",
    ).run(cutoff);
    expect(await previewUnsuccessfulRetention(d1, now)).toEqual({
      eligibleCount: 1,
      pendingDeliveryCount: 1,
    });
    expect(await deleteExpiredUnsuccessfulEnquiries(d1, now)).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS c FROM enquiries").get()).toEqual({ c: 5 });
    expect(await previewUnsuccessfulRetention(d1, now)).toEqual({
      eligibleCount: 0,
      pendingDeliveryCount: 1,
    });
  });

  it("holds reversed and malformed stored creation clocks out of preview and deletion", async () => {
    const { d1, db, add } = setup();
    add(id, "unsuccessful", cutoff);
    add("reversed", "unsuccessful", cutoff);
    add("bad-created", "unsuccessful", cutoff);
    db.prepare("UPDATE enquiries SET created_at = ?1 WHERE id = 'reversed'").run(
      "2026-09-01T00:00:00.000Z",
    );
    db.prepare("UPDATE enquiries SET created_at = '' WHERE id = 'bad-created'").run();
    expect(await previewUnsuccessfulRetention(d1, now)).toEqual({
      eligibleCount: 1,
      pendingDeliveryCount: 0,
    });
    expect(await deleteExpiredUnsuccessfulEnquiries(d1, now)).toBe(1);
    expect(db.prepare("SELECT id FROM enquiries ORDER BY id").all()).toEqual([
      { id: "bad-created" },
      { id: "reversed" },
    ]);
  });

  it("holds noncanonical stored closure clocks even if a legacy constraint allowed them", async () => {
    const { d1, db, add } = setup();
    // Simulate a legacy or imported row without weakening any production schema.
    db.exec("PRAGMA ignore_check_constraints = ON");
    add(id, "unsuccessful", "2026-08-25T24:00:00.000Z");
    db.exec("PRAGMA ignore_check_constraints = OFF");
    expect(await previewUnsuccessfulRetention(d1, now)).toEqual({
      eligibleCount: 0,
      pendingDeliveryCount: 0,
    });
    expect(await deleteExpiredUnsuccessfulEnquiries(d1, now)).toBe(0);
  });

  it("does not close a record with an invalid stored creation clock", async () => {
    const { d1, db, add } = setup();
    add(id);
    db.prepare("UPDATE enquiries SET created_at = '' WHERE id = ?1").run(id);
    expect(await markEnquiryUnsuccessful(d1, id, "new", cutoff)).toBe(false);
    expect(db.prepare("SELECT status,unsuccessful_at FROM enquiries").get()).toEqual({
      status: "new",
      unsuccessful_at: null,
    });
  });

  it("bounds a deletion batch and cascades delivered events without returning identifiers", async () => {
    const { d1, db, add } = setup();
    add(id, "unsuccessful", cutoff);
    add("second", "unsuccessful", cutoff);
    db.prepare(
      "INSERT INTO outbox (id,enquiry_id,kind,created_at,delivered_at) VALUES ('done',?1,'enquiry.created',?2,?2)",
    ).run(id, cutoff);
    expect(await deleteExpiredUnsuccessfulEnquiries(d1, now, 1)).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS c FROM outbox").get()).toEqual({ c: 0 });
    expect(db.prepare("SELECT COUNT(*) AS c FROM enquiries").get()).toEqual({ c: 1 });
  });

  it("rejects malformed times, IDs and unsafe batch limits before database access", async () => {
    const { d1 } = setup();
    await expect(markEnquiryUnsuccessful(d1, "bad", "new", now)).rejects.toThrow(
      /Invalid enquiry id/,
    );
    await expect(
      markEnquiryUnsuccessful(d1, id, "new", "2026-02-30T00:00:00.000Z"),
    ).rejects.toThrow(/Invalid retention time/);
    await expect(previewUnsuccessfulRetention(d1, "2026-11-24")).rejects.toThrow(
      /Invalid retention time/,
    );
    for (const limit of [0, -1, 101, 1.5, NaN]) {
      await expect(deleteExpiredUnsuccessfulEnquiries(d1, now, limit)).rejects.toThrow(
        /Invalid retention batch/,
      );
    }
  });

  it("rechecks eligibility after a preview so a newly booked enquiry is protected", async () => {
    const { d1, db, add } = setup();
    add(id, "unsuccessful", cutoff);
    expect((await previewUnsuccessfulRetention(d1, now)).eligibleCount).toBe(1);
    db.prepare("UPDATE enquiries SET status = 'booked' WHERE id = ?1").run(id);
    expect(await deleteExpiredUnsuccessfulEnquiries(d1, now)).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS c FROM enquiries").get()).toEqual({ c: 1 });
  });

  it("does not manufacture a closure date for legacy records or accept invalid database times", async () => {
    const { d1, db } = sqliteD1();
    db.prepare(
      "INSERT INTO enquiries (id,idempotency_key,created_at,payload_json,consent_at,status) " +
        "VALUES (?1,?1,'2026-01-01T00:00:00.000Z','{}','2026-01-01T00:00:00.000Z','unsuccessful')",
    ).run(id);
    db.exec(readFileSync("migrations/0003_unsuccessful_retention.sql", "utf8"));
    expect(await deleteExpiredUnsuccessfulEnquiries(d1, now)).toBe(0);
    expect(() => db.prepare("UPDATE enquiries SET unsuccessful_at = 'not-a-time'").run()).toThrow();
    expect(() =>
      db.prepare("UPDATE enquiries SET unsuccessful_at = '2026-02-30T00:00:00.000Z'").run(),
    ).toThrow();
  });
});
