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
