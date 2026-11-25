/**
 * Lightbox for the service gallery. Progressive enhancement: the mosaic is already usable as a
 * set of photographs; this only adds the enlarged view. The enlarged picture reuses the tile's
 * own <picture> (same responsive AVIF/WebP candidates), so no extra image is generated or fetched
 * until a tile is opened.
 */
const root = document.querySelector<HTMLElement>("[data-gallery]");
const dialog = document.querySelector<HTMLDialogElement>("[data-lightbox]");

if (root && dialog && typeof dialog.showModal === "function") {
  const tiles = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-gallery-open]"));
  const stage = dialog.querySelector<HTMLElement>("[data-lightbox-stage]")!;
  const caption = dialog.querySelector<HTMLElement>("[data-lightbox-caption]")!;
  let current = 0;

  const show = (index: number) => {
    current = (index + tiles.length) % tiles.length;
    const source = tiles[current]!.querySelector<HTMLElement>("picture");
    if (!source) return;
    const clone = source.cloneNode(true) as HTMLElement;
    const sizes = "min(94vw, 1600px)";
    clone.querySelectorAll("source").forEach((s) => s.setAttribute("sizes", sizes));
    const img = clone.querySelector("img")!;
    const alt = img.getAttribute("data-full-alt") ?? "";
    img.setAttribute("sizes", sizes);
    img.setAttribute("alt", alt);
    img.removeAttribute("loading");
    img.className = "lightbox-img";
    stage.replaceChildren(clone);
    caption.textContent = `${current + 1} of ${tiles.length}. ${alt}`;
  };

  tiles.forEach((tile, index) =>
    tile.addEventListener("click", (event) => {
      // Modified clicks retain the link's native new-tab/window/download behavior.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      show(index);
      dialog.showModal();
      event.preventDefault();
    }),
  );
  dialog.querySelector("[data-lightbox-close]")?.addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => show(current - 1));
  dialog.querySelector("[data-lightbox-next]")?.addEventListener("click", () => show(current + 1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });
  // A click on the dark backdrop (the dialog element itself) closes it.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

export {};
