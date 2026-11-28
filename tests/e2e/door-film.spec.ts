import { expect, test } from "@playwright/test";

test("decorative service film ignores stale playback and live reduced motion", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Service-door films are restricted to fine-pointer hover devices");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    const pause = HTMLMediaElement.prototype.pause;
    const requests = new WeakMap<HTMLMediaElement, Array<() => void>>();
    HTMLMediaElement.prototype.play = function () {
      if (!this.hasAttribute("data-door-film")) return play.call(this);
      let queue = requests.get(this);
      if (!queue) {
        queue = [];
        requests.set(this, queue);
      }
      this.dataset["testPlays"] = String(queue.length + 1);
      return new Promise<void>((resolve) => queue.push(resolve));
    };
    HTMLMediaElement.prototype.pause = function () {
      if (!this.hasAttribute("data-door-film")) pause.call(this);
    };
    document.addEventListener("door-test-resolve", (event) => {
      const video = event.target;
      if (video instanceof HTMLMediaElement) {
        const index = Number(video.dataset["testResolve"]);
        requests.get(video)?.[index]?.();
      }
    });
  });
  await page.route(/\/media\/.*\.mp4$/, (route) => route.abort());
  await page.goto("/");
  const door = page.locator(".door:has([data-door-film])").first();
  const film = door.locator("[data-door-film]");
  const resolve = (index: number) =>
    film.evaluate((video, i) => {
      (video as HTMLElement).dataset["testResolve"] = String(i);
      video.dispatchEvent(new Event("door-test-resolve", { bubbles: true }));
    }, index);
  await door.dispatchEvent("pointerenter");
  await expect(film).toHaveAttribute("data-test-plays", "1");
  await door.dispatchEvent("pointerleave");
  await resolve(0);
  await expect(door).not.toHaveAttribute("data-film-on", "");
  await door.dispatchEvent("pointerenter");
  await expect(film).toHaveAttribute("data-test-plays", "2");
  await resolve(1);
  await expect(door).toHaveAttribute("data-film-on", "");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(door).not.toHaveAttribute("data-film-on", "");
  await door.dispatchEvent("pointerleave");
  await door.dispatchEvent("pointerenter");
  await expect(film).toHaveAttribute("data-test-plays", "2");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(film).toHaveAttribute("data-test-plays", "3");
  await resolve(2);
  await expect(door).toHaveAttribute("data-film-on", "");
});
