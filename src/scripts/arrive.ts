/**
 * Pages should land the instant they are chosen. On pointer-over, focus or touch-start, the
 * destination of an internal link is prefetched once, so the curtain transition reveals a page
 * that is already there. Skipped on data-saver connections.
 */
const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
if (!connection?.saveData) {
  const seen = new Set<string>();
  const prefetch = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    if (seen.has(url.pathname)) return;
    seen.add(url.pathname);
    const tag = document.createElement("link");
    tag.rel = "prefetch";
    tag.href = url.pathname;
    document.head.append(tag);
  };
  for (const type of ["pointerover", "focusin", "touchstart"]) {
    document.addEventListener(type, prefetch, { passive: true });
  }
}
