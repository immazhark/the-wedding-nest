import { describe, expect, it } from "vitest";
import { emptyEnquiry, type EnquiryState } from "../../src/lib/enquiry/schema";
import { stageError } from "../../src/lib/enquiry/flow";
import { summarise } from "../../src/lib/enquiry/summary";

const filled = (): EnquiryState => ({
  ...emptyEnquiry(),
  occasions: ["mehndi", "nikah"],
  scope: "specific-services",
  services: ["mehndi-artist", "catering"],
  styles: ["heritage"],
  date: { kind: "date", value: "2027-02-14" },
  guestCount: "250",
  location: "Banjara Hills",
  budget: null,
  name: "A Person",
  phone: "9876543210",
  consent: true,
});

describe("stageError (plain-language messages)", () => {
  it("returns a message for each incomplete required stage and null when complete", () => {
    expect(stageError("occasion", emptyEnquiry())).toMatch(/choose at least one occasion/i);
    expect(stageError("scope", { ...emptyEnquiry(), occasions: ["nikah"] })).toMatch(
      /how we can help/i,
    );
    expect(
      stageError("scope", { ...emptyEnquiry(), occasions: ["nikah"], scope: "specific-services" }),
    ).toMatch(/at least one service/i);
    expect(stageError("logistics", { ...filled(), guestCount: "abc" })).toMatch(/guest/i);
    expect(stageError("contact", { ...filled(), name: "" })).toMatch(/name/i);
    expect(stageError("contact", { ...filled(), phone: "12" })).toMatch(/phone/i);
    expect(stageError("contact", { ...filled(), consent: false })).toMatch(/agree/i);
    for (const stage of ["occasion", "scope", "style", "logistics", "contact"] as const) {
      expect(stageError(stage, filled())).toBeNull();
    }
  });
});

describe("summarise", () => {
  it("lists readable labels for every answered stage and marks optional gaps", () => {
    const rows = Object.fromEntries(summarise(filled()).map((r) => [r.label, r.value]));
    expect(rows["Occasion"]).toBe("Mehndi, Nikah");
    expect(rows["Help needed"]).toBe("Specific services: Mehndi artist, Catering & menus");
    expect(rows["Style"]).toBe("Hyderabadi heritage");
    expect(rows["Date"]).toBe("14 February 2027");
    expect(rows["Guests"]).toBe("250");
    expect(rows["Location"]).toBe("Banjara Hills");
    expect(rows["Budget"]).toBe("Not shared");
    expect(rows["Name"]).toBe("A Person");
    expect(rows["Contact"]).toBe("9876543210 · WhatsApp");
  });

  it("describes undecided dates and full planning", () => {
    const rows = Object.fromEntries(
      summarise({
        ...filled(),
        scope: "full-planning",
        date: { kind: "undecided" },
        styles: [],
      }).map((r) => [r.label, r.value]),
    );
    expect(rows["Help needed"]).toBe("End-to-end planning");
    expect(rows["Date"]).toBe("Not decided yet");
    expect(rows["Style"]).toBe("No preference yet");
  });
});
