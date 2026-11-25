import { test } from "node:test";
import assert from "node:assert/strict";
import { missingFixtureTargets } from "./editorial-fixture-targets.mjs";

const hospitality = "src/content/services/guest-hospitality-hyderabad.json";
const decor = "src/content/services/nikah-decoration-hyderabad.json";
const story = "src/content/stories/ci-test-only-walima.json";
const media = "src/content/media/ci-test-only-walima.json";
const photo = "src/assets/events/walima/ci-test-only-walima/01-geometry.png";
const paths = [hospitality, decor, story, media, photo];

test("all missing fixtures are generated on a clean checkout", () => {
  assert.deepEqual(
    missingFixtureTargets(paths, () => false),
    paths,
  );
});

test("existing service records are excluded from fixture creation and cleanup", () => {
  const existing = new Set([hospitality]);
  const missing = missingFixtureTargets(paths, (path) => existing.has(path));
  assert.deepEqual(missing, [decor, story, media, photo]);
});

test("multiple real service records coexist without synthetic replacements", () => {
  const existing = new Set([hospitality, decor]);
  const missing = missingFixtureTargets(paths, (path) => existing.has(path));
  assert.deepEqual(missing, [story, media, photo]);
});

for (const collision of [story, media, photo]) {
  test(`reserved collision still fails closed: ${collision}`, () => {
    const action = () => missingFixtureTargets(paths, (path) => path === collision);
    assert.throws(action, /Refusing to replace existing source/);
  });
}
