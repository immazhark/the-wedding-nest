import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SERVICE_MEDIA_SLUGS, requestedFiles, servicePhotos } from "../../src/lib/services/photos";

const dir = "src/content/media/";
const declared = new Set(
  readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => JSON.parse(readFileSync(dir + name, "utf8")).images as { file: string }[])
    .map((entry) => entry.file),
);

describe("service page media", () => {
  it("only asks for photographs that a reviewed manifest declares", () => {
    for (const slug of SERVICE_MEDIA_SLUGS) {
      for (const file of requestedFiles(slug)) {
        expect(declared.has(file), `${slug}: ${file}`).toBe(true);
      }
    }
  });

  it("never lists the same photograph twice within one service", () => {
    for (const slug of SERVICE_MEDIA_SLUGS) {
      const files = requestedFiles(slug);
      expect(new Set(files).size, slug).toBe(files.length);
    }
  });

  it("returns no media for a service without an art direction", () => {
    expect(servicePhotos("bridal-makeup-hyderabad")).toEqual({
      menus: [],
      gallery: [],
      look: { hero: "split", tone: "dark", gallery: "mosaic" },
    });
  });
});
