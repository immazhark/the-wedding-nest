import { describe, expect, it } from "vitest";
import { emptyEnquiry } from "../../src/lib/enquiry/schema";
import { summarise } from "../../src/lib/enquiry/summary";

describe("review summary edit destinations", () => {
  it("maps every answer to its editable questionnaire stage", () => {
    const rows = summarise({
      ...emptyEnquiry(),
      occasions: ["mehndi"],
      scope: "full-planning",
      notes: "A fictional note",
      name: "Sample",
    });
    expect(rows.map(({ label, stage }) => [label, stage])).toEqual([
      ["Occasion", "occasion"],
      ["Help needed", "scope"],
      ["Style", "style"],
      ["Date", "logistics"],
      ["Guests", "logistics"],
      ["Location", "logistics"],
      ["Budget", "logistics"],
      ["Notes", "logistics"],
      ["Name", "contact"],
      ["Contact", "contact"],
    ]);
  });
});
