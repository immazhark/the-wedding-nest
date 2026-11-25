import { existsSync, readFileSync, readdirSync } from "node:fs";

const FIXTURE_REF = /TWN-(?:PUB|STORY|REL)-20\d{2}-CITEST[A-Z0-9]*/;

/** Refuse leftover test records in any deployable build, including noindex previews. */
export function assertEditorialFixtureIsolation(
  contentRoot: URL,
  env: Readonly<Record<string, string | undefined>>,
): void {
  const isolated =
    env["ASTRO_OUT_DIR"] === "./dist-editorial-fixtures" &&
    (env["CI"] === "true" || env["TWN_ALLOW_LOCAL_FIXTURES"] === "1") &&
    env["PUBLIC_ALLOW_INDEXING"] !== "true" &&
    env["PUBLIC_ENQUIRIES_ENABLED"] !== "true" &&
    env["PUBLIC_SITE_RELEASED"] !== "true";
  if (isolated) return;

  for (const category of ["services", "stories", "media", "testimonials"]) {
    const directory = new URL(`${category}/`, contentRoot);
    if (!existsSync(directory)) continue;
    for (const name of readdirSync(directory)) {
      if (!name.endsWith(".json")) continue;
      if (
        name.startsWith("ci-test-only-") ||
        FIXTURE_REF.test(readFileSync(new URL(encodeURIComponent(name), directory), "utf8"))
      ) {
        throw new Error("Synthetic editorial fixtures require an isolated, non-public test build.");
      }
    }
  }
}
