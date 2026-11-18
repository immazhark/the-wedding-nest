import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../../src/worker/index";

describe("worker entry", () => {
  afterEach(() => vi.restoreAllMocks());

  it("answers an unexpected failure with a generic JSON 500 and a non-personal log", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    // A malformed binding makes the handler throw outside its own error handling.
    const env = {
      ENQUIRIES_ENABLED: "true",
      DB: {},
      TURNSTILE_SECRET: "s",
      ALLOWED_ORIGINS: 42,
      ASSETS: { fetch: async () => new Response("asset") },
    } as never;
    const res = await worker.fetch(
      new Request("https://x.test/api/enquiry", {
        method: "POST",
        headers: { origin: "https://x.test", "content-type": "application/json" },
        body: JSON.stringify({ enquiry: { name: "Private Person", phone: "9999999999" } }),
      }),
      env,
    );
    expect(res.status).toBe(500);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ error: "internal_error" });
    const logged = log.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).toContain("internal_error");
    expect(logged).not.toMatch(/Private Person|9999999999/);
  });
});
