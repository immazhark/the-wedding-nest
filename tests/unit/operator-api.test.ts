import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BODY_READ_TIMEOUT_MS } from "../../src/worker/request-body";
import { handleOperatorApi, type OperatorD1 } from "../../src/worker/operator-api";

const ID_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ID_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const NOW = "2026-12-01T10:00:00.000Z";

let sql: DatabaseSync;
let db: OperatorD1;
const logs: Record<string, unknown>[] = [];

function wrap(raw: DatabaseSync): OperatorD1 {
  return {
    prepare(q: string) {
      let args: unknown[] = [];
      const s = {
        bind(...v: unknown[]) {
          args = v;
          return s;
        },
        async first<T>() {
          return (raw.prepare(q).get(...(args as never[])) ?? null) as T | null;
        },
        async all<T>() {
          return { results: raw.prepare(q).all(...(args as never[])) as T[] };
        },
        async run() {
          return { meta: { changes: Number(raw.prepare(q).run(...(args as never[])).changes) } };
        },
      };
      return s;
    },
    async batch(statements: ReturnType<OperatorD1["prepare"]>[]) {
      raw.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        raw.exec("COMMIT");
        return results;
      } catch (error) {
        raw.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as OperatorD1;
}
const insert = (id: string, created: string, name: string, status = "new") =>
  sql
    .prepare(
      "INSERT INTO enquiries (id, idempotency_key, created_at, payload_json, consent_at, status) VALUES (?,?,?,?,?,?)",
    )
    .run(
      id,
      `k-${id}`,
      created,
      JSON.stringify({ name, phone: "+91 98765 43210", occasions: ["nikah"], notes: "<b>hi</b>" }),
      created,
      status,
    );

const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
  handleOperatorApi(
    new Request(`https://twn.test${path}`, {
      method,
      headers: { origin: "https://twn.test", "content-type": "application/json", ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    { db, operator: "owner@example.com", now: () => NOW, log: (e) => logs.push(e) },
  );

beforeEach(() => {
  sql = new DatabaseSync(":memory:");
  for (const f of readdirSync("migrations").sort())
    sql.exec(readFileSync(`migrations/${f}`, "utf8"));
  db = wrap(sql);
  logs.length = 0;
  insert(ID_A, "2026-11-30T09:00:00.000Z", "Older Person");
  insert(ID_B, "2026-12-01T09:00:00.000Z", "Newer Person");
});

describe("operator API", () => {
  it("lists newest first with a summary only, never no-store missing", async () => {
    const r = await call("GET", "/api/operator/enquiries");
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    const { enquiries } = (await r.json()) as { enquiries: Record<string, unknown>[] };
    expect(enquiries.map((e) => e.id)).toEqual([ID_B, ID_A]);
    expect(enquiries[0]).toMatchObject({
      name: "Newer Person",
      status: "new",
      occasions: ["nikah"],
    });
    expect(enquiries[0]).not.toHaveProperty("phone");
  });
  it("pages equal timestamps without skipping records or offering a phantom next page", async () => {
    const tiedId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const tiedAt = "2026-12-01T09:00:00.000Z";
    insert(tiedId, tiedAt, "Tied Person");
    const first = await call("GET", "/api/operator/enquiries?limit=1");
    expect(await first.json()).toMatchObject({
      enquiries: [{ id: tiedId }],
      nextCursor: { createdAt: tiedAt, id: tiedId },
    });
    const params = new URLSearchParams({ limit: "2", before: tiedAt, beforeId: tiedId });
    const next = await call("GET", `/api/operator/enquiries?${params}`);
    expect(await next.json()).toMatchObject({
      enquiries: [{ id: ID_B }, { id: ID_A }],
      nextCursor: null,
    });
  });

  it("rejects incomplete and invalid composite cursors", async () => {
    for (const cursor of [
      "before=2026-12-01T09:00:00.000Z",
      `beforeId=${ID_A}`,
      `before=2026-02-30T00:00:00.000Z&beforeId=${ID_A}`,
      "before=2026-12-01T09:00:00.000Z&beforeId=bad",
    ]) {
      const response = await call("GET", `/api/operator/enquiries?${cursor}`);
      expect(response.status).toBe(400);
    }
  });

  it("filters by status and caps the page size", async () => {
    sql.prepare("UPDATE enquiries SET status='contacted' WHERE id=?").run(ID_A);
    const r = await call("GET", "/api/operator/enquiries?status=contacted&limit=9999");
    expect(((await r.json()) as { enquiries: unknown[] }).enquiries).toHaveLength(1);
    expect((await call("GET", "/api/operator/enquiries?status=bogus")).status).toBe(400);
  });
  it("returns full detail for one valid id and 404 for unknown/malformed", async () => {
    const r = await call("GET", `/api/operator/enquiries/${ID_A}`);
    const d = (await r.json()) as {
      enquiry: { id: string; consentAt: string; payload: { phone: string } };
    };
    expect(d.enquiry.id).toBe(ID_A);
    expect(d.enquiry.consentAt).toBe("2026-11-30T09:00:00.000Z");
    expect(d.enquiry.payload.phone).toBe("+91 98765 43210");
    expect(
      (await call("GET", "/api/operator/enquiries/cccccccc-cccc-4ccc-8ccc-cccccccccccc")).status,
    ).toBe(404);
    expect((await call("GET", "/api/operator/enquiries/not-an-id")).status).toBe(404);
  });
  it("advances status and rejects a stale second attempt with 409", async () => {
    const ok = await call("POST", `/api/operator/enquiries/${ID_A}/status`, {
      from: "new",
      to: "contacted",
    });
    expect(ok.status).toBe(200);
    const stale = await call("POST", `/api/operator/enquiries/${ID_A}/status`, {
      from: "new",
      to: "in_progress",
    });
    expect(stale.status).toBe(409);
    expect(sql.prepare("SELECT status FROM enquiries WHERE id=?").get(ID_A)).toEqual({
      status: "contacted",
    });
  });
  it("starts the unsuccessful clock once and refuses to reopen", async () => {
    const ok = await call("POST", `/api/operator/enquiries/${ID_B}/status`, {
      from: "new",
      to: "unsuccessful",
    });
    expect(ok.status).toBe(200);
    expect(
      sql.prepare("SELECT status, unsuccessful_at FROM enquiries WHERE id=?").get(ID_B),
    ).toEqual({
      status: "unsuccessful",
      unsuccessful_at: NOW,
    });
    const again = await call("POST", `/api/operator/enquiries/${ID_B}/status`, {
      from: "unsuccessful",
      to: "contacted",
    });
    expect(again.status).toBe(400);
  });
  it("rejects backwards/invalid transitions and bad bodies without changing data", async () => {
    for (const body of [
      { from: "contacted", to: "new" },
      { from: "new", to: "new" },
      { from: "x", to: "booked" },
      {},
      "str",
      null,
    ]) {
      const r = await call("POST", `/api/operator/enquiries/${ID_A}/status`, body);
      expect(r.status).toBe(400);
    }
    expect(sql.prepare("SELECT status FROM enquiries WHERE id=?").get(ID_A)).toEqual({
      status: "new",
    });
  });
  it("blocks cross-origin or non-JSON writes and unsupported methods/paths", async () => {
    const p = `/api/operator/enquiries/${ID_A}/status`;
    expect(
      (await call("POST", p, { from: "new", to: "contacted" }, { origin: "https://evil.test" }))
        .status,
    ).toBe(403);
    expect((await call("POST", p, { from: "new", to: "contacted" }, { origin: "" })).status).toBe(
      403,
    );
    expect(
      (await call("POST", p, { from: "new", to: "contacted" }, { "content-type": "text/plain" }))
        .status,
    ).toBe(415);
    expect((await call("DELETE", `/api/operator/enquiries/${ID_A}`)).status).toBe(405);
    expect((await call("GET", "/api/operator/nope")).status).toBe(404);
    expect(sql.prepare("SELECT status FROM enquiries WHERE id=?").get(ID_A)).toEqual({
      status: "new",
    });
  });
  it("rejects JSONP and over-limit UTF-8 bytes before changing status", async () => {
    const path = `/api/operator/enquiries/${ID_A}/status`;
    const body = { from: "new", to: "contacted" };
    expect((await call("POST", path, body, { "content-type": "application/jsonp" })).status).toBe(
      415,
    );
    expect((await call("POST", path, { ...body, padding: "é".repeat(600) })).status).toBe(413);
    expect(sql.prepare("SELECT status FROM enquiries WHERE id=?").get(ID_A)).toEqual({
      status: "new",
    });
    expect(sql.prepare("SELECT COUNT(*) AS c FROM operator_audit").get()).toEqual({ c: 0 });
    expect(
      (await call("POST", path, body, { "content-type": "application/json; charset=UTF-8" }))
        .status,
    ).toBe(200);
  });

  it("bounds stalled and oversized status request streams", async () => {
    const request = (body: ReadableStream<Uint8Array>) =>
      new Request(`https://twn.test/api/operator/enquiries/${ID_A}/status`, {
        method: "POST",
        headers: { origin: "https://twn.test", "content-type": "application/json" },
        body,
        duplex: "half",
      } as RequestInit & { duplex: "half" });
    const ctx = { db, operator: "owner@example.com", now: () => NOW, log: () => {} };
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1025));
      },
      cancel,
    });
    expect((await handleOperatorApi(request(oversized), ctx)).status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    vi.useFakeTimers();
    try {
      const stalled = new ReadableStream<Uint8Array>();
      const pending = handleOperatorApi(request(stalled), ctx);
      await vi.advanceTimersByTimeAsync(BODY_READ_TIMEOUT_MS);
      expect((await pending).status).toBe(408);
    } finally {
      vi.useRealTimers();
    }
    expect(sql.prepare("SELECT status FROM enquiries WHERE id=?").get(ID_A)).toEqual({
      status: "new",
    });
    expect(sql.prepare("SELECT COUNT(*) AS c FROM operator_audit").get()).toEqual({ c: 0 });
  });

  it("logs status outcomes without linkable enquiry or operator identifiers", async () => {
    await call("POST", `/api/operator/enquiries/${ID_A}/status`, { from: "new", to: "contacted" });
    const text = JSON.stringify(logs);
    expect(text).toContain("contacted");
    expect(text).not.toMatch(/Person|98765|owner@/);
    expect(text).not.toContain(ID_A);
    expect(logs).toEqual([{ event: "operator", action: "status", to: "contacted", outcome: "ok" }]);
  });

  it("records who changed what in an audit trail and shows it on the detail view", async () => {
    await call("POST", `/api/operator/enquiries/${ID_A}/status`, { from: "new", to: "contacted" });
    await call("POST", `/api/operator/enquiries/${ID_A}/status`, { from: "new", to: "booked" }); // stale
    const rows = sql
      .prepare("SELECT at, operator, enquiry_id, from_status, to_status FROM operator_audit")
      .all();
    expect(rows).toEqual([
      {
        at: NOW,
        operator: "owner@example.com",
        enquiry_id: ID_A,
        from_status: "new",
        to_status: "contacted",
      },
    ]);
    const d = (await (await call("GET", `/api/operator/enquiries/${ID_A}`)).json()) as {
      history: { at: string; operator: string; from: string; to: string }[];
    };
    expect(d.history).toEqual([
      { at: NOW, operator: "owner@example.com", from: "new", to: "contacted" },
    ]);
  });
  it("distinguishes empty audit history from unavailable history", async () => {
    const path = `/api/operator/enquiries/${ID_A}`;
    const empty = await call("GET", path);
    expect(empty.status).toBe(200);
    expect(await empty.json()).toMatchObject({ history: [] });
    sql.exec("DROP TABLE operator_audit");
    const unavailable = await call("GET", path);
    expect(unavailable.status).toBe(200);
    expect(await unavailable.json()).toMatchObject({
      history: null,
      enquiry: { id: ID_A, status: "new" },
    });
    expect(logs).toContainEqual({
      event: "operator",
      action: "history",
      outcome: "unavailable",
    });
  });

  it("audits unsuccessful dispositions and keeps the trail after retention deletion", async () => {
    await call("POST", `/api/operator/enquiries/${ID_B}/status`, {
      from: "new",
      to: "unsuccessful",
    });
    sql.exec("PRAGMA foreign_keys = ON");
    sql.prepare("DELETE FROM enquiries WHERE id = ?").run(ID_B);
    expect(
      sql.prepare("SELECT to_status FROM operator_audit WHERE enquiry_id = ?").all(ID_B),
    ).toEqual([{ to_status: "unsuccessful" }]);
  });
  it("rolls back status and closure clock if the audit table is missing", async () => {
    sql.exec("DROP TABLE operator_audit");
    for (const to of ["contacted", "unsuccessful"]) {
      const r = await call("POST", `/api/operator/enquiries/${ID_A}/status`, {
        from: "new",
        to,
      });
      expect(r.status).toBe(503);
      expect(
        sql.prepare("SELECT status, unsuccessful_at FROM enquiries WHERE id=?").get(ID_A),
      ).toEqual({ status: "new", unsuccessful_at: null });
    }
    expect(JSON.stringify(logs)).toContain("transaction_failed");
  });

  it("rolls back the status if an existing audit table rejects the insert", async () => {
    sql.exec(
      "CREATE TRIGGER reject_audit BEFORE INSERT ON operator_audit " +
        "BEGIN SELECT RAISE(ABORT, 'synthetic audit failure'); END",
    );
    const r = await call("POST", `/api/operator/enquiries/${ID_A}/status`, {
      from: "new",
      to: "booked",
    });
    expect(r.status).toBe(503);
    expect(sql.prepare("SELECT status FROM enquiries WHERE id=?").get(ID_A)).toEqual({
      status: "new",
    });
    expect(sql.prepare("SELECT COUNT(*) AS c FROM operator_audit").get()).toEqual({ c: 0 });
  });
});
