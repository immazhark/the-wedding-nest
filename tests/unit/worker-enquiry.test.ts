import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BODY_READ_TIMEOUT_MS, handleEnquiry, type EnquiryEnv } from "../../src/worker/enquiry";
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
          if (sql.startsWith("SELECT id, payload_json FROM enquiries")) {
            const row = enquiries.get(String(stmt.args[0]));
            return (row ? { id: row.id, payload_json: row.payload } : null) as T | null;
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
  it("rejects a missing Origin even when the allow-list has empty entries", async () => {
    env.ALLOWED_ORIGINS = `${ORIGIN}, `;
    const req = request(ok());
    req.headers.delete("origin");
    expect((await call(req)).status).toBe(403);
    expect(turnstile).not.toHaveBeenCalled();
  });

  it("stops consuming an oversized stream without Content-Length", async () => {
    let reads = 0;
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        reads++;
        controller.enqueue(new Uint8Array(9000));
        if (reads === 5) controller.close();
      },
      cancel() {
        cancelled = true;
      },
    });
    const req = new Request(request(ok()), {
      body: stream,
      duplex: "half",
    } as RequestInit);
    expect((await call(req)).status).toBe(413);
    expect(cancelled).toBe(true);
    expect(reads).toBeLessThanOrEqual(3);
    expect(turnstile).not.toHaveBeenCalled();
  });

  it("rejects an oversized request even if stream cancellation never settles", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(9_000));
      },
      cancel() {
        cancelled = true;
        return new Promise<void>(() => {}); // Deliberately ignores cancellation.
      },
    });
    const req = new Request(request(ok()), {
      body: stream,
      duplex: "half",
    } as RequestInit);
    const response = await call(req);
    expect(response.status).toBe(413);
    expect(cancelled).toBe(true);
    expect(turnstile).not.toHaveBeenCalled();
    expect(db.enquiries.size).toBe(0);
  }, 1_000);

  it("times out a never-finishing body stream without verification or storage", async () => {
    vi.useFakeTimers();
    try {
      let cancelled = false;
      const stream = new ReadableStream<Uint8Array>({
        pull: () => new Promise<void>(() => {}),
        cancel: () => {
          cancelled = true;
          return new Promise<void>(() => {}); // Cancellation deliberately never settles.
        },
      });
      const req = new Request(request(ok()), {
        body: stream,
        duplex: "half",
      } as RequestInit);
      const pending = call(req);
      await vi.advanceTimersByTimeAsync(BODY_READ_TIMEOUT_MS);
      const response = await pending;
      expect(response.status).toBe(408);
      expect(await response.json()).toEqual({ error: "request_timeout" });
      expect(cancelled).toBe(true);
      expect(turnstile).not.toHaveBeenCalled();
      expect(db.enquiries.size).toBe(0);
      expect(db.outbox).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns a safe error when the request body stream fails", async () => {
    const req = new Request(request(ok()), {
      body: new ReadableStream({
        start(controller) {
          controller.error(new Error("private transport detail"));
        },
      }),
      duplex: "half",
    } as RequestInit);
    const res = await call(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_body" });
  });

  it("returns a retryable response when the rate limiter is unavailable", async () => {
    env.ENQUIRY_RATE_LIMITER = {
      limit: async () => {
        throw new Error("private limiter detail");
      },
    };
    const res = await call(request(ok()));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "rate_limit_unavailable" });
    expect(turnstile).not.toHaveBeenCalled();
  });

  it("never acknowledges an insert conflict if the stored row cannot be found", async () => {
    db.batch = async () => [{ meta: { changes: 0 } }];
    const res = await call(request(ok()));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "storage_unavailable" });
    expect(db.enquiries.size).toBe(0);
  });

  it("stores a valid enquiry and its outbox event atomically, returning 201 with an id only", async () => {
    const res = await call(request(ok()));
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(["id"]);
    expect(db.enquiries.size).toBe(1);
    expect(db.outbox).toHaveLength(1);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects malformed selections before storage and on duplicate retries", async () => {
    for (const field of ["services", "styles"] as const) {
      const malformed = {
        ...ok(),
        enquiry: { ...validEnquiry, [field]: "private-invalid-choice" },
      };
      const response = await call(request(malformed));
      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({
        error: "invalid_enquiry",
        errors: { [field]: "invalid" },
      });
    }
    expect(db.enquiries.size).toBe(0);
    expect(db.outbox).toHaveLength(0);

    expect((await call(request(ok()))).status).toBe(201);
    turnstile.mockClear();
    const retry = await call(
      request({ ...ok(), enquiry: { ...validEnquiry, styles: { choice: "heritage" } } }),
    );
    expect(retry.status).toBe(422);
    expect(await retry.json()).toEqual({
      error: "invalid_enquiry",
      errors: { styles: "invalid" },
    });
    expect(turnstile).not.toHaveBeenCalled();
    expect(db.enquiries.size).toBe(1);
    expect(db.outbox).toHaveLength(1);
  });

  it("rejects malformed guest counts without writes or false duplicate acknowledgements", async () => {
    for (const guestCount of [200, { count: 200 }, false, []]) {
      const response = await call(request({ ...ok(), enquiry: { ...validEnquiry, guestCount } }));
      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({
        error: "invalid_enquiry",
        errors: { guestCount: "invalid" },
      });
    }
    expect(db.enquiries.size).toBe(0);
    expect(db.outbox).toHaveLength(0);

    const blank = { ...ok(), enquiry: { ...validEnquiry, guestCount: "" } };
    expect((await call(request(blank))).status).toBe(201);
    turnstile.mockClear();
    const retry = await call(request({ ...ok(), enquiry: { ...validEnquiry, guestCount: 200 } }));
    expect(retry.status).toBe(422);
    expect(await retry.json()).toEqual({
      error: "invalid_enquiry",
      errors: { guestCount: "invalid" },
    });
    expect(turnstile).not.toHaveBeenCalled();
    expect(db.enquiries.size).toBe(1);
    expect(db.outbox).toHaveLength(1);
    expect(JSON.parse([...db.enquiries.values()][0]!.payload).guestCount).toBe("");
    expect((await call(request(blank))).status).toBe(200);
  });

  it("is idempotent: a retry with the same key returns the same id without a duplicate", async () => {
    const first = (await (await call(request(ok()))).json()) as { id: string };
    const res = await call(request(ok()));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { id: string }).id).toBe(first.id);
    expect(db.enquiries.size).toBe(1);
    expect(db.outbox).toHaveLength(1);
  });

  it("rejects changed data under a reused idempotency key without claiming it was saved", async () => {
    const accepted = await call(request(ok()));
    expect(accepted.status).toBe(201);
    const first = (await accepted.json()) as { id: string };

    const changed = await call(
      request({ ...ok(), enquiry: { ...validEnquiry, name: "Different Customer" } }),
    );
    expect(changed.status).toBe(409);
    expect(await changed.json()).toEqual({ error: "idempotency_conflict" });
    expect(db.enquiries.size).toBe(1);
    expect(db.outbox).toHaveLength(1);
    expect(JSON.stringify([...db.enquiries.values()])).not.toContain("Different Customer");
    expect(turnstile).toHaveBeenCalledTimes(1);

    // The unchanged retry still acknowledges precisely the originally stored record.
    const retry = await call(request(ok()));
    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({ id: first.id });
  });

  it("rejects an invalid changed duplicate rather than acknowledging the original", async () => {
    expect((await call(request(ok()))).status).toBe(201);
    const response = await call(
      request({ ...ok(), enquiry: { ...validEnquiry, consent: false, phone: "<private>" } }),
    );
    expect(response.status).toBe(422);
    const serialized = JSON.stringify(await response.json());
    expect(serialized).not.toContain("<private>");
    expect(db.enquiries.size).toBe(1);
    expect(db.outbox).toHaveLength(1);
    expect(turnstile).toHaveBeenCalledTimes(1);
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

  it("requires an exact JSON media type and permits case-insensitive parameters", async () => {
    for (const contentType of [
      "application/jsonp",
      "application/json-extra",
      "application/json+xml",
      "text/plain",
      "",
    ]) {
      const res = await call(request(ok(), { headers: { "content-type": contentType } }));
      expect(res.status, contentType).toBe(415);
    }
    expect(turnstile).not.toHaveBeenCalled();
    const accepted = await call(
      request(ok(), { headers: { "content-type": "Application/JSON; charset=UTF-8" } }),
    );
    expect(accepted.status).toBe(201);
    expect(db.enquiries.size).toBe(1);
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

  describe("Turnstile verification deadline", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("aborts a stalled fetch and returns a retryable error without writing an enquiry", async () => {
      let signal: AbortSignal | undefined;
      turnstile.mockImplementationOnce((_url, init: RequestInit) => {
        signal = init.signal ?? undefined;
        return new Promise<Response>(() => {}); // Deliberately ignores abort.
      });
      let response: Response | undefined;
      const pending = call(request(ok())).then((res) => (response = res));
      await vi.advanceTimersByTimeAsync(10_000);
      expect(response?.status).toBe(503);
      await pending;
      expect(await response!.json()).toEqual({ error: "verification_unavailable" });
      expect(signal?.aborted).toBe(true);
      expect(db.enquiries.size).toBe(0);
      expect(db.outbox).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("bounds a stalled response body and ignores a successful result arriving after timeout", async () => {
      let finishBody: ((outcome: { success: boolean }) => void) | undefined;
      let signal: AbortSignal | undefined;
      turnstile.mockImplementationOnce((_url, init: RequestInit) => {
        signal = init.signal ?? undefined;
        return Promise.resolve({
          json: () => new Promise((resolve) => (finishBody = resolve)),
        });
      });
      let response: Response | undefined;
      const pending = call(request(ok())).then((res) => (response = res));
      await vi.advanceTimersByTimeAsync(10_000);
      expect(response?.status).toBe(503);
      await pending;
      expect(signal?.aborted).toBe(true);
      finishBody!({ success: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(db.enquiries.size).toBe(0);
      expect(db.outbox).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("handles a fetch rejection arriving after the timeout without leaking private details", async () => {
      let rejectFetch: ((error: Error) => void) | undefined;
      turnstile.mockImplementationOnce(
        () => new Promise<Response>((_resolve, reject) => (rejectFetch = reject)),
      );
      const logs: Record<string, string | number | boolean>[] = [];
      let response: Response | undefined;
      const pending = handleEnquiry(request(ok()), env, {
        fetch: turnstile as unknown as typeof fetch,
        log: (entry) => logs.push(entry),
      }).then((res) => (response = res));
      await vi.advanceTimersByTimeAsync(10_000);
      expect(response?.status).toBe(503);
      await pending;
      rejectFetch!(new Error("private-token-and-transport-detail"));
      await vi.advanceTimersByTimeAsync(0);
      expect(logs).toEqual([
        { event: "enquiry", outcome: "verification_unavailable", status: 503 },
      ]);
      expect(db.enquiries.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("clears its deadline after prompt verification succeeds", async () => {
      const response = await call(request(ok()));
      expect(response.status).toBe(201);
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(db.enquiries.size).toBe(1);
      expect(db.outbox).toHaveLength(1);
    });
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
