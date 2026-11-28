/** Decorative service films: preserve the poster unless current interaction permits playback. */
const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
const connection = (
  navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }
).connection;

document.querySelectorAll<HTMLElement>(".door:has([data-door-film])").forEach((door) => {
  const film = door.querySelector<HTMLVideoElement>("[data-door-film]");
  if (!film) return;
  let hovered = false;
  let focused = false;
  let pending = false;
  let playing = false;
  let generation = 0;
  const allowed = () =>
    (hovered || focused) &&
    canHover.matches &&
    !calm.matches &&
    !connection?.saveData &&
    document.visibilityState === "visible";
  const stop = () => {
    generation++;
    pending = false;
    playing = false;
    film.pause();
    door.removeAttribute("data-film-on");
  };
  const sync = () => {
    if (!allowed()) {
      stop();
      return;
    }
    if (pending || playing) return;
    const src = film.dataset["src"];
    if (!src) return;
    if (!film.getAttribute("src")) film.src = src;
    const request = ++generation;
    pending = true;
    void film.play().then(
      () => {
        if (request !== generation) {
          if (!allowed()) film.pause();
          return;
        }
        pending = false;
        if (!allowed()) {
          stop();
          return;
        }
        playing = true;
        door.setAttribute("data-film-on", "");
      },
      () => {
        if (request !== generation) return;
        pending = false;
        playing = false;
        door.removeAttribute("data-film-on");
      },
    );
  };
  door.addEventListener("pointerenter", () => {
    hovered = true;
    sync();
  });
  door.addEventListener("pointerleave", () => {
    hovered = false;
    sync();
  });
  door.addEventListener("focusin", () => {
    focused = true;
    sync();
  });
  door.addEventListener("focusout", (event) => {
    focused = event.relatedTarget instanceof Node && door.contains(event.relatedTarget);
    sync();
  });
  calm.addEventListener("change", sync);
  canHover.addEventListener("change", sync);
  connection?.addEventListener?.("change", sync);
  document.addEventListener("visibilitychange", sync);
});

export {};
