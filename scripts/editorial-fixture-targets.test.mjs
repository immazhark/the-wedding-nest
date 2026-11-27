import { test } from "node:test";
import assert from "node:assert/strict";
import { editorialFixtureEnv, missingFixtureTargets } from "./editorial-fixture-targets.mjs";

const hospitality = "src/content/services/guest-hospitality-hyderabad.json";
const decor = "src/content/services/nikah-decoration-hyderabad.json";
const photography = "src/content/services/wedding-photography-videography.json";
const story = "src/content/stories/ci-test-only-walima.json";
const media = "src/content/media/ci-test-only-walima.json";
const photo = "src/assets/events/walima/ci-test-only-walima/01-geometry.png";
const paths = [hospitality, decor, photography, story, media, photo];

test("all missing fixtures are generated on a clean checkout", () => {
  assert.deepEqual(
    missingFixtureTargets(paths, () => false),
    paths,
  );
});

test("existing service records are excluded from fixture creation and cleanup", () => {
  const existing = new Set([hospitality]);
  const missing = missingFixtureTargets(paths, (path) => existing.has(path));
  assert.deepEqual(missing, [decor, photography, story, media, photo]);
});

test("multiple real service records coexist without synthetic replacements", () => {
  const existing = new Set([hospitality, decor, photography]);
  const missing = missingFixtureTargets(paths, (path) => existing.has(path));
  assert.deepEqual(missing, [story, media, photo]);
});

for (const collision of [story, media, photo]) {
  test(`reserved collision still fails closed: ${collision}`, () => {
    const action = () => missingFixtureTargets(paths, (path) => path === collision);
    assert.throws(action, /Refusing to replace existing source/);
  });
}

test("fixture environment overrides all inherited publication switches", () => {
  const inherited = {
    ASTRO_OUT_DIR: "./dist",
    PUBLIC_ALLOW_INDEXING: "true",
    PUBLIC_ENQUIRIES_ENABLED: "true",
    PUBLIC_SITE_RELEASED: "true",
    TWN_ALLOW_LOCAL_FIXTURES: "1",
  };
  assert.deepEqual(
    { ...inherited, ...editorialFixtureEnv() },
    {
      ASTRO_OUT_DIR: "./dist-editorial-fixtures",
      PUBLIC_ALLOW_INDEXING: "false",
      PUBLIC_ENQUIRIES_ENABLED: "false",
      PUBLIC_SITE_RELEASED: "false",
      TWN_ALLOW_LOCAL_FIXTURES: "1",
    },
  );
});
