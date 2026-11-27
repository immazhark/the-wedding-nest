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
      "/operator/labels.js",
      "/api/operator/enquiries",
      "/api/operator/delivery-overview",
      "/api/operator/delivery-held",
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
  it("protects delivery overview and forbids writes even for operators", async () => {
    const db = {
      prepare: () => {
        throw new Error("Database unavailable");
      },
    };
    const configured = { ...env, DB: db };
    const path = "/api/operator/delivery-overview";
    const response = await routeOperator(get(path), configured, deps("owner@example.com"));
    expect(response?.status).toBe(503);
    expect(response?.headers.get("cache-control")).toBe("no-store");
    const post = new Request(`https://twn.test${path}`, { method: "POST" });
    expect((await routeOperator(post, configured, deps("owner@example.com")))?.status).toBe(405);
  });
  it("returns 503 for an authenticated API call when no database is bound", async () => {
    const r = await routeOperator(get("/api/operator/enquiries"), env, deps("owner@example.com"));
    expect(r?.status).toBe(503);
  });
});

describe("held delivery route", () => {
  const configured = {
    ...env,
    DB: {
      prepare: () => {
        throw new Error("private storage detail");
      },
    },
  };
  it("rejects writes without touching storage", async () => {
    const response = await routeOperator(
      new Request("https://twn.test/api/operator/delivery-held", { method: "POST" }),
      configured,
      deps("owner@example.com"),
    );
    expect(response?.status).toBe(405);
    expect(response?.headers.get("allow")).toBe("GET");
    expect(response?.headers.get("cache-control")).toBe("no-store");
  });
  it("returns safe invalid-query errors before storage access", async () => {
    for (const [query, error] of [
      ["after=2026-12-01T10:00:00.000Z", "invalid_cursor"],
      ["limit=bad", "invalid_limit"],
    ]) {
      const response = await routeOperator(
        get("/api/operator/delivery-held?" + query),
        configured,
        deps("owner@example.com"),
      );
      expect(response?.status).toBe(400);
      expect(await response?.json()).toEqual({ error });
    }
  });
  it("fails storage safely and logs no linked event identifier", async () => {
    const logs: unknown[] = [];
    const response = await routeOperator(get("/api/operator/delivery-held"), configured, {
      ...deps("owner@example.com"),
      log: (entry) => logs.push(entry),
    });
    expect(response?.status).toBe(503);
    expect(await response?.json()).toEqual({ error: "storage_unavailable" });
    expect(logs).toEqual([{ event: "operator", action: "delivery_held", outcome: "unavailable" }]);
  });
  it("returns metadata with no-store and noindex under authenticated GET", async () => {
    const db = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({
            results: [
              {
                id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                created_at: "2026-12-01T09:00:00.000Z",
                attempts: 8,
                held_reason: "provider",
              },
            ],
          }),
        }),
      }),
    };
    const response = await routeOperator(
      get("/api/operator/delivery-held"),
      { ...env, DB: db },
      deps("owner@example.com"),
    );
    expect(response?.status).toBe(200);
    expect(response?.headers.get("cache-control")).toBe("no-store");
    expect(response?.headers.get("x-robots-tag")).toContain("noindex");
    expect(await response?.json()).toEqual({
      events: [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          createdAt: "2026-12-01T09:00:00.000Z",
          attempts: 8,
          reason: "provider",
          window: "within_window",
        },
      ],
      nextCursor: null,
    });
  });
});
