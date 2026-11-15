/**
 * Worker entry. Static pages are served by Workers Static Assets; only /api/* runs this code
 * (see `run_worker_first` in wrangler.jsonc).
 */
import { handleEnquiry, type EnquiryEnv } from "./enquiry";
import type { FetcherLike } from "./types";

interface Env extends EnquiryEnv {
  ASSETS: FetcherLike;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/enquiry") {
      return handleEnquiry(request, env, {
        fetch: (input, init) => fetch(input, init),
        log: (entry) => console.log(JSON.stringify(entry)),
      });
    }
    if (pathname.startsWith("/api/")) {
      return Response.json(
        { error: "not_found" },
        { status: 404, headers: { "cache-control": "no-store" } },
      );
    }
    return env.ASSETS.fetch(request);
  },
};
