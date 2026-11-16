import { defineConfig, devices } from "@playwright/test";

// Isolated, disposable Astro build with synthetic records only. This config is
// intentionally separate from public-preview and deployed-Worker test suites.
const PORT = 4334;
const executablePath = process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"];

export default defineConfig({
  testDir: "tests/editorial",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: "list",
  projects: [
    { name: "editorial-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "editorial-mobile", use: { ...devices["Pixel 7"] } },
  ],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: `npx astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    env: { ASTRO_OUT_DIR: "./dist-editorial-fixtures" },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
