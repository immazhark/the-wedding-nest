import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it, vi } from "vitest";
import { consumeOneOperatorEmail } from "../../src/worker/notification-consumer";
import type { D1Like, D1PreparedLike } from "../../src/worker/types";

const ID = "11111111-2222-4333-8444-555555555555";
const EVENT = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
const PROVIDER = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const START = "2026-11-24T12:00:00.000Z";
const config = { enabled: "true", domainVerified: true, apiKey: "re_fictional_test_only" };
const enquiry = {
  occasions: ["nikah"],
  scope: "full-planning",
  services: [],
  styles: [],
  date: { kind: "undecided" },
  guestCount: "350",
  location: "Mehdipatnam",
  budget: "discuss",
  notes: "Fictional event",
  name: "Fictional Customer",
  phone: "+91 98765 43210",
  contactChannel: "whatsapp",
  consent: true,
  marketingConsent: false,
};
function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  for (const file of [
    "0001_enquiries.sql",
    "0002_outbox_leases.sql",
    "0004_email_delivery_state.sql",
  ])
    db.exec(readFileSync(`migrations/${file}`, "utf8"));
  const prepare = (sql: string): D1PreparedLike => {
    let args: unknown[] = [];
    const stmt = {
      bind(...v: unknown[]) {
        args = v;
        return stmt;
      },
      async first<T>() {
        return (db.prepare(sql).get(...(args as never[])) ?? null) as T | null;
      },
      async run() {
        return { meta: { changes: Number(db.prepare(sql).run(...(args as never[])).changes) } };
      },
    };
    return stmt;
  };
  const d1: D1Like = {
    prepare,
    async batch() {
      throw new Error("unexpected batch");
    },
  };
  db.prepare(
    "INSERT INTO enquiries(id,idempotency_key,created_at,payload_json,consent_at) VALUES(?,?,?,?,?)",
  ).run(ID, PROVIDER, START, JSON.stringify(enquiry), START);
  db.prepare(
    "INSERT INTO outbox(id,enquiry_id,kind,created_at) VALUES(?,?,'enquiry.created',?)",
  ).run(EVENT, ID, START);
  return { db, d1 };
}
const accepted = () => new Response(JSON.stringify({ id: PROVIDER }));
const clock = () => new Date(START);

describe("dormant single-event email consumer", () => {
  it("does not even claim or read private records while disabled", async () => {
    const { db, d1 } = setup();
    const fetcher = vi.fn();
    expect(
      await consumeOneOperatorEmail(d1, { ...config, enabled: "false" }, clock, fetcher),
    ).toEqual({ status: "disabled" });
    expect(db.prepare("SELECT attempts,notice_json FROM outbox").get()).toEqual({
      attempts: 0,
      notice_json: null,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("freezes a validated notice before sending and records acceptance atomically", async () => {
    const { db, d1 } = setup();
    const fetcher = vi.fn(async () => {
      expect(db.prepare("SELECT notice_json FROM outbox").get()?.notice_json).toContain(
        "Fictional Customer",
      );
      return accepted();
    });
    expect(await consumeOneOperatorEmail(d1, config, clock, fetcher)).toEqual({
      status: "accepted",
    });
    expect(
      db.prepare("SELECT delivered_at,accepted_provider_id,claim_token FROM outbox").get(),
    ).toEqual({ delivered_at: START, accepted_provider_id: PROVIDER, claim_token: null });
    expect(await consumeOneOperatorEmail(d1, config, clock, fetcher)).toEqual({ status: "idle" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("reuses identical content and key after retry even when the enquiry is edited", async () => {
    const { db, d1 } = setup();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("private error", { status: 503 }))
      .mockImplementation(async () => accepted());
    expect(await consumeOneOperatorEmail(d1, config, clock, fetcher)).toEqual({ status: "retry" });
    db.prepare("UPDATE enquiries SET payload_json=?").run(
      JSON.stringify({ ...enquiry, name: "Changed Name" }),
    );
    expect(
      await consumeOneOperatorEmail(
        d1,
        config,
        () => new Date("2026-11-24T12:01:00.000Z"),
        fetcher,
      ),
    ).toEqual({ status: "accepted" });
    expect(fetcher.mock.calls[0]![1].body).toBe(fetcher.mock.calls[1]![1].body);
    expect(fetcher.mock.calls[0]![1].headers["Idempotency-Key"]).toBe(
      fetcher.mock.calls[1]![1].headers["Idempotency-Key"],
    );
  });
  it("only one concurrent consumer sends an event", async () => {
    const { d1 } = setup();
    const fetcher = vi.fn().mockImplementation(async () => accepted());
    await Promise.all([
      consumeOneOperatorEmail(d1, config, clock, fetcher),
      consumeOneOperatorEmail(d1, config, clock, fetcher),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("holds invalid stored data without exposing it or calling a provider", async () => {
    const { db, d1 } = setup();
    db.prepare("UPDATE enquiries SET payload_json=?").run("private invalid JSON");
    const fetcher = vi.fn();
    expect(await consumeOneOperatorEmail(d1, config, clock, fetcher)).toEqual({ status: "held" });
    expect(db.prepare("SELECT held_reason,attempts FROM outbox").get()).toEqual({
      held_reason: "invalid_event",
      attempts: 8,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("holds stale events and permanent provider failures without endless retries", async () => {
    const { db, d1 } = setup();
    const fetcher = vi.fn(async () => new Response("private", { status: 401 }));
    expect(await consumeOneOperatorEmail(d1, config, clock, fetcher)).toEqual({ status: "held" });
    expect(await consumeOneOperatorEmail(d1, config, clock, fetcher)).toEqual({ status: "idle" });
    expect(db.prepare("SELECT held_reason FROM outbox").get()?.held_reason).toBe("provider");
    const second = setup();
    const unused = vi.fn();
    expect(
      await consumeOneOperatorEmail(
        second.d1,
        config,
        () => new Date("2026-11-25T11:00:00.000Z"),
        unused,
      ),
    ).toEqual({ status: "held" });
    expect(unused).not.toHaveBeenCalled();
  });
  it("does not acknowledge an expired lease even if a provider accepted", async () => {
    const { db, d1 } = setup();
    let current = START;
    const fetcher = vi.fn(async () => {
      current = "2026-11-24T12:03:00.000Z";
      return accepted();
    });
    expect(await consumeOneOperatorEmail(d1, config, () => new Date(current), fetcher)).toEqual({
      status: "lease_lost",
    });
    expect(db.prepare("SELECT delivered_at FROM outbox").get()?.delivered_at).toBeNull();
  });
  it("holds exhausted transient failures and cascades snapshot removal on deletion", async () => {
    const { db, d1 } = setup();
    db.prepare("UPDATE outbox SET attempts=7").run();
    expect(
      await consumeOneOperatorEmail(
        d1,
        config,
        clock,
        vi.fn(async () => new Response("", { status: 503 })),
      ),
    ).toEqual({ status: "held" });
    expect(db.prepare("SELECT held_reason FROM outbox").get()?.held_reason).toBe(
      "attempts_exhausted",
    );
    db.prepare("DELETE FROM enquiries").run();
    expect(db.prepare("SELECT COUNT(*) AS n FROM outbox").get()?.n).toBe(0);
  });
  it("database rejects changes to frozen notice and event identity", async () => {
    const { db, d1 } = setup();
    await consumeOneOperatorEmail(
      d1,
      config,
      clock,
      vi.fn(async () => accepted()),
    );
    expect(() => db.prepare("UPDATE outbox SET notice_json='{}'").run()).toThrow();
    expect(() =>
      db.prepare("UPDATE outbox SET created_at='2026-11-25T00:00:00.000Z'").run(),
    ).toThrow();
  });
  it("never sends when freezing the snapshot fails", async () => {
    const { d1 } = setup();
    const fetcher = vi.fn();
    const failing: D1Like = {
      ...d1,
      prepare(sql) {
        if (sql.includes("SET notice_json")) throw new Error("private database failure");
        return d1.prepare(sql);
      },
    };
    expect(await consumeOneOperatorEmail(failing, config, clock, fetcher)).toEqual({
      status: "storage_error",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("replays the same payload/key after provider acceptance but failed database acknowledgement", async () => {
    const { db, d1 } = setup();
    const failing: D1Like = {
      ...d1,
      prepare(sql) {
        if (sql.includes("SET delivered_at")) throw new Error("private ACK failure");
        return d1.prepare(sql);
      },
    };
    const fetcher = vi.fn().mockImplementation(async () => accepted());
    expect(await consumeOneOperatorEmail(failing, config, clock, fetcher)).toEqual({
      status: "storage_error",
    });
    expect(db.prepare("SELECT delivered_at FROM outbox").get()?.delivered_at).toBeNull();
    expect(
      await consumeOneOperatorEmail(
        d1,
        config,
        () => new Date("2026-11-24T12:03:00.000Z"),
        fetcher,
      ),
    ).toEqual({ status: "accepted" });
    expect(fetcher.mock.calls[0]![1].body).toBe(fetcher.mock.calls[1]![1].body);
    expect(fetcher.mock.calls[0]![1].headers["Idempotency-Key"]).toBe(
      fetcher.mock.calls[1]![1].headers["Idempotency-Key"],
    );
  });
  it("holds snapshots from a different transport contract without sending", async () => {
    const { db, d1 } = setup();
    const fetcher = vi.fn();
    db.prepare("UPDATE outbox SET notice_json=?,notice_version=99").run(
      JSON.stringify({ enquiryId: ID, subject: "old", text: "private" }),
    );
    expect(await consumeOneOperatorEmail(d1, config, clock, fetcher)).toEqual({ status: "held" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not start a provider request when the lease expires before sending", async () => {
    const { d1 } = setup();
    let calls = 0;
    const fetcher = vi.fn();
    const movingClock = () => new Date(++calls >= 5 ? "2026-11-24T12:02:00.000Z" : START);
    expect(await consumeOneOperatorEmail(d1, config, movingClock, fetcher)).toEqual({
      status: "lease_lost",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
