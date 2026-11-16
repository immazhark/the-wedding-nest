export type TurnstileApi = {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** One shared script load per planner page. */
export function createTurnstileLoader() {
  let loading: Promise<TurnstileApi> | null = null;
  return function loadTurnstile(): Promise<TurnstileApi> {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (loading) return loading;
    const pending = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      let settled = false;
      const finish = (api?: TurnstileApi) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        script.onload = null;
        script.onerror = null;
        if (api) resolve(api);
        else {
          script.remove();
          reject(new Error("turnstile"));
        }
      };
      const deadline = setTimeout(() => finish(), 10_000);
      script.onload = () => finish(window.turnstile);
      script.onerror = () => finish();
      try {
        document.head.append(script);
      } catch {
        finish();
      }
    });
    loading = pending;
    // Clear every failed attempt, including a script that loads without exposing its API.
    // This also handles a synchronous append/load error without caching a rejection forever.
    void pending.catch(() => {
      if (loading === pending) loading = null;
    });
    return pending;
  };
}
