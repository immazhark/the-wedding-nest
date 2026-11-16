import { describe, expect, it } from "vitest";
import { readPlannerIntent, applyPlannerIntent } from "../../src/lib/enquiry/intent";
import { emptyEnquiry } from "../../src/lib/enquiry/schema";

describe("contextual planner links", () => {
  it("accepts only single, known occasion and service identifiers", () => {
    expect(readPlannerIntent("?occasion=nikah")).toEqual({ occasion: "nikah" });
    expect(readPlannerIntent("?service=catering")).toEqual({ service: "catering" });
    expect(readPlannerIntent("?occasion=mehndi&service=mehndi-artist")).toEqual({
      occasion: "mehndi",
      service: "mehndi-artist",
    });
    expect(readPlannerIntent("?occasion=nikah&occasion=walima")).toEqual({});
    expect(readPlannerIntent("?occasion=not-an-event")).toEqual({});
    expect(readPlannerIntent("?service=<script>")).toEqual({});
    expect(readPlannerIntent("?occasion=nikah&service=not-a-service")).toEqual({});
    expect(readPlannerIntent("?utm_source=instagram&phone=9876543210")).toEqual({});
  });

  it("adds a selected occasion without losing a previous non-sensitive draft", () => {
    const draft = {
      ...emptyEnquiry(),
      occasions: ["walima" as const],
      scope: "full-planning" as const,
      styles: ["heritage" as const],
      budget: "discuss" as const,
    };
    const result = applyPlannerIntent(draft, { occasion: "nikah" });
    expect(result.occasions).toEqual(["walima", "nikah"]);
    expect(result.scope).toBe("full-planning");
    expect(result.styles).toEqual(["heritage"]);
    expect(result.budget).toBe("discuss");
    expect(draft.occasions).toEqual(["walima"]);
  });

  it("selects specific services only when eligible for the occasion", () => {
    const base = emptyEnquiry();
    const specific = applyPlannerIntent(base, { service: "catering" });
    expect(specific.scope).toBe("specific-services");
    expect(specific.services).toEqual(["catering"]);
    expect(specific.occasions).toEqual([]);
    const contextual = applyPlannerIntent(base, {
      occasion: "mehndi",
      service: "mehndi-artist",
    });
    expect(contextual.occasions).toEqual(["mehndi"]);
    expect(contextual.services).toEqual(["mehndi-artist"]);
    expect(applyPlannerIntent(base, { service: "mehndi-artist" })).toBe(base);
  });
});
