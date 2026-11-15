import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;
// Set PLAYWRIGHT_BASE_URL to run the same suite against a deployed Cloudflare URL.
const remote = process.env["PLAYWRIGHT_BASE_URL"];
// Cloud sessions ship a pre-installed Chromium; CI installs its own via `playwright install`.
const executablePath = process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"];

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: remote ?? `http://localhost:${PORT}`,
    trace: "off",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Locally/CI: tests run against the production build, not the dev server.
  ...(remote
    ? {}
    : {
        webServer: {
          command: `npx astro preview --port ${PORT} --ignore-lock`,
          url: `http://localhost:${PORT}`,
          reuseExistingServer: !process.env["CI"],
        },
      }),
});
