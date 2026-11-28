import { afterEach, describe, expect, it, vi } from "vitest";

async function setup(reducedMotion = false, saveData = false) {
  vi.resetModules();
  const motion = new EventTarget() as EventTarget & { matches: boolean };
  motion.matches = reducedMotion;
  const toggle = Object.assign(new EventTarget(), { hidden: true });
  const label = { textContent: "Pause" };
  const attributes = new Set<string>();
  const pending: Array<{ resolve: () => void; reject: () => void }> = [];
  const video = {
    paused: true,
    play: vi.fn(() => {
      video.paused = false;
      return new Promise<void>((resolve, reject) => {
        pending.push({ resolve, reject: () => reject(new Error("Autoplay denied")) });
      });
    }),
    pause: vi.fn(() => {
      video.paused = true;
    }),
  };
  const frame = {
    querySelector: (selector: string) =>
      (
        ({
          "[data-loop-video]": video,
          "[data-loop-toggle]": toggle,
          "[data-loop-toggle-label]": label,
        }) as Record<string, unknown>
      )[selector],
    toggleAttribute: (name: string, enabled: boolean) =>
      enabled ? attributes.add(name) : attributes.delete(name),
  };
  let notify: (
    entries: Array<{ isIntersecting: boolean; intersectionRatio: number }>,
  ) => void = () => {};
  class Observer {
    constructor(callback: typeof notify) {
      notify = callback;
    }
    observe() {}
  }
  vi.stubGlobal("window", { matchMedia: () => motion, IntersectionObserver: Observer });
  vi.stubGlobal("IntersectionObserver", Observer);
  const documentState = Object.assign(new EventTarget(), {
    querySelectorAll: () => [frame],
    visibilityState: "visible",
  });
  const connection = Object.assign(new EventTarget(), { saveData });
  vi.stubGlobal("document", documentState);
  vi.stubGlobal("navigator", { connection });
  await import("../../src/scripts/loop");
  return {
    video,
    toggle,
    label,
    attributes,
    pending,
    intersect: (ratio: number) => notify([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]),
    motion: (matches: boolean) => {
      motion.matches = matches;
      motion.dispatchEvent(new Event("change"));
    },
    visibility: (state: string) => {
      documentState.visibilityState = state;
      documentState.dispatchEvent(new Event("visibilitychange"));
    },
    saveData: (enabled: boolean) => {
      connection.saveData = enabled;
      connection.dispatchEvent(new Event("change"));
    },
    settle: async () => {
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("silent service films", () => {
  it("pauses when the document hides and ignores its late play completion", async () => {
    const film = await setup();
    film.intersect(0.8);
    film.visibility("hidden");
    film.pending[0]!.resolve();
    await film.settle();
    expect(film.video.paused).toBe(true);
    expect(film.attributes.has("data-playing")).toBe(false);
    film.visibility("visible");
    expect(film.video.play).toHaveBeenCalledTimes(2);
  });

  it("keeps the poster under Save-Data and responds to changes", async () => {
    const film = await setup(false, true);
    film.intersect(0.8);
    expect(film.video.play).not.toHaveBeenCalled();
    expect(film.toggle.hidden).toBe(true);
    film.saveData(false);
    expect(film.video.play).toHaveBeenCalledTimes(1);
    film.pending[0]!.resolve();
    await film.settle();
    film.saveData(true);
    expect(film.video.paused).toBe(true);
    expect(film.attributes.has("data-playing")).toBe(false);
    expect(film.toggle.hidden).toBe(true);
  });

  it("does not undo a visitor's pause when returning to a visible document", async () => {
    const film = await setup();
    film.intersect(0.8);
    film.pending[0]!.resolve();
    await film.settle();
    film.toggle.dispatchEvent(new Event("click"));
    film.visibility("hidden");
    film.visibility("visible");
    expect(film.video.play).toHaveBeenCalledTimes(1);
    expect(film.video.paused).toBe(true);
  });

  it("waits until at least 40 percent is visible, and pauses below that threshold", async () => {
    const film = await setup();
    film.intersect(0.1);
    expect(film.video.play).not.toHaveBeenCalled();
    film.intersect(0.4);
    expect(film.video.play).toHaveBeenCalledTimes(1);
    film.pending[0]!.resolve();
    await film.settle();
    expect(film.attributes.has("data-playing")).toBe(true);
    film.intersect(0.39);
    expect(film.video.paused).toBe(true);
    expect(film.attributes.has("data-playing")).toBe(false);
  });

  it("does not show a late play completion after the film leaves the viewport", async () => {
    const film = await setup();
    film.intersect(0.8);
    film.intersect(0);
    film.pending[0]!.resolve();
    await film.settle();
    expect(film.attributes.has("data-playing")).toBe(false);
    expect(film.label.textContent).toBe("Play");
  });

  it("keeps a newer play request when an older request settles late", async () => {
    const film = await setup();
    film.intersect(0.8);
    film.intersect(0);
    film.intersect(0.8);
    film.intersect(0.9);
    expect(film.video.play).toHaveBeenCalledTimes(2);
    film.pending[0]!.resolve();
    await film.settle();
    expect(film.attributes.has("data-playing")).toBe(false);
    expect(film.video.paused).toBe(false);
    film.pending[1]!.resolve();
    await film.settle();
    expect(film.attributes.has("data-playing")).toBe(true);
  });

  it("does not undo a manual pause while play is still pending", async () => {
    const film = await setup();
    film.intersect(0.8);
    film.toggle.dispatchEvent(new Event("click"));
    film.pending[0]!.resolve();
    await film.settle();
    expect(film.video.paused).toBe(true);
    expect(film.attributes.has("data-playing")).toBe(false);
    film.intersect(0.9);
    expect(film.video.play).toHaveBeenCalledTimes(1);
  });

  it("reacts to reduced motion changes, including an initially enabled preference", async () => {
    const film = await setup(true);
    film.intersect(0.8);
    expect(film.video.play).not.toHaveBeenCalled();
    expect(film.toggle.hidden).toBe(true);
    film.motion(false);
    expect(film.video.play).toHaveBeenCalledTimes(1);
    film.pending[0]!.resolve();
    await film.settle();
    film.motion(true);
    expect(film.video.paused).toBe(true);
    expect(film.toggle.hidden).toBe(true);
    expect(film.attributes.has("data-playing")).toBe(false);
  });

  it("preserves an explicit pause across visibility and motion changes", async () => {
    const film = await setup();
    film.intersect(0.8);
    film.pending[0]!.resolve();
    await film.settle();
    film.toggle.dispatchEvent(new Event("click"));
    film.intersect(0);
    film.motion(true);
    film.motion(false);
    film.intersect(0.8);
    expect(film.video.play).toHaveBeenCalledTimes(1);
    expect(film.video.paused).toBe(true);
    film.toggle.dispatchEvent(new Event("click"));
    expect(film.video.play).toHaveBeenCalledTimes(2);
  });

  it("keeps the poster after an autoplay rejection and permits a manual retry", async () => {
    const film = await setup();
    film.intersect(0.8);
    film.pending[0]!.reject();
    await film.settle();
    expect(film.attributes.has("data-playing")).toBe(false);
    expect(film.label.textContent).toBe("Play");
    film.video.paused = true;
    film.toggle.dispatchEvent(new Event("click"));
    expect(film.video.play).toHaveBeenCalledTimes(2);
  });
});
