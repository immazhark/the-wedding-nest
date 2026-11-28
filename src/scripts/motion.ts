/**
 * Home-page motion (progressive enhancement). Nothing here is needed to read or use the page:
 * without JavaScript, with reduced motion, or if GSAP fails to load, every element is already
 * in its final, readable place. GSAP is loaded after first paint so it never competes with LCP.
 *
 * Narrative, in order: gold dust in the light -> the camera pushes toward the stage -> the arch
 * opens on the kitchen -> the occasions are read out one by one -> the work unveils itself.
 */

const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

/** A brief, optional opening flourish; never an indefinite animation. */
function startDust(): void {
  const constrained = () => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    return (
      connection?.saveData ||
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g"
    );
  };
  if (
    calm.matches ||
    constrained() ||
    typeof ResizeObserver === "undefined" ||
    typeof IntersectionObserver === "undefined"
  ) {
    return;
  }
  const canvas = document.querySelector<HTMLCanvasElement>("[data-dust]");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const stage = canvas.parentElement;
  if (!stage) return;
  const small = window.matchMedia("(max-width: 47.99rem)").matches;
  const count = small ? 22 : 42;
  const motes = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.6 + Math.random() * 1.6,
    a: 0.15 + Math.random() * 0.45,
    s: 0.015 + Math.random() * 0.04,
    p: Math.random() * Math.PI * 2,
  }));
  let w = 0;
  let h = 0;
  let raf = 0;
  let visible = false;
  let finished = false;
  let lastFrame: number | undefined;
  const duration = 4500;
  const deadline = performance.now() + duration;
  let expiry: ReturnType<typeof setTimeout>;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = stage.clientWidth;
    h = stage.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const stop = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    clearTimeout(expiry);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", run);
    calm.removeEventListener("change", run);
    ctx.clearRect(0, 0, w, h);
  };
  const frame = (t: number) => {
    if (finished) return;
    if (t >= deadline || calm.matches || constrained()) {
      stop();
      return;
    }
    const elapsed = lastFrame === undefined ? 0 : Math.min((t - lastFrame) / 1000, 0.05);
    lastFrame = t;
    const fade = Math.min(1, (deadline - t) / 700);
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.y -= m.s * elapsed;
      if (m.y < -0.02) {
        m.y = 1.02;
        m.x = Math.random();
      }
      const tw = 0.6 + 0.4 * Math.sin(t / 1400 + m.p);
      ctx.beginPath();
      ctx.fillStyle = `rgba(219, 166, 70, ${(m.a * tw * fade).toFixed(3)})`;
      ctx.arc(m.x * w + Math.sin(t / 2600 + m.p) * 12, m.y * h, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  };
  const run = () => {
    if (finished) return;
    cancelAnimationFrame(raf);
    lastFrame = undefined;
    if (performance.now() >= deadline || calm.matches || constrained()) {
      stop();
      return;
    }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    run();
  });
  expiry = setTimeout(stop, duration);
  resize();
  resizeObserver.observe(stage);
  document.addEventListener("visibilitychange", run);
  calm.addEventListener("change", run);
  intersectionObserver.observe(stage);
  run();
}

async function startScrollStory(): Promise<void> {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  gsap.registerPlugin(ScrollTrigger);
  // Mobile browser chrome resizing the viewport must not re-flow the story.
  ScrollTrigger.config({ ignoreMobileResize: true });

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const desktop = window.matchMedia("(min-width: 48rem)").matches;

    // 1. The camera pushes toward the stage while the headline drifts away. Pinned briefly on
    // larger screens (0.7 of a viewport), a plain scrubbed push-in on phones.
    const stage = document.querySelector<HTMLElement>(".grand-stage");
    if (stage) {
      const hero = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: desktop ? "top 72px" : "top 20%",
          end: () => `+=${Math.round(window.innerHeight * (desktop ? 0.7 : 0.6))}`,
          pin: desktop,
          // The space is reserved in CSS (html.js .grand), so pinning never shifts the layout.
          pinSpacing: false,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      hero
        .to(".grand-photo", { scale: desktop ? 1.28 : 1.18, yPercent: -3 }, 0)
        .to(".grand-copy", { yPercent: -26, opacity: 0, ease: "power1.in" }, 0.25);
    }

    // 2. The arch opens on the kitchen: the frame widens from a slit and the footage settles.
    const arch = document.querySelector<HTMLElement>(".kitchen-arch");
    if (arch) {
      gsap.fromTo(
        arch,
        { clipPath: "inset(38% 22% 22% 22% round 999px 999px 20px 20px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 999px 999px 20px 20px)",
          ease: "power2.out",
          scrollTrigger: { trigger: arch, start: "top 88%", end: "top 35%", scrub: 0.5 },
        },
      );
      gsap.fromTo(
        ".kitchen-poster, .kitchen-video",
        { scale: 1.35 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: arch, start: "top bottom", end: "bottom 40%", scrub: true },
        },
      );
    }
    gsap.from(".menu-rail li", {
      x: 36,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.1,
      clearProps: "all",
      scrollTrigger: { trigger: ".menu-rail", start: "top 85%", once: true },
    });

    // 3. The occasions are read out one by one, each line unveiled from the top.
    gsap.utils.toArray<HTMLElement>(".occasion-row").forEach((row) => {
      gsap.fromTo(
        row,
        { clipPath: "inset(0 0 100% 0)" },
        {
          clipPath: "inset(0 0 -2px 0)",
          duration: 1.1,
          ease: "power3.out",
          clearProps: "clipPath",
          scrollTrigger: { trigger: row, start: "top 90%", once: true },
        },
      );
    });

    // 4. The work unveils itself: a curtain of crop, and the photograph settling inside it.
    gsap.utils.toArray<HTMLElement>(".work-grid figure").forEach((figure) => {
      const box = figure.firstElementChild as HTMLElement | null;
      const media = figure.querySelector<HTMLElement>(".frame-media");
      if (box) {
        gsap.fromTo(
          box,
          { clipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            duration: 1.2,
            ease: "power3.out",
            clearProps: "clipPath",
            scrollTrigger: { trigger: figure, start: "top 88%", once: true },
          },
        );
      }
      if (media) {
        gsap.fromTo(
          media,
          { scale: 1.2 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: figure, start: "top bottom", end: "bottom 30%", scrub: true },
          },
        );
      }
    });
  });
}

if (!calm.matches) {
  document.documentElement.classList.add("motion-ok");
  startDust();
  const idle: (cb: () => void) => void =
    "requestIdleCallback" in window
      ? (cb) => window.requestIdleCallback(cb, { timeout: 1500 })
      : (cb) => window.setTimeout(cb, 700);
  idle(() => {
    startScrollStory().catch(() => {
      // Motion is an enhancement: release the reserved pin space so the page stays complete.
      document.documentElement.classList.add("motion-failed");
    });
  });
}
