import { describe, expect, it, vi } from "vitest";
import { runEmailReceiptTest } from "../../src/worker/email-receipt-test";

const reference = "12345678-1234-1234-1234-123456789abc";
const at = "2026-11-24T12:00:00.000Z";
const now = new Date(at);
const options = { mode: "mock", reference, createdAt: at };
const accepted = () => new Response(JSON.stringify({ id: reference }));

describe("fictional receipt-test harness", () => {
  it("defaults to a mock without using an external fetcher or credential", async () => {
    const network = vi.fn();
    expect(await runEmailReceiptTest({ reference, createdAt: at }, now, network)).toEqual({
      status: "mock_passed",
    });
    expect(network).not.toHaveBeenCalled();
  });
  it("refuses send mode until exact approval, verification and credentials are supplied", async () => {
    const network = vi.fn();
    for (const extra of [
      {},
      { approval: "yes" },
      { approval: "SEND ONE FICTIONAL RECEIPT", domainVerified: "true" },
    ]) {
      expect(
        await runEmailReceiptTest({ ...options, mode: "send", ...extra }, now, network),
      ).toEqual({ status: "blocked" });
    }
    expect(network).not.toHaveBeenCalled();
  });
  it("rejects malformed, missing and stale test references before any network access", async () => {
    const network = vi.fn();
    for (const invalid of [
      { ...options, reference: "bad" },
      { ...options, createdAt: "bad" },
      { ...options, mode: "other" },
      { mode: "mock" },
    ]) {
      expect(await runEmailReceiptTest(invalid, now, network)).toEqual({ status: "blocked" });
    }
    expect(
      await runEmailReceiptTest(options, new Date("2026-11-25T12:00:00.000Z"), network),
    ).toEqual({ status: "blocked" });
    expect(network).not.toHaveBeenCalled();
  });
  it("uses only a clearly fictional fixed message and approved recipient", async () => {
    const network = vi.fn().mockImplementation(async () => accepted());
    expect(
      await runEmailReceiptTest(
        {
          ...options,
          mode: "send",
          approval: "SEND ONE FICTIONAL RECEIPT",
          domainVerified: "true",
          apiKey: "re_fictional_test_only",
        },
        now,
        network,
      ),
    ).toEqual({ status: "accepted" });
    const [url, request] = network.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    const payload = JSON.parse(request.body);
    expect(payload.to).toEqual(["theweddingnest.events@gmail.com"]);
    expect(payload.subject).toMatch(/^\[TEST\] /);
    expect(request.headers["Idempotency-Key"]).toBe(`twn-receipt/${reference}`);
    expect(payload.text).toContain("FICTIONAL STAGING RECEIPT TEST");
    expect(payload.text).toContain("No customer enquiry");
    expect(Object.keys(payload).sort()).toEqual(["from", "reply_to", "subject", "text", "to"]);
    expect(network).toHaveBeenCalledTimes(1);
  });
  it("reports provider acceptance separately from inbox receipt and never exposes errors", async () => {
    const result = await runEmailReceiptTest(
      {
        ...options,
        mode: "send",
        approval: "SEND ONE FICTIONAL RECEIPT",
        domainVerified: "true",
        apiKey: "re_fictional_test_only",
      },
      now,
      vi.fn().mockRejectedValue(new Error("private credential")),
    );
    expect(result).toEqual({ status: "retry" });
    expect(JSON.stringify(result)).not.toContain("private");
  });
});
