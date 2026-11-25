import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { advanceEnquiryStatus } from "../../src/worker/operator-status";
import type { D1Like, D1PreparedLike } from "../../src/worker/types";

const ID = "12345678-1234-1234-1234-123456789abc";
function fixture(status = "new", closed: string | null = null) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_enquiries.sql", "utf8"));
  sqlite.exec(readFileSync("migrations/0003_unsuccessful_retention.sql", "utf8"));
  sqlite
    .prepare(
      "INSERT INTO enquiries (id,idempotency_key,created_at,payload_json,consent_at,status,unsuccessful_at) VALUES (?1,?1,'2026-01-01T00:00:00.000Z','{}','2026-01-01T00:00:00.000Z',?2,?3)",
    )
    .run(ID, status, closed);
  const db: D1Like = {
    prepare(sql) {
      let args: unknown[] = [];
      const statement: D1PreparedLike = {
        bind(...values) {
          args = values;
          return statement;
        },
        async first<T>() {
          return (sqlite.prepare(sql).get(...(args as never[])) ?? null) as T | null;
        },
        async run() {
          return {
            meta: { changes: Number(sqlite.prepare(sql).run(...(args as never[])).changes) },
          };
        },
      };
      return statement;
    },
    async batch() {
      throw new Error("Not used by status transitions");
    },
  };
  return { db, sqlite };
}

describe("dormant operator status transitions", () => {
  it.each([
    ["new", "contacted"],
    ["new", "in_progress"],
    ["new", "booked"],
    ["contacted", "in_progress"],
    ["contacted", "booked"],
    ["in_progress", "booked"],
  ])("advances %s to %s without starting retention", async (from, to) => {
    const { db, sqlite } = fixture(from);
    try {
      expect(await advanceEnquiryStatus(db, ID, from, to)).toBe(true);
      expect(sqlite.prepare("SELECT status, unsuccessful_at FROM enquiries").get()).toEqual({
        status: to,
        unsuccessful_at: null,
      });
    } finally {
      sqlite.close();
    }
  });

  it("rejects a stale operator action without overwriting another decision", async () => {
    const { db, sqlite } = fixture();
    try {
      expect(await advanceEnquiryStatus(db, ID, "new", "contacted")).toBe(true);
      expect(await advanceEnquiryStatus(db, ID, "new", "booked")).toBe(false);
      expect(sqlite.prepare("SELECT status FROM enquiries").get()).toEqual({ status: "contacted" });
    } finally {
      sqlite.close();
    }
  });

  it.each(["booked", "unsuccessful", "unknown"])(
    "protects a stored %s disposition",
    async (status) => {
      const { db, sqlite } = fixture(status);
      try {
        expect(await advanceEnquiryStatus(db, ID, "new", "contacted")).toBe(false);
      } finally {
        sqlite.close();
      }
    },
  );

  it("protects inconsistent records with an existing retention clock", async () => {
    const { db, sqlite } = fixture("new", "2026-01-02T00:00:00.000Z");
    try {
      expect(await advanceEnquiryStatus(db, ID, "new", "booked")).toBe(false);
    } finally {
      sqlite.close();
    }
  });

  it("leaves a missing record and its notifications untouched", async () => {
    const { db, sqlite } = fixture();
    try {
      sqlite
        .prepare(
          "INSERT INTO outbox (id,enquiry_id,kind,created_at) VALUES ('notice',?1,'enquiry.created','2026-01-01T00:00:00.000Z')",
        )
        .run(ID);
      const before = sqlite.prepare("SELECT * FROM outbox").all();
      expect(
        await advanceEnquiryStatus(db, "12345678-1234-1234-1234-123456789abd", "new", "booked"),
      ).toBe(false);
      expect(await advanceEnquiryStatus(db, ID, "new", "booked")).toBe(true);
      expect(sqlite.prepare("SELECT * FROM outbox").all()).toEqual(before);
    } finally {
      sqlite.close();
    }
  });

  it.each([
    ["new", "new"],
    ["in_progress", "contacted"],
    ["booked", "contacted"],
    ["new", "unsuccessful"],
    ["bad", "booked"],
    [null, "booked"],
    ["new", {}],
  ])("rejects invalid transition %j to %j before database access", async (from, to) => {
    const db = {
      prepare() {
        throw new Error("Database must not be touched");
      },
    } as unknown as D1Like;
    await expect(advanceEnquiryStatus(db, ID, from, to)).rejects.toThrow(
      "Invalid enquiry status transition",
    );
  });

  it("rejects malformed identifiers before database access", async () => {
    const db = {
      prepare() {
        throw new Error("Database must not be touched");
      },
    } as unknown as D1Like;
    await expect(advanceEnquiryStatus(db, "' OR 1=1", "new", "booked")).rejects.toThrow(
      "Invalid enquiry id",
    );
  });
});
