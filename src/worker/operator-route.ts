/** Routes /operator (UI) and /api/operator/* behind operator authentication. */
import { handleOperatorApi, type OperatorD1 } from "./operator-api";
import type { FetcherLike } from "./types";

export interface OperatorRouteEnv {
  ASSETS: FetcherLike;
  DB?: unknown;
}
export interface OperatorRouteDeps {
  /** Resolves the verified operator email or null. */
  authenticate: (request: Request) => Promise<string | null>;
  now: () => string;
  log: (entry: Record<string, string | number | boolean>) => void;
}

const BASE = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
};
const UI_CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; " +
  "frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

const isUi = (p: string) => p === "/operator" || p.startsWith("/operator/");
const isApi = (p: string) => p.startsWith("/api/operator/");

/** Returns null when the path is not an operator path. Unauthenticated callers get a plain 404. */
export async function routeOperator(
  request: Request,
  env: OperatorRouteEnv,
  deps: OperatorRouteDeps,
): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (!isUi(pathname) && !isApi(pathname)) return null;

  const operator = await deps.authenticate(request);
  if (!operator) return Response.json({ error: "not_found" }, { status: 404, headers: BASE });

  if (isApi(pathname)) {
    if (!env.DB) return Response.json({ error: "not_configured" }, { status: 503, headers: BASE });
    return handleOperatorApi(request, {
      db: env.DB as OperatorD1,
      operator,
      now: deps.now,
      log: deps.log,
    });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405, headers: { ...BASE, allow: "GET, HEAD" } },
    );
  }
  const asset = await env.ASSETS.fetch(request);
  const headers = new Headers(asset.headers);
  for (const [k, v] of Object.entries(BASE)) headers.set(k, v);
  headers.set("content-security-policy", UI_CSP);
  return new Response(asset.body, { status: asset.status, headers });
}
