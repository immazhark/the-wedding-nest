/**
 * Silent looping films: play only while at least 40% visible, never with reduced motion, and the
 * visitor can always pause them. Without JavaScript or with reduced motion the poster stays.
 */
const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll<HTMLElement>("[data-loop]").forEach((frame) => {
  const video = frame.querySelector<HTMLVideoElement>("[data-loop-video]");
  const toggle = frame.querySelector<HTMLButtonElement>("[data-loop-toggle]");
  const label = frame.querySelector<HTMLElement>("[data-loop-toggle-label]");
  if (!video || !toggle || !label || calm.matches || !("IntersectionObserver" in window)) return;
  let userPaused = false;
  const show = (playing: boolean) => {
    frame.toggleAttribute("data-playing", playing);
    label.textContent = playing ? "Pause" : "Play";
  };
  const start = () =>
    video
      .play()
      .then(() => show(true))
      .catch(() => show(false));
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    userPaused = !video.paused;
    if (userPaused) {
      video.pause();
      show(false);
    } else void start();
  });
  new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting && !userPaused) void start();
      else {
        video.pause();
        if (!userPaused) show(false);
      }
    },
    { threshold: 0.4 },
  ).observe(frame);
});

export {};
