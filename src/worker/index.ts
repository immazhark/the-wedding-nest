/**
 * Worker entry. Static pages are served by Workers Static Assets; only /api/* runs this code
 * (see `run_worker_first` in wrangler.jsonc).
 */
import { handleEnquiry, type EnquiryEnv } from "./enquiry";
import { authenticateOperator, type OperatorAuthEnv } from "./operator-auth";
import { routeOperator } from "./operator-route";
import type { FetcherLike } from "./types";

interface Env extends EnquiryEnv, OperatorAuthEnv {
  ASSETS: FetcherLike;
}

// Access signing keys rotate rarely; cache per isolate so each request is not a network call.
let keyCache: { team: string; at: number; keys: (JsonWebKey & { kid?: string })[] } | undefined;
const KEY_TTL_MS = 10 * 60_000;
async function accessKeys(team: string) {
  if (keyCache?.team === team && Date.now() - keyCache.at < KEY_TTL_MS) return keyCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error("keys");
  const { keys } = (await res.json()) as { keys: (JsonWebKey & { kid?: string })[] };
  keyCache = { team, at: Date.now(), keys };
  return keys;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const operatorResponse = await routeOperator(request, env, {
      authenticate: (r) =>
        authenticateOperator(r, env, {
          keys: accessKeys,
          now: () => Math.floor(Date.now() / 1000),
        }),
      now: () => new Date().toISOString(),
      log: (entry) => console.log(JSON.stringify(entry)),
    }).catch(() =>
      Response.json(
        { error: "internal_error" },
        { status: 500, headers: { "cache-control": "no-store" } },
      ),
    );
    if (operatorResponse) return operatorResponse;
    if (pathname === "/api/enquiry") {
      try {
        return await handleEnquiry(request, env, {
          fetch: (input, init) => fetch(input, init),
          log: (entry) => console.log(JSON.stringify(entry)),
        });
      } catch {
        // Never surface or log the exception: it could carry request data. A fixed
        // JSON body replaces the platform's generic error page.
        console.log(JSON.stringify({ event: "enquiry", outcome: "internal_error", status: 500 }));
        return Response.json(
          { error: "internal_error" },
          {
            status: 500,
            headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
          },
        );
      }
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
