import { expect, test } from "@playwright/test";

test("intent prefetch respects changing connection hints and only warms public document routes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true, effectiveType: "4g" },
    });
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });
  await page.goto("/privacy/");

  const result = await page.evaluate(() => {
    const connection = (
      navigator as Navigator & { connection: { saveData: boolean; effectiveType: string } }
    ).connection;
    const paths = () =>
      [...document.querySelectorAll<HTMLLinkElement>('link[rel="prefetch"]')].map((link) =>
        link.getAttribute("href"),
      );
    const intent = (href: string, target = "", download = false) => {
      const link = document.createElement("a");
      link.href = href;
      link.target = target;
      if (download) link.setAttribute("download", "");
      document.body.append(link);
      link.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      link.remove();
    };

    intent("/plan-your-event/");
    const initialSaver = paths();
    connection.saveData = false;
    connection.effectiveType = "2g";
    intent("/plan-your-event/");
    connection.effectiveType = "slow-2g";
    intent("/plan-your-event/");
    connection.effectiveType = "4g";
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    intent("/plan-your-event/");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    intent("/plan-your-event/");
    const constrained = paths();
    Object.defineProperty(document, "hidden", { configurable: true, value: false });

    for (const href of [
      "/operator/",
      "/api/enquiry",
      "/cdn-cgi/access/login",
      "/unknown/",
      "/services/../operator/",
      "https://example.invalid/",
      "/privacy/#main",
    ]) {
      intent(href);
    }
    intent("/", "_blank");
    intent("/", "other-window");
    intent("/", "", true);
    const excluded = paths();

    intent("/plan-your-event/?service=catering#summary");
    intent("/plan-your-event/?service=decor");
    const eligible = paths();
    connection.saveData = true;
    intent("/");
    const changedSaver = paths();
    connection.saveData = false;
    intent("/");
    return { initialSaver, constrained, excluded, eligible, changedSaver, recovered: paths() };
  });

  expect(result.initialSaver).toEqual([]);
  expect(result.constrained).toEqual([]);
  expect(result.excluded).toEqual([]);
  expect(result.eligible).toEqual(["/plan-your-event/"]);
  expect(result.changedSaver).toEqual(["/plan-your-event/"]);
  expect(result.recovered).toEqual(["/plan-your-event/", "/"]);
});

test("public link intent still works without Network Information API support", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });
  await page.goto("/privacy/");
  await page.evaluate(() => {
    const link = document.createElement("a");
    link.href = "/plan-your-event/";
    document.body.append(link);
    link.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    link.remove();
  });
  await expect(page.locator('link[rel="prefetch"][href="/plan-your-event/"]')).toHaveCount(1);
});
