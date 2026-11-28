/**
 * Warm only public document routes on navigation intent, never private/operator/API paths.
 * This is optional: normal links work without prefetch or the Network Information API.
 */
type ConnectionHints = { saveData?: boolean; effectiveType?: string };
const seen = new Set<string>();

function isPublicDocument(path: string): boolean {
  return (
    path === "/" ||
    path === "/plan-your-event/" ||
    path === "/privacy/" ||
    /^\/(?:services|stories)\/[a-z0-9-]+\/$/.test(path)
  );
}

const prefetch = (event: Event) => {
  // Read at intent time: users can change Data Saver or move between networks after page load.
  const connection = (navigator as Navigator & { connection?: ConnectionHints }).connection;
  if (
    document.hidden ||
    !navigator.onLine ||
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  ) {
    return;
  }
  const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
  if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
  const url = new URL(link.href, location.href);
  if (
    url.origin !== location.origin ||
    url.pathname === location.pathname ||
    !isPublicDocument(url.pathname) ||
    seen.has(url.pathname)
  ) {
    return;
  }
  seen.add(url.pathname);
  const tag = document.createElement("link");
  tag.rel = "prefetch";
  // Never speculate with query strings or fragments, including planner selections.
  tag.href = url.pathname;
  document.head.append(tag);
};

for (const type of ["pointerover", "focusin", "touchstart"]) {
  document.addEventListener(type, prefetch, { passive: true });
}
