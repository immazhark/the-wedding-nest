import { describe, expect, it, vi } from "vitest";
import { emptyEnquiry, type EnquiryState } from "../../src/lib/enquiry/schema";
import { FIELD_STAGE, fieldMessage, submitEnquiry } from "../../src/lib/enquiry/submit";

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

  it("marks outages, rate limits and network failures as retryable", async () => {
    for (const status of [503, 429, 500]) {
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
