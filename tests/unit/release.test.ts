import { describe, expect, it } from "vitest";
import { previewNoticeMode } from "../../src/lib/site/release";

describe("release disclosure", () => {
  it("keeps the design warning by default", () => {
    expect(previewNoticeMode({})).toBe("design");
  });

  it.each(["false", "TRUE", "1", "", undefined])(
    "does not treat %s as public release approval",
    (publicRelease) => {
      expect(previewNoticeMode({ publicRelease })).toBe("design");
    },
  );

  it("allows an approved public brochure without enabling enquiries or indexing", () => {
    expect(previewNoticeMode({ publicRelease: "true" })).toBeNull();
  });

  it("does not mistake live-intake configuration for public release approval", () => {
    expect(
      previewNoticeMode({ enquiriesEnabled: "true", turnstileSiteKey: "a-real-site-key" }),
    ).toBe("design");
  });

  it.each([undefined, "true"])(
    "always discloses fictional-data submission even with release flag %s",
    (publicRelease) => {
      expect(
        previewNoticeMode({
          publicRelease,
          enquiriesEnabled: "true",
          turnstileSiteKey: "1x00000000000000000000AA",
        }),
      ).toBe("test");
    },
  );
});
