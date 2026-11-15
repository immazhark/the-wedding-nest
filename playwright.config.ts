import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;
// Set PLAYWRIGHT_BASE_URL to run the same suite against a deployed Cloudflare URL.
const remote = process.env["PLAYWRIGHT_BASE_URL"];
// E2E_TARGET=workerd runs the suite on Cloudflare's local Workers runtime (wrangler dev):
// real routing, _headers, 404 handling and the /api Worker.
const workerd = process.env["E2E_TARGET"] === "workerd";
const RUNTIME_PORT = 8799;
// Cloud sessions ship a pre-installed Chromium; CI installs its own via `playwright install`.
const executablePath = process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"];

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: remote ?? (workerd ? `http://127.0.0.1:${RUNTIME_PORT}` : `http://localhost:${PORT}`),
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
        webServer: workerd
          ? {
              command: `npx wrangler dev --env="" --ip 127.0.0.1 --port ${RUNTIME_PORT}`,
              url: `http://127.0.0.1:${RUNTIME_PORT}`,
              reuseExistingServer: !process.env["CI"],
              timeout: 120_000,
            }
          : {
              command: `npx astro preview --port ${PORT} --ignore-lock`,
              url: `http://localhost:${PORT}`,
              reuseExistingServer: !process.env["CI"],
            },
      }),
});
