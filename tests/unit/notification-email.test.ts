import { describe, expect, it, vi } from "vitest";
import { sendOperatorEmail } from "../../src/worker/notification-email";

const event = {
  id: "12345678-1234-1234-1234-123456789abc",
  createdAt: "2026-11-24T00:00:00.000Z",
  notice: {
    enquiryId: "abcdefab-1234-1234-1234-123456789abc",
    subject: "The Wedding Nest | New enquiry ABCDEFAB",
    text: "Fictional private enquiry",
  },
};
const config = { enabled: "true", apiKey: "re_fictional_test_only", domainVerified: true };
const now = new Date("2026-11-24T01:00:00.000Z");
const accepted = () => new Response(JSON.stringify({ id: "aaaaaaaa-1234-1234-1234-123456789abc" }));

describe("dormant operator email adapter", () => {
  it("fails closed before network access for disabled or incomplete configuration", async () => {
    const fetcher = vi.fn();
    for (const invalid of [
      { ...config, enabled: undefined },
      { ...config, enabled: "TRUE" },
      { ...config, apiKey: "" },
      { ...config, domainVerified: false },
    ]) {
      expect(await sendOperatorEmail(invalid, event, now, fetcher)).toEqual({
        status: "blocked",
        reason: "configuration",
      });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("sends only to the approved operator with fixed headers and stable event key", async () => {
    const fetcher = vi.fn().mockImplementation(async () => accepted());
    expect((await sendOperatorEmail(config, event, now, fetcher)).status).toBe("accepted");
    await sendOperatorEmail(config, event, now, fetcher);
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.redirect).toBe("error");
    expect(options.headers["Idempotency-Key"]).toBe(`twn-enquiry/${event.id}`);
    expect(fetcher.mock.calls[1]![1].body).toBe(options.body);
    expect(JSON.parse(options.body)).toEqual({
      from: "The Wedding Nest <enquiries@theweddingnest.in>",
      to: ["theweddingnest.events@gmail.com"],
      reply_to: "theweddingnest.events@gmail.com",
      subject: event.notice.subject,
      text: event.notice.text,
    });
  });
  it("refuses stale, future or malformed events without calling the provider", async () => {
    const fetcher = vi.fn();
    for (const changed of [
      { ...event, id: "invalid" },
      { ...event, createdAt: "bad" },
      { ...event, createdAt: "2026-11-25T00:00:00.000Z" },
      { ...event, notice: { ...event.notice, subject: "Injected\r\nBcc: x" } },
    ]) {
      expect((await sendOperatorEmail(config, changed, now, fetcher)).status).toBe("blocked");
    }
    expect(
      await sendOperatorEmail(config, event, new Date("2026-11-24T23:00:00.000Z"), fetcher),
    ).toEqual({ status: "blocked", reason: "event" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([429, 500, 503])(
    "returns retry for transient HTTP %i without echoing provider content",
    async (status) => {
      expect(
        await sendOperatorEmail(
          config,
          event,
          now,
          vi.fn().mockResolvedValue(new Response("private provider details", { status })),
        ),
      ).toEqual({ status: "retry", reason: "provider" });
    },
  );
  it.each([400, 401, 403, 409, 422])(
    "holds HTTP %i for review rather than blindly retrying",
    async (status) => {
      expect(
        await sendOperatorEmail(
          config,
          event,
          now,
          vi.fn().mockResolvedValue(new Response("private details", { status })),
        ),
      ).toEqual({ status: "blocked", reason: "provider" });
    },
  );
  it("returns retry on network failure without exposing exception content", async () => {
    expect(
      await sendOperatorEmail(config, event, now, vi.fn().mockRejectedValue(new Error("secret"))),
    ).toEqual({ status: "retry", reason: "network" });
  });
  it("aborts a stalled request after ten seconds", async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn(
        (_input: unknown, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("private timeout")), {
              once: true,
            });
          }),
      );
      // Node's native AbortSignal.timeout uses internal timers; inject only the
      // timeout factory to drive the actual abort signal deterministically.
      const controller = new AbortController();
      const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
      });
      try {
        const attempt = sendOperatorEmail(config, event, now, fetcher);
        await vi.advanceTimersByTimeAsync(10_000);
        expect(await attempt).toEqual({ status: "retry", reason: "network" });
        expect(timeout).toHaveBeenCalledWith(10_000);
        expect(controller.signal.aborted).toBe(true);
      } finally {
        timeout.mockRestore();
      }
    } finally {
      vi.useRealTimers();
    }
  });
  it("does not acknowledge malformed success responses", async () => {
    for (const body of ["not json", "{}", '{"id":"invalid"}']) {
      expect(
        await sendOperatorEmail(config, event, now, vi.fn().mockResolvedValue(new Response(body))),
      ).toEqual({ status: "retry", reason: "response" });
    }
  });
});
