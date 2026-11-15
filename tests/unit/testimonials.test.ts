import { describe, expect, it } from "vitest";
import { publishable, testimonialSchema } from "../../src/lib/testimonials/schema";

const quote = {
  kind: "quote",
  source: "google",
  sourceUrl: "https://www.google.com/maps/place/example",
  text: "They looked after every guest at our Walima as if they were family.",
  attribution: "Ayesha K.",
  attributionStyle: "first-name-initial",
  eventCategory: "walima",
  permission: true,
};

const film = {
  kind: "video",
  source: "direct",
  title: "A family on planning their daughter’s Nikah",
  attribution: "The bride’s family",
  attributionStyle: "role",
  video: {
    src: "/media/testimonials/example.mp4",
    poster: "/media/testimonials/example.jpg",
    captions: "/media/testimonials/example.vtt",
    durationSeconds: 48,
  },
  transcript: "A transcript of everything said in the film.",
  permission: true,
};

describe("testimonial schema", () => {
  it("accepts a permitted, attributed quotation and a captioned film", () => {
    expect(testimonialSchema.safeParse(quote).success).toBe(true);
    expect(testimonialSchema.safeParse(film).success).toBe(true);
  });

  it("rejects anything without explicit permission", () => {
    for (const permission of [false, undefined, "yes"]) {
      expect(testimonialSchema.safeParse({ ...quote, permission }).success).toBe(false);
    }
  });

  it("requires a source link for Google reviews", () => {
    const { sourceUrl: _omit, ...noLink } = quote;
    expect(testimonialSchema.safeParse(noLink).success).toBe(false);
  });

  it("requires captions, a poster and a transcript for films", () => {
    expect(
      testimonialSchema.safeParse({ ...film, video: { ...film.video, captions: undefined } })
        .success,
    ).toBe(false);
    expect(
      testimonialSchema.safeParse({ ...film, video: { ...film.video, poster: undefined } }).success,
    ).toBe(false);
    expect(testimonialSchema.safeParse({ ...film, transcript: undefined }).success).toBe(false);
  });

  it("has no place for star ratings or review counts", () => {
    const parsed = testimonialSchema.parse({ ...quote, rating: 5, reviewCount: 120 });
    expect(parsed).not.toHaveProperty("rating");
    expect(parsed).not.toHaveProperty("reviewCount");
  });

  it("publishable() keeps only valid entries, ordered", () => {
    const list = publishable([
      { ...quote, order: 2 },
      { ...quote, permission: false },
      { ...film, order: 1 },
    ]);
    expect(list.map((t) => t.kind)).toEqual(["video", "quote"]);
  });
});
