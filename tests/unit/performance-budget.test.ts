import { describe, expect, it } from "vitest";
import { accountedResourceBytes } from "../../src/lib/site/resource-budget";

describe("page transfer budget accounting", () => {
  it("counts encoded bytes even when a resource was served from browser cache", () => {
    expect(accountedResourceBytes({ transferSize: 0, encodedBodySize: 48_000 })).toBe(48_000);
  });

  it("counts transfer overhead when it exceeds encoded payload size", () => {
    expect(accountedResourceBytes({ transferSize: 10_100, encodedBodySize: 10_000 })).toBe(
      10_100,
    );
  });
});
