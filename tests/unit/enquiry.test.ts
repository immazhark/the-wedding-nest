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

  it("validates dates and allows an undecided date", () => {
    expect(validateEnquiry({ ...complete(), date: { kind: "undecided" } }).ok).toBe(true);
    expect(validateEnquiry({ ...complete(), date: { kind: "date", value: "2027-13-40" } }).ok).toBe(
      false,
    );
  });

  it("keeps marketing consent separate and false by default", () => {
    const r = validateEnquiry(complete());
    expect(r.ok && r.value.marketingConsent).toBe(false);
  });
});

describe("local draft (privacy)", () => {
  it("never includes contact details or notes", () => {
    const draft = toDraft(complete(), 0);
    const json = JSON.stringify(draft);
    expect(json).not.toContain("Test Person");
    expect(json).not.toContain("98765");
    expect(json).not.toMatch(/"(name|phone|notes|consent)"/);
  });

  it("restores non-sensitive selections and expires old drafts", () => {
    const draft = toDraft(complete(), 1_000);
    const restored = restoreDraft(JSON.parse(JSON.stringify(draft)), 1_000 + 60_000);
    expect(restored?.occasions).toEqual(["nikah", "walima"]);
    expect(restored?.name).toBe("");
    expect(restoreDraft(draft, 1_000 + DRAFT_TTL_MS + 1)).toBeNull();
  });

  it("discards tampered drafts", () => {
    expect(restoreDraft({ v: 1, savedAt: 0, data: { occasions: ["hack"] } }, 10)).toBeNull();
    expect(restoreDraft("nonsense", 10)).toBeNull();
  });
});
