import { expect, test } from "@playwright/test";

// Evidence for creative review, not approval of photography, claims, or visual direction.
// Screenshots live in ephemeral CI artifacts, never in the deployed site or source tree.
test.describe("responsive design review", () => {
  test.skip(({ isMobile }) => isMobile, "Fixed viewport matrix uses desktop Chromium");
  test.skip(
    process.env["E2E_TARGET"] === "workerd",
    "Visual captures run once against the local built preview",
  );

  for (const [route, label] of [
    ["/", "home"],
    ["/plan-your-event/", "planner"],
  ] as const) {
    for (const width of [360, 768, 1024, 1440]) {
      test(`${label} at ${width}px remains navigable and captures review evidence`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(route, { waitUntil: "networkidle" });
        await page.evaluate(async () => {
          await document.fonts.ready;
        });

        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);

        const toggle = page.getByRole("button", { name: "Menu" });
        const nav = page.getByRole("navigation", { name: "Primary" });
        if (width < 768) {
          await expect(toggle).toBeVisible();
          await toggle.click();
          await expect(nav.getByRole("link", { name: "Services" })).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(toggle).toHaveAttribute("aria-expanded", "false");
        } else {
          await expect(toggle).toBeHidden();
          await expect(nav.getByRole("link", { name: "Services" })).toBeVisible();
        }

        await test.info().attach(`${label}-${width}px`, {
          body: await page.screenshot({ fullPage: true, animations: "disabled" }),
          contentType: "image/png",
        });
      });
    }
  }
});
