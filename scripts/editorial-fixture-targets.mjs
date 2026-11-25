/**
 * Determine which disposable fixture targets need creation. Existing reviewed
 * service sources remain untouched; the Astro build still validates them.
 * All reserved synthetic story/media paths must be absent.
 */
export function missingFixtureTargets(paths, exists) {
  return paths.filter((relative) => {
    if (!exists(relative)) return true;
    if (relative.startsWith("src/content/services/")) return false;
    throw new Error("Refusing to replace existing source with CI fixture: " + relative);
  });
}

/** Never inherit publication switches from the caller's shell or CI environment. */
export function editorialFixtureEnv() {
  return {
    ASTRO_OUT_DIR: "./dist-editorial-fixtures",
    PUBLIC_ALLOW_INDEXING: "false",
    PUBLIC_ENQUIRIES_ENABLED: "false",
    PUBLIC_SITE_RELEASED: "false",
  };
}
