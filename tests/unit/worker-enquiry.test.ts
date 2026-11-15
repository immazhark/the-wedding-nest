import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleEnquiry, type EnquiryEnv } from "../../src/worker/enquiry";
import type { D1Like } from "../../src/worker/types";

/** Minimal in-memory D1 stand-in supporting the statements the handler uses. */
function fakeD1() {
  const enquiries = new Map<string, { id: string; payload: string }>();
  const outbox: { enquiryId: string }[] = [];
  let failNextBatch = false;
  const db: D1Like & { enquiries: typeof enquiries; outbox: typeof outbox; failNext(): void } = {
    enquiries,
    outbox,
    failNext: () => (failNextBatch = true),
    prepare(sql: string) {
      const stmt = {
        sql,
        args: [] as unknown[],
        bind(...args: unknown[]) {
          stmt.args = args;
          return stmt;
        },
        async first<T>() {
          if (sql.startsWith("SELECT id FROM enquiries")) {
            const row = enquiries.get(String(stmt.args[0]));
            return (row ? { id: row.id } : null) as T | null;
          }
          return null;
        },
        async run() {
          return { meta: { changes: 0 } };
        },
      };
      return stmt;
    },
    async batch(stmts) {
      if (failNextBatch) {
        failNextBatch = false;
        throw new Error("D1 unavailable");
      }
      const results = [];
      for (const s of stmts as unknown as { sql: string; args: unknown[] }[]) {
        if (s.sql.startsWith("INSERT INTO enquiries")) {
          const [id, key, , payload] = s.args as string[];
          if (enquiries.has(key!)) results.push({ meta: { changes: 0 } });
          else {
            enquiries.set(key!, { id: id!, payload: payload! });
            results.push({ meta: { changes: 1 } });
          }
        } else if (s.sql.startsWith("INSERT INTO outbox")) {
          const [, enquiryId] = s.args as string[];
          if (![...enquiries.values()].some((e) => e.id === enquiryId)) {
            results.push({ meta: { changes: 0 } });
          } else if (outbox.some((o) => o.enquiryId === enquiryId)) {
            results.push({ meta: { changes: 0 } });
          } else {
            outbox.push({ enquiryId: enquiryId! });
            results.push({ meta: { changes: 1 } });
          }
        }
      }
      return results;
    },
  };
  return db;
}

const validEnquiry = {
  occasions: ["nikah"],
  scope: "full-planning",
  services: [],
  styles: [],
  date: { kind: "undecided" },
  guestCount: "200",
  location: "",
  budget: "discuss",
  notes: "",
  name: "Test Person",
  phone: "9876543210",
  contactChannel: "whatsapp",
  consent: true,
  marketingConsent: false,
};

const ORIGIN = "https://staging.example.test";
const KEY = "3f2b8c1e-9d4a-4f6b-8e2a-1c5d7e9f0a1b";

let db: ReturnType<typeof fakeD1>;
let turnstile: ReturnType<typeof vi.fn>;
let env: EnquiryEnv;

const request = (
  body: unknown,
  init: { method?: string; headers?: Record<string, string>; raw?: string } = {},
) =>
  new Request("https://staging.example.test/api/enquiry", {
    method: init.method ?? "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      "idempotency-key": KEY,
      "cf-connecting-ip": "203.0.113.7",
      ...init.headers,
    },
    ...(init.method === "GET" ? {} : { body: init.raw ?? JSON.stringify(body) }),
  });

const ok = () => ({ turnstileToken: "token-ok", enquiry: validEnquiry });
const call = (req: Request) =>
  handleEnquiry(req, env, { fetch: turnstile as unknown as typeof fetch, log: () => {} });

beforeEach(() => {
  db = fakeD1();
  turnstile = vi.fn(async () => Response.json({ success: true }));
  env = {
    ENQUIRIES_ENABLED: "true",
    ALLOWED_ORIGINS: ORIGIN,
    TURNSTILE_SECRET: "test-secret",
    DB: db,
  };
});

describe("POST /api/enquiry", () => {
  it("stores a valid enquiry and its outbox event atomically, returning 201 with an id only", async () => {
    const res = await call(request(ok()));
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(["id"]);
    expect(db.enquiries.size).toBe(1);
    expect(db.outbox).toHaveLength(1);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("is idempotent: a retry with the same key returns the same id without a duplicate", async () => {
    const first = (await (await call(request(ok()))).json()) as { id: string };
    const res = await call(request(ok()));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { id: string }).id).toBe(first.id);
    expect(db.enquiries.size).toBe(1);
    expect(db.outbox).toHaveLength(1);
  });

  it("is disabled unless ENQUIRIES_ENABLED is exactly 'true'", async () => {
    for (const v of [undefined, "false", "TRUE", "1"]) {
      env = { ...env, ENQUIRIES_ENABLED: v };
      const res = await call(request(ok()));
      expect(res.status).toBe(503);
      expect(db.enquiries.size).toBe(0);
    }
  });

  it("returns 503 without a database or Turnstile secret, never pretending success", async () => {
    env = { ...env, DB: undefined };
    expect((await call(request(ok()))).status).toBe(503);
    env = { ...env, DB: db, TURNSTILE_SECRET: undefined };
    expect((await call(request(ok()))).status).toBe(503);
    expect(db.enquiries.size).toBe(0);
  });

  it("rejects non-POST methods with 405 and an Allow header", async () => {
    const res = await call(request(null, { method: "GET" }));
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
  });

  it("rejects requests from origins not on the allow-list", async () => {
    const res = await call(request(ok(), { headers: { origin: "https://evil.example" } }));
    expect(res.status).toBe(403);
    expect(turnstile).not.toHaveBeenCalled();
  });

  it("requires JSON, a bounded body and parseable content", async () => {
    expect((await call(request(ok(), { headers: { "content-type": "text/plain" } }))).status).toBe(
      415,
    );
    expect((await call(request(null, { raw: "x".repeat(20_000) }))).status).toBe(413);
    expect((await call(request(null, { raw: "{not json" }))).status).toBe(400);
  });

  it("requires a well-formed Idempotency-Key", async () => {
    expect((await call(request(ok(), { headers: { "idempotency-key": "" } }))).status).toBe(400);
    expect((await call(request(ok(), { headers: { "idempotency-key": "abc" } }))).status).toBe(400);
  });

  it("verifies Turnstile server-side with the secret and client IP, and rejects failures", async () => {
    turnstile.mockResolvedValueOnce(Response.json({ success: false }));
    const res = await call(request(ok()));
    expect(res.status).toBe(403);
    expect(db.enquiries.size).toBe(0);
    const [url, init] = turnstile.mock.calls[0]!;
    expect(String(url)).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const sent = init.body as FormData;
    expect(sent.get("secret")).toBe("test-secret");
    expect(sent.get("response")).toBe("token-ok");
    expect(sent.get("remoteip")).toBe("203.0.113.7");
  });

  it("rejects a missing Turnstile token without calling siteverify", async () => {
    const res = await call(request({ enquiry: validEnquiry }));
    expect(res.status).toBe(403);
    expect(turnstile).not.toHaveBeenCalled();
  });

  it("treats a Turnstile network failure as a retryable 503, not success", async () => {
    turnstile.mockRejectedValueOnce(new Error("network"));
    expect((await call(request(ok()))).status).toBe(503);
  });

  it("validates server-side and returns field error codes (422) without echoing input", async () => {
    const res = await call(
      request({ ...ok(), enquiry: { ...validEnquiry, consent: false, phone: "<script>" } }),
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as { errors: Record<string, string> };
    expect(body.errors).toEqual({ phone: "invalid", consent: "consent_required" });
    expect(JSON.stringify(body)).not.toContain("<script>");
    expect(db.enquiries.size).toBe(0);
  });

  it("returns a retryable 503 if the database write fails", async () => {
    db.failNext();
    const res = await call(request(ok()));
    expect(res.status).toBe(503);
    expect(db.enquiries.size).toBe(0);
  });

  it("never logs personal data", async () => {
    const lines: string[] = [];
    await handleEnquiry(request(ok()), env, {
      fetch: turnstile as unknown as typeof fetch,
      log: (l) => lines.push(JSON.stringify(l)),
    });
    const all = lines.join("\n");
    expect(all).not.toContain("Test Person");
    expect(all).not.toContain("9876543210");
    expect(all).not.toContain("203.0.113.7");
  });

  it("stores the normalised, validated enquiry rather than the raw body", async () => {
    await call(
      request({ ...ok(), enquiry: { ...validEnquiry, name: "  Test Person  ", extra: "x" } }),
    );
    const stored = JSON.parse([...db.enquiries.values()][0]!.payload);
    expect(stored.name).toBe("Test Person");
    expect(stored).not.toHaveProperty("extra");
  });
});
