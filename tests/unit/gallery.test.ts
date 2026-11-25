import { afterEach, describe, expect, it, vi } from "vitest";

async function setup(supported = true) {
  vi.resetModules();
  let activate: (event: MouseEvent) => void = () => {};
  const image = {
    getAttribute: () => "A genuine approved event photograph",
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    className: "",
  };
  const clone = { querySelectorAll: () => [], querySelector: () => image };
  const tile = {
    querySelector: () => ({ cloneNode: () => clone }),
    addEventListener: (event: string, callback: typeof activate) => {
      if (event === "click") activate = callback;
    },
    hasAttribute: () => false,
    target: "",
  };
  const showModal = vi.fn();
  const stage = { replaceChildren: vi.fn() };
  const caption = { textContent: "" };
  const dialog = {
    showModal: supported ? showModal : undefined,
    querySelector: (selector: string) => {
      if (selector === "[data-lightbox-stage]") return stage;
      if (selector === "[data-lightbox-caption]") return caption;
      return null;
    },
    addEventListener: vi.fn(),
  };
  vi.stubGlobal("document", {
    querySelector: (selector: string) =>
      selector === "[data-gallery]" ? { querySelectorAll: () => [tile] } : dialog,
  });
  await import("../../src/scripts/gallery");
  return {
    showModal,
    caption,
    click: (overrides: Partial<MouseEvent> = {}) => {
      const event = {
        button: 0,
        defaultPrevented: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
        ...overrides,
      };
      activate(event as unknown as MouseEvent);
      return event;
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("progressive service gallery", () => {
  it("enhances an ordinary photograph activation to the described native lightbox", async () => {
    const gallery = await setup();
    const event = gallery.click();
    expect(gallery.showModal).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(gallery.caption.textContent).toContain("1 of 1. A genuine approved event photograph");
  });

  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
    { defaultPrevented: true },
  ])("preserves native link behavior for %j", async (modifiers) => {
    const gallery = await setup();
    const event = gallery.click(modifiers);
    expect(gallery.showModal).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("leaves the link usable when modal dialogs are unsupported", async () => {
    const gallery = await setup(false);
    const event = gallery.click();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
