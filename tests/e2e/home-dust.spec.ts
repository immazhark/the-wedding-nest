import { expect, test } from "@playwright/test";

test("decorative opening particles settle and do not restart", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const probe = { draws: 0, visible: false };
    Object.assign(window, { __dustProbe: probe });
    const arc = CanvasRenderingContext2D.prototype.arc;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.arc = function (...args) {
      if (this.canvas.hasAttribute("data-dust")) {
        probe.draws++;
        probe.visible = true;
      }
      return arc.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.hasAttribute("data-dust")) probe.visible = false;
      return clear.apply(this, args);
    };
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const state = () =>
    page.evaluate(
      () => (window as Window & { __dustProbe: { draws: number; visible: boolean } }).__dustProbe,
    );
  await expect.poll(async () => (await state()).draws).toBeGreaterThan(0);
  await expect.poll(async () => (await state()).visible, { timeout: 6000 }).toBe(false);
  const settled = await state();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Sample across multiple animation frames to catch a restarted loop.
  await page.waitForTimeout(250);
  expect(await state()).toEqual(settled);
});

test("Data Saver leaves decorative canvas uninitialized", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true },
    });
  });
  await page.goto("/");
  const size = await page.locator("[data-dust]").evaluate((canvas: HTMLCanvasElement) => ({
    width: canvas.width,
    height: canvas.height,
  }));
  expect(size).toEqual({ width: 300, height: 150 });
});
