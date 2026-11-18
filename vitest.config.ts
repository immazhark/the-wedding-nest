/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// getViteConfig applies Astro's own asset pipeline, so imported photographs resolve to the same
// ImageMetadata shape the real build gets (the media catalog validates it at import time).
export default getViteConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
