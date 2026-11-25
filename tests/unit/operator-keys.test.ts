import { describe, expect, it, vi } from "vitest";
import { createAccessKeyReader } from "../../src/worker/operator-keys";

const TEAM = "fixture.cloudflareaccess.com";
const KEY = { kty: "RSA", kid: "fixture", n: "abc", e: "AQAB" };
const success = () => Response.json({ keys: [KEY] });

describe("Access signing key retrieval", () => {
  it("does not cache an invalid response, and caches a validated key set", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ keys: [] }))
      .mockImplementation(async () => success());
    const read = createAccessKeyReader(fetcher);
    await expect(read(TEAM)).rejects.toThrow();
    expect(await read(TEAM)).toEqual([KEY]);
    expect(await read(TEAM)).toEqual([KEY]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[0]).toBe(`https://${TEAM}/cdn-cgi/access/certs`);
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({ redirect: "error" });
  });

  it("does not accept an oversized key response or an unrelated host", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("x".repeat(65_537)));
    const read = createAccessKeyReader(fetcher);
    await expect(read("invalid.example")).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    await expect(read(TEAM)).rejects.toThrow();
  });

  it("fails closed at the deadline and never caches a late fetch result", async () => {
    vi.useFakeTimers();
    try {
      let complete!: (response: Response) => void;
      const fetcher = vi
        .fn()
        .mockImplementationOnce(() => new Promise<Response>((resolve) => (complete = resolve)))
        .mockImplementation(async () => success());
      const read = createAccessKeyReader(fetcher);
      const pending = read(TEAM);
      const rejected = expect(pending).rejects.toThrow("Access key deadline");
      await vi.advanceTimersByTimeAsync(10_000);
      await rejected;
      expect(fetcher.mock.calls[0]?.[1]?.signal.aborted).toBe(true);
      complete(success());
      await Promise.resolve();
      expect(await read(TEAM)).toEqual([KEY]);
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("bounds a stalled response body within the same deadline", async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi
        .fn()
        .mockResolvedValue(new Response(new ReadableStream<Uint8Array>()));
      const pending = createAccessKeyReader(fetcher)(TEAM);
      const rejected = expect(pending).rejects.toThrow();
      await vi.advanceTimersByTimeAsync(10_000);
      await rejected;
      expect(fetcher.mock.calls[0]?.[1]?.signal.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
