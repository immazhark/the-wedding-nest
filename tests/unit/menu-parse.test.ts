import { describe, expect, it } from "vitest";
import { parseMenuBody } from "../../src/lib/services/menu";
import catering from "../../src/content/services/hyderabadi-wedding-catering.json";

const words = (s: string) =>
  s
    .replace(/[“”".:,]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

describe("parseMenuBody", () => {
  it("splits a tagline, labelled courses and unlabelled notes", () => {
    const m = parseMenuBody(
      "“Simple flavors.” Platter: Veg Rolls, Stick Chicken. Main course: Harees, Pulao. Green salad and water bottles.",
    );
    expect(m).toEqual({
      tagline: "Simple flavors.",
      courses: [
        { label: "Platter", items: ["Veg Rolls", "Stick Chicken"] },
        { label: "Main course", items: ["Harees", "Pulao"] },
      ],
      notes: ["Green salad and water bottles"],
    });
  });

  it("keeps an 'or' choice together as one item", () => {
    const m = parseMenuBody("Main course: Mutton Harees or Mutton Marag, Achari Chicken.");
    expect(m?.courses[0]?.items).toEqual(["Mutton Harees or Mutton Marag", "Achari Chicken"]);
  });

  it("returns null for prose with no labelled courses", () => {
    expect(
      parseMenuBody("Add live counters, cotton candy and more. Tell us what you want."),
    ).toBeNull();
  });

  it("handles a body without a tagline", () => {
    const m = parseMenuBody("Desserts: Fruit Punch, Malayi Rabdi.");
    expect(m?.tagline).toBeUndefined();
    expect(m?.courses).toEqual([{ label: "Desserts", items: ["Fruit Punch", "Malayi Rabdi"] }]);
  });

  it("loses no word of any published catering menu", () => {
    const menus = catering.sections.filter((s) => parseMenuBody(s.body));
    expect(menus.map((s) => s.title)).toEqual([
      "Deccani Delight",
      "Nawabi Zaiqa",
      "Daawat-E-Khaas",
      "Shahi Dastarkhwaan",
    ]);
    for (const s of menus) {
      const m = parseMenuBody(s.body)!;
      const rebuilt = [
        m.tagline ?? "",
        ...m.courses.flatMap((c) => [c.label, ...c.items]),
        ...m.notes,
      ].join(" ");
      expect(words(rebuilt).sort()).toEqual(words(s.body).sort());
    }
  });

  it("leaves the add-ons section as plain prose", () => {
    const addOns = catering.sections.find((s) => s.title.startsWith("Add-ons"))!;
    expect(parseMenuBody(addOns.body)).toBeNull();
  });
});
