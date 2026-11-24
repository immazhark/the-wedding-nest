import { readdirSync, readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mediaManifestSchema } from "../../src/lib/media/schema";

const dir = "src/content/media/";
const entries = readdirSync(dir)
  .filter((name) => name.endsWith(".json"))
  .flatMap((name) =>
    mediaManifestSchema.parse(JSON.parse(readFileSync(dir + name, "utf8"))).images.map((e) => ({
      ...e,
      name,
    })),
  );

describe("committed media manifests", () => {
  it("point at real files and never reuse a release reference or alt text", () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(existsSync(dir + e.file), e.file).toBe(true);
    }
    const refs = entries.map((e) => e.releaseRef);
    expect(new Set(refs).size, "duplicate releaseRef").toBe(refs.length);
    const alts = entries.map((e) => e.alt);
    expect(new Set(alts).size, "duplicate alt").toBe(alts.length);
  });
});
