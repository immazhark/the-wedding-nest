import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function renderNotice(released: string, enabled: string, siteKey: string) {
  vi.stubEnv("PUBLIC_SITE_RELEASED", released);
  vi.stubEnv("PUBLIC_ENQUIRIES_ENABLED", enabled);
  vi.stubEnv("PUBLIC_TURNSTILE_SITE_KEY", siteKey);
  vi.resetModules();
  const { default: Notice } = await import("../../src/components/PreviewNotice.astro");
  const container = await AstroContainer.create();
  return container.renderToString(Notice);
}

describe("rendered release disclosure", () => {
  it("renders the default design notice in the initial HTML", async () => {
    const html = await renderNotice("false", "false", "");
    expect(html).toContain("Design preview");
    expect(html).toContain('role="note"');
  });

  it("removes the design notice only for an explicit public release", async () => {
    const html = await renderNotice("true", "false", "");
    expect(html).not.toContain("Design preview");
    expect(html).not.toContain('role="note"');
  });

  it("renders the fictional-data warning despite the public-release flag", async () => {
    const html = await renderNotice("true", "true", "1x00000000000000000000AA");
    expect(html).toContain("Test environment");
    expect(html).toContain("Use fictional details only");
    expect(html).not.toContain("Design preview");
  });
});
