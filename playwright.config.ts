import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;
// Set PLAYWRIGHT_BASE_URL to run the same suite against a deployed Cloudflare URL.
const remote = process.env["PLAYWRIGHT_BASE_URL"];
// E2E_TARGET=workerd runs the suite on Cloudflare's local Workers runtime (wrangler dev):
// real routing, _headers, 404 handling and the /api Worker.
const workerd = process.env["E2E_TARGET"] === "workerd";
const RUNTIME_PORT = 8799;
// Submission-enabled variant (npm run build:submit), served only for planner-submit tests.
const SUBMIT_PORT = 4322;
const local = !remote && !workerd;
// E2E_CROSS_BROWSER=1 (npm run test:e2e:cross) adds Firefox and WebKit. Opt-in: Chromium remains the CI gate.
const cross = process.env["E2E_CROSS_BROWSER"] === "1";
// Playwright's WebKit build does not Tab onto links and mobile WebKit has no mouse.wheel, so these two
// Safari-specific behaviours cannot be driven there; they stay covered on Chromium.
const webkitUndrivable =
  /skip link moves focus to main content|sticky header stays pinned after scrolling/;
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
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /planner-submit/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /planner-submit/ },
    ...(cross
      ? [
          { name: "firefox", use: { ...devices["Desktop Firefox"] }, testIgnore: /planner-submit/ },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
            testIgnore: /planner-submit/,
            grepInvert: webkitUndrivable,
          },
          {
            name: "webkit-mobile",
            use: { ...devices["iPhone 14"] },
            testIgnore: /planner-submit/,
            grepInvert: webkitUndrivable,
          },
        ]
      : []),
    ...(local
      ? [
          {
            name: "submit-desktop",
            testMatch: /planner-submit/,
            use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${SUBMIT_PORT}` },
          },
          {
            name: "submit-mobile",
            testMatch: /planner-submit/,
            use: { ...devices["Pixel 7"], baseURL: `http://localhost:${SUBMIT_PORT}` },
          },
        ]
      : []),
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
          : [
              {
                command: `npx astro preview --port ${PORT} --ignore-lock`,
                url: `http://localhost:${PORT}`,
                reuseExistingServer: !process.env["CI"],
              },
              {
                command: `npx astro preview --port ${SUBMIT_PORT} --ignore-lock`,
                url: `http://localhost:${SUBMIT_PORT}`,
                env: { ASTRO_OUT_DIR: "./dist-submit" },
                reuseExistingServer: !process.env["CI"],
              },
            ],
      }),
});
