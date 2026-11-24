import { describe, expect, it } from "vitest";
import { assertIndexableRelease } from "../../src/lib/site/release";

const approved = {
  indexable: true,
  publicRelease: "true",
  enquiriesEnabled: "false",
  turnstileSiteKey: "",
};
const isolated = { workers_dev: false, preview_urls: false };

describe("indexable release boundary", () => {
  it("leaves default nonindexable previews unchanged", () => {
    expect(() => assertIndexableRelease({ ...approved, indexable: false }, {})).not.toThrow();
  });

  it("requires a separately approved public release", () => {
    expect(() =>
      assertIndexableRelease({ ...approved, publicRelease: undefined }, isolated),
    ).toThrow(/public release/i);
  });

  it.each([
    {},
    { workers_dev: true, preview_urls: false },
    { workers_dev: false, preview_urls: true },
    { workers_dev: false },
  ])("rejects indexable assets reachable on preview hosts: %j", (config) => {
    expect(() => assertIndexableRelease(approved, config)).toThrow(/preview hosts/i);
  });

  it("never makes fictional-data intake indexable", () => {
    expect(() =>
      assertIndexableRelease(
        {
          ...approved,
          enquiriesEnabled: "true",
          turnstileSiteKey: "1x00000000000000000000AA",
        },
        isolated,
      ),
    ).toThrow(/test environment/i);
  });

  it("permits an explicitly public, isolated brochure without enabling intake", () => {
    expect(() => assertIndexableRelease(approved, isolated)).not.toThrow();
  });
});
