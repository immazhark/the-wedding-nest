import { describe, expect, it } from "vitest";
import { storyPlannerHref } from "../../src/lib/stories/planner-link";

describe("published event-story enquiry links", () => {
  it("preselects a known occasion without skipping the planner", () => {
    expect(storyPlannerHref("walima")).toBe("/plan-your-event/?occasion=walima");
    expect(storyPlannerHref("nikah")).toBe("/plan-your-event/?occasion=nikah");
    expect(storyPlannerHref("mehndi")).toBe("/plan-your-event/?occasion=mehndi");
  });

  it("never invents an occasion for non-occasion photo categories", () => {
    expect(storyPlannerHref("catering")).toBe("/plan-your-event/");
    expect(storyPlannerHref("decor")).toBe("/plan-your-event/");
    expect(storyPlannerHref("details")).toBe("/plan-your-event/");
  });
});
