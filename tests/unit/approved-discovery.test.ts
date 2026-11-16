import { describe, expect, it } from "vitest";
import { servicePageHref, type ApprovedServicePage } from "../../src/lib/services/publication";
import { featuredStoryPath, type ApprovedStory } from "../../src/lib/stories/publication";

describe("published content discovery", () => {
  const catering = {
    slug: "hyderabadi-wedding-catering",
    plannerService: "catering",
  } as ApprovedServicePage;

  it("keeps the existing planner route until a service has an approved page", () => {
    expect(servicePageHref("catering", [])).toBe("/plan-your-event/?service=catering");
    expect(servicePageHref("catering", [catering])).toBe("/services/hyderabadi-wedding-catering/");
    expect(servicePageHref("decor", [catering])).toBe("/plan-your-event/?service=decor");
  });

  it("does not advertise invented case studies and links only published records", () => {
    expect(featuredStoryPath([])).toBeNull();
    const story = { slug: "2025-12-garden-walima" } as ApprovedStory;
    expect(featuredStoryPath([story])).toBe("/stories/2025-12-garden-walima/");
  });
});
