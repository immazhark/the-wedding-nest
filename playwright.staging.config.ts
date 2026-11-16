import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/staging",
  timeout: 90_000,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "https://the-wedding-nest-staging.mazharkhan-it.workers.dev",
    trace: "off",
  },
  projects: [
    { name: "staging-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "staging-mobile", use: { ...devices["Pixel 7"] } },
  ],
});
