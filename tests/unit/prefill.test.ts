import { describe, expect, it } from "vitest";
import { emptyEnquiry } from "../../src/lib/enquiry/schema";
import { plannerHref, prefillFromQuery } from "../../src/lib/enquiry/prefill";

const q = (s: string) => new URLSearchParams(s);

describe("planner prefill from links", () => {
  it("adds valid occasions and ignores unknown or repeated ones", () => {
    const s = prefillFromQuery(
      emptyEnquiry(),
      q("occasion=nikah&occasion=walima&occasion=hack&occasion=nikah"),
    );
    expect(s.occasions).toEqual(["nikah", "walima"]);
  });

  it("a service link selects specific services with that service", () => {
    const s = prefillFromQuery(emptyEnquiry(), q("service=catering"));
    expect(s.scope).toBe("specific-services");
    expect(s.services).toEqual(["catering"]);
  });

  it("ignores services that don't apply to the chosen occasions", () => {
    const s = prefillFromQuery(emptyEnquiry(), q("occasion=corporate&service=mehndi-artist"));
    expect(s.services).toEqual([]);
    expect(s.scope).toBeNull();
  });

  it("keeps existing draft choices and adds to them", () => {
    const s = prefillFromQuery({ ...emptyEnquiry(), occasions: ["mehndi"] }, q("occasion=shaadi"));
    expect(s.occasions).toEqual(["mehndi", "shaadi"]);
  });

  it("builds matching links", () => {
    expect(plannerHref({ occasions: ["nikah", "walima"] })).toBe(
      "/plan-your-event/?occasion=nikah&occasion=walima",
    );
    expect(plannerHref({ service: "decor" })).toBe("/plan-your-event/?service=decor");
  });
});
