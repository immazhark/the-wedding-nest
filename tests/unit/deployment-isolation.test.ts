import { readFileSync } from "node:fs";
import { parseConfigFileTextToJson } from "typescript";
import { describe, expect, it } from "vitest";

describe("enquiry deployment isolation", () => {
  const parsed = parseConfigFileTextToJson(
    "wrangler.jsonc",
    readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8"),
  );
  const config = parsed.config;

  it("keeps live and branch preview intake disabled without limiter or database bindings", () => {
    expect(parsed.error).toBeUndefined();
    for (const environment of [config, config.previews]) {
      expect(environment.vars.ENQUIRIES_ENABLED).toBe("false");
      expect(environment.ratelimits ?? []).toEqual([]);
      expect(environment.d1_databases ?? []).toEqual([]);
    }
  });

  it("isolates the staging limiter and preserves a minute of fictional QA headroom", () => {
    expect(parsed.error).toBeUndefined();
    const staging = config.env.staging;
    expect(staging.name).toBe("the-wedding-nest-staging");
    expect(staging.ratelimits).toEqual([
      {
        name: "ENQUIRY_RATE_LIMITER",
        namespace_id: "1457096587",
        simple: { limit: 30, period: 60 },
      },
    ]);
    const namespaces = Object.values(config.env).flatMap(
      (environment: any) => (environment.ratelimits ?? []).map((binding: any) => binding.namespace_id),
    );
    expect(new Set(namespaces).size).toBe(namespaces.length);
  });
});
