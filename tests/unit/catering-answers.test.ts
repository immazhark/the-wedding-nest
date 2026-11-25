import { describe, expect, it } from "vitest";
import { cateringAnswers } from "../../src/lib/services/catering-answers";
import catering from "../../src/content/services/hyderabadi-wedding-catering.json";

describe("approved catering answers", () => {
  it("returns two direct answers from current approved source text", () => {
    const answers = cateringAnswers(catering);
    expect(answers.map(({ question }) => question)).toEqual([
      "Can I customise the menu?",
      "Are set prices published?",
    ]);
    const copy = [catering.introduction, ...catering.sections.map((section) => section.body)];
    for (const { answer } of answers) {
      expect(copy.some((body) => body.includes(answer))).toBe(true);
    }
  });

  it("does not repeat withdrawn approved statements", () => {
    const page = { ...catering, sections: [], introduction: "Updated owner-reviewed copy." };
    expect(cateringAnswers(page)).toEqual([]);
  });

  it("does not apply catering statements to other service categories", () => {
    expect(cateringAnswers({ ...catering, slug: "guest-hospitality-hyderabad" })).toEqual([]);
  });
});
