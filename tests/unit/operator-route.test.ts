import { describe, expect, it } from "vitest";
import { routeOperator } from "../../src/worker/operator-route";

const deps = (email: string | null) => ({
  authenticate: async () => email,
  now: () => "2026-12-01T10:00:00.000Z",
  log: () => {},
});
const env = {
  ASSETS: {
    fetch: async () =>
      new Response("<html>ui</html>", { headers: { "content-type": "text/html" } }),
  },
  DB: undefined,
};
const get = (p: string) => new Request(`https://twn.test${p}`);

describe("routeOperator", () => {
  it("ignores unrelated paths", async () => {
    expect(await routeOperator(get("/"), env, deps("a@b.c"))).toBeNull();
    expect(await routeOperator(get("/api/enquiry"), env, deps("a@b.c"))).toBeNull();
  });
  it("answers 404 (not 401) to unauthenticated callers on UI and API", async () => {
    for (const p of [
      "/operator",
      "/operator/",
      "/operator/operator.js",
      "/api/operator/enquiries",
    ]) {
      const r = await routeOperator(get(p), env, deps(null));
      expect(r?.status, p).toBe(404);
      expect(r?.headers.get("cache-control")).toBe("no-store");
    }
  });
  it("serves the UI to an operator with no-store, noindex and a strict CSP", async () => {
    const r = await routeOperator(get("/operator/"), env, deps("owner@example.com"));
    expect(r?.status).toBe(200);
    expect(r?.headers.get("cache-control")).toBe("no-store");
    expect(r?.headers.get("x-robots-tag")).toContain("noindex");
    expect(r?.headers.get("content-security-policy")).toContain("script-src 'self'");
    expect(r?.headers.get("content-security-policy")).not.toContain("unsafe-inline");
  });
  it("returns 503 for an authenticated API call when no database is bound", async () => {
    const r = await routeOperator(get("/api/operator/enquiries"), env, deps("owner@example.com"));
    expect(r?.status).toBe(503);
  });
});
