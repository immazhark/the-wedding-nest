import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
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
    async batch() {
      throw new Error("unused");
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
  it("filters by status and caps the page size", async () => {
    sql.prepare("UPDATE enquiries SET status='contacted' WHERE id=?").run(ID_A);
    const r = await call("GET", "/api/operator/enquiries?status=contacted&limit=9999");
    expect(((await r.json()) as { enquiries: unknown[] }).enquiries).toHaveLength(1);
    expect((await call("GET", "/api/operator/enquiries?status=bogus")).status).toBe(400);
  });
  it("returns full detail for one valid id and 404 for unknown/malformed", async () => {
    const r = await call("GET", `/api/operator/enquiries/${ID_A}`);
    const d = (await r.json()) as { enquiry: { id: string; payload: { phone: string } } };
    expect(d.enquiry.id).toBe(ID_A);
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
  it("logs actions without customer data", async () => {
    await call("POST", `/api/operator/enquiries/${ID_A}/status`, { from: "new", to: "contacted" });
    const text = JSON.stringify(logs);
    expect(text).toContain("contacted");
    expect(text).not.toMatch(/Person|98765|owner@/);
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
  it("still reports success and logs a failure when the audit write fails; detail tolerates a missing table", async () => {
    sql.exec("DROP TABLE operator_audit");
    const r = await call("POST", `/api/operator/enquiries/${ID_A}/status`, {
      from: "new",
      to: "contacted",
    });
    expect(r.status).toBe(200);
    expect(JSON.stringify(logs)).toContain("audit_failed");
    const d = (await (await call("GET", `/api/operator/enquiries/${ID_A}`)).json()) as {
      history: unknown[];
    };
    expect(d.history).toEqual([]);
  });
});
