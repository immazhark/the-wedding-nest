/**
 * Silent looping films: play only while at least 40% visible, never with reduced motion, and the
 * visitor can pause them. Hidden documents stop playback; reduced motion or Save-Data keeps the
 * poster. Without JavaScript the poster stays.
 */
const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } })
  .connection;

document.querySelectorAll<HTMLElement>("[data-loop]").forEach((frame) => {
  const video = frame.querySelector<HTMLVideoElement>("[data-loop-video]");
  const toggle = frame.querySelector<HTMLButtonElement>("[data-loop-toggle]");
  const label = frame.querySelector<HTMLElement>("[data-loop-toggle-label]");
  if (!video || !toggle || !label || !("IntersectionObserver" in window)) return;
  let userPaused = false;
  let visible = false;
  let pending = false;
  let generation = 0;
  const allowed = () =>
    visible &&
    document.visibilityState === "visible" &&
    !calm.matches &&
    !connection?.saveData &&
    !userPaused;
  const show = (playing: boolean) => {
    frame.toggleAttribute("data-playing", playing);
    label.textContent = playing ? "Pause" : "Play";
  };
  const stop = () => {
    generation++;
    pending = false;
    video.pause();
    show(false);
  };
  const start = () => {
    if (!allowed() || pending) return;
    if (!video.paused) {
      show(true);
      return;
    }
    const request = ++generation;
    pending = true;
    void video.play().then(
      () => {
        // A play promise may settle after a scroll, explicit pause or preference change.
        // Never let that stale completion replace the poster or interrupt a newer request.
        if (request !== generation) {
          if (!allowed()) video.pause();
          return;
        }
        pending = false;
        if (allowed() && !video.paused) show(true);
        else stop();
      },
      () => {
        if (request !== generation) return;
        pending = false;
        show(false);
      },
    );
  };
  const sync = () => {
    toggle.hidden = calm.matches || connection?.saveData === true;
    if (allowed()) start();
    else stop();
  };
  show(false);
  toggle.hidden = calm.matches || connection?.saveData === true;
  toggle.addEventListener("click", () => {
    userPaused = !video.paused;
    sync();
  });
  calm.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  connection?.addEventListener("change", sync);
  new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.4;
      sync();
    },
    { threshold: 0.4 },
  ).observe(frame);
});

export {};
