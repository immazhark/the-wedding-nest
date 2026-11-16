import { describe, expect, it, vi } from "vitest";
import { emptyEnquiry, type EnquiryState } from "../../src/lib/enquiry/schema";
import {
  FIELD_STAGE,
  fieldMessage,
  submitEnquiry,
  SUBMIT_TIMEOUT_MS,
} from "../../src/lib/enquiry/submit";

const state = (): EnquiryState => ({
  ...emptyEnquiry(),
  occasions: ["nikah"],
  scope: "full-planning",
  name: "Sample",
  phone: "9876543210",
  consent: true,
});
const KEY = "3f2b8c1e-9d4a-4f6b-8e2a-1c5d7e9f0a1b";

const respond = (status: number, body: unknown) =>
  vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );

describe("submitEnquiry", () => {
  it("keeps malformed responses retryable instead of crashing the planner", async () => {
    for (const body of [null, [], "bad", { id: "" }, { id: "   " }]) {
      expect(await submitEnquiry(state(), "t", KEY, respond(201, body) as never)).toEqual({
        kind: "retryable",
      });
    }
    for (const errors of [
      {},
      [],
      null,
      { unknown: "invalid" },
      { phone: "unexpected" },
      { phone: "invalid", unknown: "invalid" },
    ]) {
      expect(await submitEnquiry(state(), "t", KEY, respond(422, { errors }) as never)).toEqual({
        kind: "retryable",
      });
    }
  });

  it("aborts a stalled request so the visitor can retry", async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      const stalled = vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            signal = init.signal as AbortSignal;
            signal.addEventListener("abort", () =>
              reject(new DOMException("Timed out", "AbortError")),
            );
          }),
      );
      const pending = submitEnquiry(state(), "t", KEY, stalled as never);
      await vi.advanceTimersByTimeAsync(SUBMIT_TIMEOUT_MS);
      expect(await pending).toEqual({ kind: "retryable" });
      expect(signal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the timeout active while reading a stalled response body", async () => {
    vi.useFakeTimers();
    try {
      const stalledBody = vi.fn(async (_url: string, init: RequestInit) => ({
        json: () =>
          new Promise((_resolve, reject) => {
            init.signal!.addEventListener("abort", () =>
              reject(new DOMException("Timed out", "AbortError")),
            );
          }),
      }));
      const pending = submitEnquiry(state(), "t", KEY, stalledBody as never);
      await vi.advanceTimersByTimeAsync(SUBMIT_TIMEOUT_MS);
      expect(await pending).toEqual({ kind: "retryable" });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns a retryable result when a fetch ignores abort entirely", async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      let finishFetch: ((response: Response) => void) | undefined;
      const ignoresAbort = vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((resolve) => {
            signal = init.signal as AbortSignal;
            finishFetch = resolve;
          }),
      );
      const pending = submitEnquiry(state(), "t", KEY, ignoresAbort as never);
      await vi.advanceTimersByTimeAsync(SUBMIT_TIMEOUT_MS);
      expect(await pending).toEqual({ kind: "retryable" });
      expect(signal?.aborted).toBe(true);
      finishFetch!(Response.json({ id: "too-late" }, { status: 201 }));
      await vi.advanceTimersByTimeAsync(0);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns after the deadline even when response-body decoding ignores abort", async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      let finishBody: ((body: unknown) => void) | undefined;
      const stuckBody = vi.fn(async (_url: string, init: RequestInit) => {
        signal = init.signal as AbortSignal;
        return {
          status: 201,
          ok: true,
          json: () => new Promise((resolve) => (finishBody = resolve)),
        };
      });
      const pending = submitEnquiry(state(), "t", KEY, stuckBody as never);
      await vi.advanceTimersByTimeAsync(SUBMIT_TIMEOUT_MS);
      expect(await pending).toEqual({ kind: "retryable" });
      expect(signal?.aborted).toBe(true);
      finishBody!({ id: "too-late" });
      await vi.advanceTimersByTimeAsync(0);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("posts JSON with the idempotency key and Turnstile token", async () => {
    const fetch = respond(201, { id: "abc" });
    await submitEnquiry(state(), "tok", KEY, fetch as unknown as typeof globalThis.fetch);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/enquiry");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["idempotency-key"]).toBe(KEY);
    expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
    const body = JSON.parse(String(init.body));
    expect(body.turnstileToken).toBe("tok");
    expect(body.enquiry.name).toBe("Sample");
  });

  it("treats 201 and 200 (safe retry) as accepted, with the id", async () => {
    expect(await submitEnquiry(state(), "t", KEY, respond(201, { id: "a1" }) as never)).toEqual({
      kind: "accepted",
      id: "a1",
    });
    expect(await submitEnquiry(state(), "t", KEY, respond(200, { id: "a1" }) as never)).toEqual({
      kind: "accepted",
      id: "a1",
    });
  });

  it("maps 422 field errors so the visitor can fix them", async () => {
    const r = await submitEnquiry(
      state(),
      "t",
      KEY,
      respond(422, { error: "invalid_enquiry", errors: { phone: "invalid" } }) as never,
    );
    expect(r).toEqual({ kind: "invalid", errors: { phone: "invalid" } });
  });

  it("marks upload timeouts, outages, rate limits and network failures as retryable", async () => {
    for (const status of [408, 503, 429, 500]) {
      expect(
        (await submitEnquiry(state(), "t", KEY, respond(status, { error: "x" }) as never)).kind,
      ).toBe("retryable");
    }
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect((await submitEnquiry(state(), "t", KEY, offline as never)).kind).toBe("retryable");
  });

  it("treats a failed verification as needing a fresh check, not success", async () => {
    const r = await submitEnquiry(
      state(),
      "t",
      KEY,
      respond(403, { error: "verification_failed" }) as never,
    );
    expect(r).toEqual({ kind: "verification" });
  });

  it("never reports success for a 2xx without an id", async () => {
    expect((await submitEnquiry(state(), "t", KEY, respond(201, {}) as never)).kind).toBe(
      "retryable",
    );
  });
});

describe("field messages", () => {
  it("explains each server code in plain language and knows which stage to revisit", () => {
    expect(fieldMessage("phone", "invalid")).toMatch(/phone/i);
    expect(fieldMessage("consent", "consent_required")).toMatch(/agree/i);
    expect(FIELD_STAGE.phone).toBe("contact");
    expect(FIELD_STAGE.services).toBe("scope");
    expect(FIELD_STAGE.guestCount).toBe("logistics");
  });
});
