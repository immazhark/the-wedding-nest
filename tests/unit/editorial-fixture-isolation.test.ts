import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { assertEditorialFixtureIsolation } from "../../src/lib/site/editorial-fixtures";

const allowed = { CI: "true", ASTRO_OUT_DIR: "./dist-editorial-fixtures" };
const synthetic = [["services/guest.json", { approvalRef: "TWN-PUB-2026-CITEST" }]] as const;

function withRecords(
  entries: readonly (readonly [string, unknown])[],
  verify: (root: URL) => void,
): void {
  const root = mkdtempSync(join(tmpdir(), "twn-editorial-guard-"));
  try {
    for (const [name, record] of entries) {
      mkdirSync(join(root, name.split("/")[0]!), { recursive: true });
      writeFileSync(join(root, name), JSON.stringify(record));
    }
    verify(pathToFileURL(root + "/"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("editorial fixture isolation", () => {
  it("leaves genuine approval records unaffected", () => {
    withRecords([["services/catering.json", { approvalRef: "TWN-PUB-2026-C0001" }]], (root) => {
      expect(() => assertEditorialFixtureIsolation(root, {})).not.toThrow();
    });
  });

  it("rejects leftover synthetic records in the normal preview build", () => {
    withRecords(synthetic, (root) => {
      expect(() => assertEditorialFixtureIsolation(root, {})).toThrow(/Synthetic editorial/);
    });
  });

  it("rejects a leftover photography fixture even in a noindex preview", () => {
    withRecords(
      [["services/wedding-photography-videography.json", { approvalRef: "TWN-PUB-2026-CITEST" }]],
      (root) => {
        expect(() =>
          assertEditorialFixtureIsolation(root, { PUBLIC_ALLOW_INDEXING: "false" }),
        ).toThrow(/Synthetic editorial/);
      },
    );
  });

  it("allows the explicitly isolated CI build", () => {
    withRecords(synthetic, (root) => {
      expect(() => assertEditorialFixtureIsolation(root, allowed)).not.toThrow();
    });
  });

  it.each([
    { ...allowed, ASTRO_OUT_DIR: "./dist" },
    { ...allowed, CI: "false" },
    { ...allowed, PUBLIC_ALLOW_INDEXING: "true" },
    { ...allowed, PUBLIC_ENQUIRIES_ENABLED: "true" },
    { ...allowed, PUBLIC_SITE_RELEASED: "true" },
  ])("rejects unsafe fixture configuration %j", (env) => {
    withRecords(synthetic, (root) => {
      expect(() => assertEditorialFixtureIsolation(root, env)).toThrow(/Synthetic editorial/);
    });
  });

  it("permits an explicitly opted-in local isolated build", () => {
    withRecords(synthetic, (root) => {
      expect(() =>
        assertEditorialFixtureIsolation(root, {
          ...allowed,
          CI: "false",
          TWN_ALLOW_LOCAL_FIXTURES: "1",
        }),
      ).not.toThrow();
    });
  });

  it("rejects a reserved synthetic story filename even without a marker", () => {
    withRecords([["stories/ci-test-only-walima.json", {}]], (root) => {
      expect(() => assertEditorialFixtureIsolation(root, {})).toThrow(/Synthetic editorial/);
    });
  });

  it("rejects synthetic media references", () => {
    withRecords(
      [["media/tranche.json", { images: [{ releaseRef: "TWN-REL-2026-CITEST1" }] }]],
      (root) => {
        expect(() => assertEditorialFixtureIsolation(root, {})).toThrow(/Synthetic editorial/);
      },
    );
  });
});
