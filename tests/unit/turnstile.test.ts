import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTurnstileLoader, type TurnstileApi } from "../../src/lib/enquiry/turnstile";

type Script = {
  src: string;
  async: boolean;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  remove: ReturnType<typeof vi.fn>;
};

describe("Turnstile script loading", () => {
  let scripts: Script[];
  let browser: { turnstile?: TurnstileApi };
  const api = { render: vi.fn(() => "widget"), reset: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    scripts = [];
    browser = {};
    vi.stubGlobal("window", browser);
    vi.stubGlobal("document", {
      createElement: () => ({
        src: "",
        async: false,
        onload: null,
        onerror: null,
        remove: vi.fn(),
      }),
      head: { append: (script: Script) => scripts.push(script) },
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("bounds a stalled load, cleans it up and permits a fresh attempt", async () => {
    const load = createTurnstileLoader();
    const failure = vi.fn();
    const pending = load();
    pending.catch(failure);
    expect(load()).toBe(pending);
    const lateLoad = scripts[0]!.onload;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(failure).toHaveBeenCalledOnce();
    expect(scripts[0]!.remove).toHaveBeenCalledOnce();
    expect(scripts[0]!.onload).toBeNull();
    const retry = load();
    expect(scripts).toHaveLength(2);
    lateLoad?.();
    browser.turnstile = api;
    scripts[1]!.onload?.();
    await expect(retry).resolves.toBe(api);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retries when a loaded script did not expose the API", async () => {
    const load = createTurnstileLoader();
    const first = load();
    const rejected = expect(first).rejects.toThrow("turnstile");
    scripts[0]!.onload?.();
    await rejected;
    const retry = load();
    expect(scripts).toHaveLength(2);
    browser.turnstile = api;
    scripts[1]!.onload?.();
    await expect(retry).resolves.toBe(api);
  });

  it("shares a successful load and clears its deadline", async () => {
    const load = createTurnstileLoader();
    const first = load();
    expect(load()).toBe(first);
    browser.turnstile = api;
    scripts[0]!.onload?.();
    await expect(first).resolves.toBe(api);
    await expect(load()).resolves.toBe(api);
    expect(scripts).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans failed network loads before a retry", async () => {
    const load = createTurnstileLoader();
    const first = load();
    const rejected = expect(first).rejects.toThrow("turnstile");
    scripts[0]!.onerror?.();
    await rejected;
    expect(scripts[0]!.remove).toHaveBeenCalledOnce();
    const retry = load();
    browser.turnstile = api;
    scripts[1]!.onload?.();
    await expect(retry).resolves.toBe(api);
    expect(vi.getTimerCount()).toBe(0);
  });
});
