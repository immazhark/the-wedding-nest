import { describe, expect, it } from "vitest";
import {
  OCCASIONS,
  STAGES,
  emptyEnquiry,
  serviceOptionsFor,
  type EnquiryState,
} from "../../src/lib/enquiry/schema";
import {
  firstIncompleteStage,
  isStageComplete,
  nextStage,
  previousStage,
} from "../../src/lib/enquiry/flow";
import { validateEnquiry, LIMITS } from "../../src/lib/enquiry/validate";
import { DRAFT_TTL_MS, restoreDraft, toDraft } from "../../src/lib/enquiry/draft";
import { previewPlanText } from "../../src/lib/enquiry/share";

const complete = (): EnquiryState => ({
  ...emptyEnquiry(),
  occasions: ["nikah", "walima"],
  scope: "specific-services",
  services: ["catering", "decor"],
  styles: ["heritage"],
  date: { kind: "date", value: "2027-02-14" },
  guestCount: "350",
  location: "Hyderabad",
  budget: "discuss",
  notes: "",
  name: "Test Person",
  phone: "+91 98765 43210",
  contactChannel: "whatsapp",
  consent: true,
});

describe("preview planning-choice sharing", () => {
  it("copies only approved planning choices, excluding private fields and hidden services", () => {
    const state = {
      ...complete(),
      scope: "full-planning" as const,
      name: "PRIVATE FULL NAME",
      phone: "PRIVATE PHONE",
      location: "PRIVATE HOME ADDRESS",
      notes: "PRIVATE FAMILY NOTES",
    };
    const text = previewPlanText(state);
    expect(text).toContain("The Wedding Nest — Planning choices");
    expect(text).toContain("Occasion: Nikah, Walima");
    expect(text).toContain("Help needed: End-to-end planning");
    expect(text).toContain("Guests: 350");
    expect(text).toContain("14 February 2027");
    expect(text).toContain("Budget: Prefer to discuss");
    expect(text).not.toContain("Specific services");
    for (const privateValue of ["PRIVATE", "Contact:", "Name:", "Location:", "Notes:"]) {
      expect(text).not.toContain(privateValue);
    }
  });

  it("includes allowed individual services but never unknown runtime data", () => {
    const value = previewPlanText({
      ...complete(),
      services: ["catering", "decor", { name: "PRIVATE" }] as unknown as EnquiryState["services"],
    });
    expect(value).toContain("Specific services: Catering & menus, Décor, florals & staging");
    expect(value).not.toContain("PRIVATE");
  });
});

describe("question tree", () => {
  it("has exactly five stages in the agreed order", () => {
    expect(STAGES.map((s) => s.id)).toEqual(["occasion", "scope", "style", "logistics", "contact"]);
  });

  it("includes Hyderabad wedding traditions and non-wedding occasions", () => {
    const ids = OCCASIONS.map((o) => o.id);
    for (const id of ["nikah", "walima", "mehndi", "shaadi", "corporate", "other"]) {
      expect(ids).toContain(id);
    }
  });

  it("offers mehndi-specific services only when a Mehndi occasion is chosen", () => {
    const base = serviceOptionsFor(["corporate"]).map((s) => s.id);
    const withMehndi = serviceOptionsFor(["mehndi"]).map((s) => s.id);
    expect(base).not.toContain("mehndi-artist");
    expect(withMehndi).toContain("mehndi-artist");
  });

  it("offers ceremony coordination for Nikah and AV for corporate events", () => {
    expect(serviceOptionsFor(["nikah"]).map((s) => s.id)).toContain("ceremony-coordination");
    expect(serviceOptionsFor(["corporate"]).map((s) => s.id)).toContain("av-production");
    expect(serviceOptionsFor(["birthday"]).map((s) => s.id)).not.toContain("ceremony-coordination");
  });
});

describe("flow", () => {
  it("requires at least one occasion", () => {
    expect(isStageComplete("occasion", emptyEnquiry())).toBe(false);
    expect(isStageComplete("occasion", { ...emptyEnquiry(), occasions: ["mehndi"] })).toBe(true);
  });

  it("requires services only when specific services are chosen", () => {
    const s = { ...emptyEnquiry(), occasions: ["shaadi" as const] };
    expect(isStageComplete("scope", { ...s, scope: "full-planning" })).toBe(true);
    expect(isStageComplete("scope", { ...s, scope: "specific-services" })).toBe(false);
    expect(
      isStageComplete("scope", { ...s, scope: "specific-services", services: ["catering"] }),
    ).toBe(true);
  });

  it("treats style as optional", () => {
    expect(isStageComplete("style", emptyEnquiry())).toBe(true);
  });

  it("does not require a budget", () => {
    const s = { ...complete(), budget: null };
    expect(isStageComplete("logistics", s)).toBe(true);
  });

  it("requires explicit consent on the contact stage", () => {
    expect(isStageComplete("contact", { ...complete(), consent: false })).toBe(false);
    expect(isStageComplete("contact", complete())).toBe(true);
  });

  it("navigates forwards and backwards and finds the first incomplete stage", () => {
    expect(nextStage("occasion")).toBe("scope");
    expect(nextStage("contact")).toBeNull();
    expect(previousStage("occasion")).toBeNull();
    expect(firstIncompleteStage(emptyEnquiry())).toBe("occasion");
    expect(firstIncompleteStage(complete())).toBeNull();
  });
});

describe("validateEnquiry (server-grade, accepts unknown input)", () => {
  it("accepts a complete enquiry and normalises it", () => {
    const result = validateEnquiry({ ...complete(), name: "  Test Person  " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe("Test Person");
  });

  it("rejects non-object input", () => {
    expect(validateEnquiry(null).ok).toBe(false);
    expect(validateEnquiry("x").ok).toBe(false);
  });

  it("rejects unknown occasions and services", () => {
    const r = validateEnquiry({
      ...complete(),
      occasions: ["nikah", "<script>"],
      services: ["teleport"],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.occasions).toBeDefined();
      expect(r.errors.services).toBeDefined();
    }
  });

  it("rejects duplicated occasion, service and style choices from untrusted JSON", () => {
    const variants = [
      { occasions: ["nikah", "nikah"] },
      { services: ["catering", "catering"] },
      { styles: ["heritage", "heritage"] },
    ] as const;
    for (const fields of variants) {
      const result = validateEnquiry({ ...complete(), ...fields });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const field = Object.keys(fields)[0] as "occasions" | "services" | "styles";
        expect(result.errors[field]).toBe("invalid");
      }
    }
  });

  it("rejects malformed optional selection collections instead of silently clearing them", () => {
    for (const field of ["services", "styles"] as const) {
      for (const value of ["catering", { choice: "heritage" }, 42, false]) {
        const result = validateEnquiry({
          ...complete(),
          scope: "full-planning",
          services: [],
          [field]: value,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.errors[field]).toBe("invalid");
      }
    }
  });

  it("preserves omitted or null optional collections as empty selections", () => {
    for (const value of [undefined, null, []]) {
      const result = validateEnquiry({
        ...complete(),
        scope: "full-planning",
        services: value,
        styles: value,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.services).toEqual([]);
        expect(result.value.styles).toEqual([]);
      }
    }
  });

  it("rejects hidden service selections when the visitor chooses full planning", () => {
    const result = validateEnquiry({
      ...complete(),
      scope: "full-planning",
      services: ["catering"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.services).toBe("invalid");
    const clean = validateEnquiry({ ...complete(), scope: "full-planning", services: [] });
    expect(clean.ok).toBe(true);
  });

  it("rejects a service that is not offered for the chosen occasions", () => {
    const r = validateEnquiry({
      ...complete(),
      occasions: ["corporate"],
      services: ["mehndi-artist"],
    });
    expect(r.ok).toBe(false);
  });

  it("requires consent to be literally true", () => {
    for (const consent of [false, "true", 1, undefined]) {
      const r = validateEnquiry({ ...complete(), consent });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.consent).toBe("consent_required");
    }
  });

  it("rejects malformed phone numbers and accepts Indian and international formats", () => {
    expect(validateEnquiry({ ...complete(), phone: "abc" }).ok).toBe(false);
    expect(validateEnquiry({ ...complete(), phone: "12" }).ok).toBe(false);
    expect(validateEnquiry({ ...complete(), phone: "9876543210" }).ok).toBe(true);
    expect(validateEnquiry({ ...complete(), phone: "+44 20 7946 0958" }).ok).toBe(true);
  });

  it("refuses malformed phone punctuation but supports ordinary international grouping", () => {
    for (const phone of [
      "9876543210(",
      ")9876543210",
      "(())9876543210",
      "9876543210-",
      "-9876543210",
      "9876--543210",
      "+91 (040 12345678",
    ]) {
      const result = validateEnquiry({ ...complete(), phone });
      expect(result.ok, phone).toBe(false);
      if (!result.ok) expect(result.errors.phone).toBe("invalid");
    }
    for (const phone of ["+1 (415) 555-2671", "(040) 2345-6789", "+44 (0)20 7946 0958"]) {
      expect(validateEnquiry({ ...complete(), phone }).ok, phone).toBe(true);
    }
  });

  it("enforces length limits on free text", () => {
    const r = validateEnquiry({ ...complete(), notes: "x".repeat(LIMITS.notes + 1) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.notes).toBe("too_long");
  });

  it("validates guest count as a bounded whole number but allows it to be blank", () => {
    expect(validateEnquiry({ ...complete(), guestCount: "" }).ok).toBe(true);
    expect(validateEnquiry({ ...complete(), guestCount: "-5" }).ok).toBe(false);
    expect(validateEnquiry({ ...complete(), guestCount: "12.5" }).ok).toBe(false);
    expect(validateEnquiry({ ...complete(), guestCount: "999999" }).ok).toBe(false);
  });

  it("rejects explicit malformed guest counts while preserving optional blanks", () => {
    for (const guestCount of [200, { count: 200 }, false, []]) {
      const result = validateEnquiry({ ...complete(), guestCount });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.guestCount).toBe("invalid");
    }
    for (const guestCount of [undefined, null, "", "  "]) {
      const result = validateEnquiry({ ...complete(), guestCount });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.guestCount).toBe("");
    }
  });

  it("validates dates and allows an undecided date", () => {
    expect(validateEnquiry({ ...complete(), date: { kind: "undecided" } }).ok).toBe(true);
    expect(validateEnquiry({ ...complete(), date: { kind: "date", value: "2027-13-40" } }).ok).toBe(
      false,
    );
  });

  it("rejects malformed explicit marketing consent, while omission remains opt-out", () => {
    for (const marketingConsent of ["true", "false", 1, 0, [], {}]) {
      const result = validateEnquiry({ ...complete(), marketingConsent });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.marketingConsent).toBe("invalid");
    }

    for (const marketingConsent of [undefined, null, false, true]) {
      const result = validateEnquiry({ ...complete(), marketingConsent });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.marketingConsent).toBe(marketingConsent === true);
    }
  });
});

describe("local draft (privacy)", () => {
  it("copies only valid selection identifiers into a privacy-safe snapshot", () => {
    const state = complete();
    const sensitive = { id: "nikah", phone: "PRIVATE PHONE", address: "PRIVATE ADDRESS" };
    state.occasions = ["nikah", sensitive] as unknown as EnquiryState["occasions"];
    state.services = ["catering", sensitive] as unknown as EnquiryState["services"];
    state.styles = ["heritage", sensitive] as unknown as EnquiryState["styles"];

    const draft = toDraft(state, 1_000);
    expect(draft.data.occasions).toEqual(["nikah"]);
    expect(draft.data.services).toEqual(["catering"]);
    expect(draft.data.styles).toEqual(["heritage"]);
    expect(JSON.stringify(draft)).not.toContain("PRIVATE");

    state.occasions.push("walima");
    state.services.push("decor");
    state.styles.push("garden");
    expect(draft.data.occasions).toEqual(["nikah"]);
    expect(draft.data.services).toEqual(["catering"]);
    expect(draft.data.styles).toEqual(["heritage"]);
  });

  it("safely drops malformed runtime selection collections before local draft storage", () => {
    const contaminated = { phone: "PRIVATE PHONE", address: "PRIVATE ADDRESS" };
    const baseline = complete();
    for (const field of ["occasions", "services", "styles"] as const) {
      for (const value of [contaminated, "nikah", null, 5]) {
        const state = { ...baseline, [field]: value } as unknown as EnquiryState;
        expect(() => toDraft(state, 1_000)).not.toThrow();
        const draft = toDraft(state, 1_000);
        expect(draft.data[field]).toEqual([]);
        expect(JSON.stringify(draft)).not.toContain("PRIVATE");
      }
    }
    const valid = toDraft(baseline, 1_000);
    expect(valid.data.occasions).toEqual(["nikah", "walima"]);
    expect(valid.data.services).toEqual(["catering", "decor"]);
    expect(valid.data.styles).toEqual(["heritage"]);
  });

  it("never stores hidden specific-service choices when scope is full planning", () => {
    const state = { ...complete(), scope: "full-planning" as const };
    // Changing scope may precede the UI's conditional checkbox cleanup.
    expect(state.services).toEqual(["catering", "decor"]);
    const draft = toDraft(state, 1_000);
    expect(draft.data.scope).toBe("full-planning");
    expect(draft.data.services).toEqual([]);

    const specific = toDraft(complete(), 1_000);
    expect(specific.data.services).toEqual(["catering", "decor"]);
  });

  it("does not persist unexpected objects in draft scalar fields", () => {
    const contaminated = {
      phone: "PRIVATE PHONE",
      address: "PRIVATE HOME",
    };
    const state = {
      ...complete(),
      scope: contaminated,
      budget: contaminated,
      guestCount: contaminated,
      date: { kind: "date", value: contaminated },
    } as unknown as EnquiryState;
    const draft = toDraft(state, 1_000);
    expect(draft.data.scope).toBeNull();
    expect(draft.data.budget).toBeNull();
    expect(draft.data.guestCount).toBe("");
    expect(draft.data.date).toEqual({ kind: "undecided" });
    expect(JSON.stringify(draft)).not.toContain("PRIVATE");

    const valid = toDraft(complete(), 1_000);
    expect(valid.data.scope).toBe("specific-services");
    expect(valid.data.budget).toBe("discuss");
    expect(valid.data.guestCount).toBe("350");
    expect(valid.data.date).toEqual({ kind: "date", value: "2027-02-14" });
  });

  it("serializes only approved date fields from a contaminated runtime object", () => {
    const date = {
      kind: "date" as const,
      value: "2027-02-14",
      phone: "PRIVATE PHONE",
      location: "PRIVATE HOME ADDRESS",
    };
    const draft = toDraft({ ...complete(), date }, 1_000);
    expect(draft.data.date).toEqual({ kind: "date", value: "2027-02-14" });
    expect(JSON.stringify(draft)).not.toContain("PRIVATE");
    expect(draft.savedAt).toBe(1_000);
  });

  it("scrubs nested date fields when restoring and rewriting a legacy draft", () => {
    const saved = toDraft(complete(), 1_000);
    const restored = restoreDraft(
      {
        ...saved,
        data: {
          ...saved.data,
          date: {
            kind: "date",
            value: "2027-02-14",
            phone: "PRIVATE PHONE",
            location: "PRIVATE HOME ADDRESS",
          },
        },
      },
      1_001,
    );
    expect(restored?.date).toEqual({ kind: "date", value: "2027-02-14" });
    expect(restored).not.toBeNull();
    const rewritten = toDraft(restored!, saved.savedAt);
    expect(JSON.stringify(rewritten)).not.toContain("PRIVATE");
    expect(rewritten.savedAt).toBe(1_000);
  });

  it("does not coerce malformed nested date values into valid dates", () => {
    const saved = toDraft(complete(), 1_000);
    for (const value of [["2027-02-14"], { value: "2027-02-14" }, null, 20270214]) {
      const restored = restoreDraft(
        { ...saved, data: { ...saved.data, date: { kind: "date", value } } },
        1_001,
      );
      expect(restored?.date).toEqual({ kind: "undecided" });
    }
  });
  it("never includes contact details or notes", () => {
    const draft = toDraft(complete(), 0);
    const json = JSON.stringify(draft);
    expect(json).not.toContain("Test Person");
    expect(json).not.toContain("98765");
    expect(json).not.toMatch(/"(name|phone|notes|consent)"/);
  });

  it("never includes free-text location, even when one was entered", () => {
    const draft = toDraft({ ...complete(), location: "12 Example Lane, Banjara Hills" }, 0);
    const json = JSON.stringify(draft);
    expect(json).not.toContain("Example Lane");
    expect(json).not.toMatch(/"location"/);
  });

  it("ignores a location smuggled into an old draft", () => {
    const restored = restoreDraft(
      { v: 1, savedAt: 0, data: { occasions: ["nikah"], location: "Home address" } },
      10,
    );
    expect(restored?.location).toBe("");
  });

  it("discards old service selections stored under full planning", () => {
    const stale = toDraft({ ...complete(), scope: "full-planning", services: ["catering"] }, 100);
    expect(restoreDraft(stale, 200)?.services).toEqual([]);
  });

  it("restores non-sensitive selections and expires old drafts", () => {
    const draft = toDraft(complete(), 1_000);
    const restored = restoreDraft(JSON.parse(JSON.stringify(draft)), 1_000 + 60_000);
    expect(restored?.occasions).toEqual(["nikah", "walima"]);
    expect(restored?.name).toBe("");
    expect(restoreDraft(draft, 1_000 + DRAFT_TTL_MS + 1)).toBeNull();
  });

  it("discards non-finite, negative and future timestamps", () => {
    const valid = toDraft(complete(), 1_000);
    for (const savedAt of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1_001]) {
      expect(restoreDraft({ ...valid, savedAt }, 1_000)).toBeNull();
    }
    expect(restoreDraft(valid, 1_000 + DRAFT_TTL_MS)).not.toBeNull();
  });

  it("rejects duplicate options in restored drafts before they reach the planner", () => {
    const saved = toDraft(complete(), 1_000);
    expect(restoreDraft(saved, 1_001)).not.toBeNull();

    for (const data of [
      { occasions: ["nikah", "nikah"] },
      { services: ["catering", "catering"] },
      { styles: ["heritage", "heritage"] },
    ]) {
      expect(restoreDraft({ ...saved, data: { ...saved.data, ...data } }, 1_001)).toBeNull();
    }
  });

  it("discards tampered drafts", () => {
    expect(restoreDraft({ v: 1, savedAt: 0, data: { occasions: ["hack"] } }, 10)).toBeNull();
    expect(restoreDraft("nonsense", 10)).toBeNull();
  });
});
